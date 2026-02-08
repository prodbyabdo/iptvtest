import http.server
import socketserver
import json
import socket
import sys
import threading
import time
import requests
import xml.etree.ElementTree as ET
from urllib.parse import urlparse

# Configuration
PORT = 8000
DIRECTORY = "."

class ScanDelegate:
    def __init__(self):
        self.devices = {}

    def add_device(self, location, st):
        if location not in self.devices:
            print(f"Found device at {location}")
            self.devices[location] = st

dlna_devices = {}

def discover_devices(timeout=3):
    """
    SSDP Discovery to find DLNA Renderers.
    """
    global dlna_devices
    dlna_devices = {}
    
    SSDP_ADDR = "239.255.255.250"
    SSDP_PORT = 1900
    SSDP_MX = 1
    SSDP_ST = "urn:schemas-upnp-org:service:AVTransport:1"

    ssdpRequest = "M-SEARCH * HTTP/1.1\r\n" + \
                  f"HOST: {SSDP_ADDR}:{SSDP_PORT}\r\n" + \
                  f"MAN: \"ssdp:discover\"\r\n" + \
                  f"MX: {SSDP_MX}\r\n" + \
                  f"ST: {SSDP_ST}\r\n" + \
                  "\r\n"

    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(timeout)
    
    try:
        sock.sendto(ssdpRequest.encode(), (SSDP_ADDR, SSDP_PORT))
        
        start = time.time()
        while time.time() - start < timeout:
            try:
                data, addr = sock.recvfrom(1024)
                response = data.decode()
                headers = {}
                for line in response.splitlines():
                    if ": " in line:
                        k, v = line.split(": ", 1)
                        headers[k.lower()] = v.strip()
                
                location = headers.get("location")
                if location:
                    dlna_devices[location] = headers
            except socket.timeout:
                break
    except Exception as e:
        print(f"Discovery error: {e}")
    finally:
        sock.close()
    
    return dlna_devices

def get_control_url(location):
    """
    Fetch the XML description to find the AVTransport Control URL.
    """
    try:
        r = requests.get(location, timeout=2)
        root = ET.fromstring(r.text)
        ns = {'t': 'urn:schemas-upnp-org:device-1-0', 's': 'urn:schemas-upnp-org:service-1-0'} # Basic namespace map, might vary

        # Very rough XML parsing because UPnP namespaces are pain
        # We look for the service with serviceType == AVTransport:1
        
        # Strip namespaces to make life easier
        xml_str = r.text
        # Simple extraction using string matching if ElementTree is tricky with namespaces
        # Find <serviceType>urn:schemas-upnp-org:service:AVTransport:1</serviceType>
        # Then find the sibling <controlURL>
        
        # Let's try standard parsing ignoring namespaces roughly or using wildcard
        # For now, quick hack:
        items = xml_str.split("<service>")
        for item in items:
            if "AVTransport:1" in item:
                # Extract controlURL
                start = item.find("<controlURL>")
                if start != -1:
                    start += len("<controlURL>")
                    end = item.find("</controlURL>", start)
                    control_path = item[start:end]
                    
                    # Normalize URL
                    parsed = urlparse(location)
                    return f"{parsed.scheme}://{parsed.netloc}{control_path}" if control_path.startswith("/") else control_path
    except Exception as e:
        print(f"Error getting control URL fro {location}: {e}")
    return None

import html

def generate_didl_lite(url, title="IPTV Stream", mime_type="video/mp4"):
    """
    Generate DIDL-Lite XML metadata.
    Samsung and other DLNA renderers often require this to accept a stream.
    """
    # Basic guess for protocolInfo. 
    # http-get:*:video/mp4:* is a safe common default for http video.
    protocol_info = f"http-get:*:{mime_type}:*"

    didl = f"""<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/" xmlns:dlna="urn:schemas-dlna-org:metadata-1-0/">
    <item id="1" parentID="0" restricted="1">
        <dc:title>{html.escape(title)}</dc:title>
        <dc:creator>IPTV Pro</dc:creator>
        <upnp:class>object.item.videoItem</upnp:class>
        <res protocolInfo="{protocol_info}">{html.escape(url)}</res>
    </item>
</DIDL-Lite>"""
    return didl

