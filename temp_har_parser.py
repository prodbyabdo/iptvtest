import json
import sys

def parse_har():
    try:
        with open(r'C:\Users\abdel\Downloads\localhost.har', 'r', encoding='utf-8') as f:
            har = json.load(f)
            
        entries = har.get('log', {}).get('entries', [])
        failed_requests = []
        for e in entries:
            req = e.get('request', {})
            res = e.get('response', {})
            url = req.get('url', '')
            status = res.get('status', 0)
            
            # Check if it's an image or proxy
            if ('image' in res.get('content', {}).get('mimeType', '') or 
                '/proxy?url=' in url or 
                status >= 400 or status == 0):
                
                if status >= 400 or status == 0:
                    error_text = res.get('_error', res.get('statusText', 'Unknown'))
                    failed_requests.append(f"Status: {status} URL: {url[:150]}... Error: {error_text}")
                    
        for msg in failed_requests[:20]:
            print(msg)
            
        if not failed_requests:
            print("No failed image/proxy requests found.")
    except Exception as e:
        print("Error reading HAR:", e)

if __name__ == '__main__':
    parse_har()