def cast_to_device(control_url, media_url):
    """
    Send SetAVTransportURI and Play commands to the device.
    """
    soap_action_base = "urn:schemas-upnp-org:service:AVTransport:1"
    
    # Generate metadata
    # Try to guess mime type from extension, default to video/mp4 (best compatibility)
    mime = "video/mp4"
    if ".mkv" in media_url:
        mime = "video/x-matroska"
    elif ".m3u8" in media_url:
        mime = "application/x-mpegURL"
        
    metadata = generate_didl_lite(media_url, "IPTV Stream", mime)
    
    # 1. SetAVTransportURI
    payload_uri = f"""<?xml version="1.0" encoding="utf-8"?>
    <s:Envelope s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
      <s:Body>
        <u:SetAVTransportURI xmlns:u="{soap_action_base}">
          <InstanceID>0</InstanceID>
          <CurrentURI>{media_url}</CurrentURI>
          <CurrentURIMetaData>{html.escape(metadata)}</CurrentURIMetaData>
        </u:SetAVTransportURI>
      </s:Body>
    </s:Envelope>"""

    headers = {
        "Content-Type": "text/xml; charset=\"utf-8\"",
        "SOAPAction": f"\"{soap_action_base}#SetAVTransportURI\""
    }

    print(f"Setting URI to {media_url} on {control_url}")
    try:
        r = requests.post(control_url, data=payload_uri, headers=headers)
        if r.status_code != 200:
            print(f"SetURI Failed: {r.status_code} {r.text}")
            return False
    except Exception as e:
        print(f"SetURI Exception: {e}")
        return False

    # 2. Play
    payload_play = f"""<?xml version="1.0" encoding="utf-8"?>
    <s:Envelope s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
      <s:Body>
        <u:Play xmlns:u="{soap_action_base}">
          <InstanceID>0</InstanceID>
          <Speed>1</Speed>
        </u:Play>
      </s:Body>
    </s:Envelope>"""
    
    headers["SOAPAction"] = f"\"{soap_action_base}#Play\""

    print("Sending Play command...")
    try:
        r = requests.post(control_url, data=payload_play, headers=headers)
        if r.status_code != 200:
            print(f"Play Failed: {r.status_code} {r.text}")
            return False
        return True
    except Exception as e:
        print(f"Play Exception: {e}")
        return False


class PlayerHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/cast':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data)
                url_to_cast = data.get('url')
                
                if not url_to_cast:
                    self.send_error(400, "Missing 'url' field")
                    return

                print(f"Scanning for devices to cast: {url_to_cast}")
                devices = discover_devices()
                
                if not devices:
                    print("No DLNA devices found")
                    self.send_json({"success": False, "message": "No TVs found on network."})
                    return
                
                # Pick the first one (Samsung TVs usually appear here)
                target_location = list(devices.keys())[0]
                print(f"Found target: {target_location}")
                
                control_url = get_control_url(target_location)
                if not control_url:
                    self.send_json({"success": False, "message": "Could not control TV."})
                    return

                # PROXY STRATEGY:
                # The TV might fail to open the external URL directly (DNS, geo-block, headers).
                # We tell the TV to stream from US (the laptop).
                # Get local IP
                s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                try:
                    # doesn't even have to be reachable
                    s.connect(('10.255.255.255', 1))
                    local_ip = s.getsockname()[0]
                except Exception:
                    local_ip = '127.0.0.1'
                finally:
                    s.close()
                
                # Construct proxy URL
                # Use query param properly encoded
                from urllib.parse import quote
                proxied_url = f"http://{local_ip}:{PORT}/proxy?url={quote(url_to_cast)}"
                print(f"Proxying cast to: {proxied_url}")

                success = cast_to_device(control_url, proxied_url)
                
                if success:
                    self.send_json({"success": True, "message": "Casting started! (Proxied)"})
                else:
                    self.send_json({"success": False, "message": "TV refused connection."})

            except Exception as e:
                print(e)
                self.send_error(500, str(e))
        else:
            self.send_error(404)

    def do_GET(self):
        if self.path.startswith('/proxy'):
            # Simple proxy to bypass CORS for images
            # Usage: /proxy?url=HTTP_URL
            query = urlparse(self.path).query
            if 'url=' in query:
                target_url = query.split('url=', 1)[1]
                # Decode
                from urllib.parse import unquote
                target_url = unquote(target_url) 
                
                try:
                    # Fetch external resource
                    # STREAMING is critical here
                    print(f"Proxying request for: {target_url}")
                    resp = requests.get(target_url, stream=True, timeout=10)
                    self.send_response(resp.status_code)
                    self.send_header('Access-Control-Allow-Origin', '*')
                    content_type = resp.headers.get('Content-Type')
                    if content_type:
                        self.send_header('Content-Type', content_type)
                    self.end_headers()
                    # Stream back
                    for chunk in resp.iter_content(chunk_size=65536):
                         if not chunk: break
                         self.wfile.write(chunk)
                except Exception as e:
                    print(f"Proxy error: {e}")
                    # Only send error if headers haven't been sent yet? 
                    # Hard to know status, just log it.
            else:
                self.send_error(400)
            return
            
        # Default behavior for other files
        super().do_GET()

    def send_json(self, data):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
        
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

class ThreadingSimpleServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    pass

print(f"Starting server at http://localhost:{PORT}")
print("Run `iptv-pro-player_cast.html` in your browser from this server:")
print(f"http://localhost:{PORT}/iptv-pro-player_cast.html")

# UPDATED: Use ThreadingSimpleServer to handle multiple requests (proxy + serving + api) at once
httpd = ThreadingSimpleServer(("", PORT), PlayerHandler)
try:
    httpd.serve_forever()
except KeyboardInterrupt:
    pass
httpd.server_close()
