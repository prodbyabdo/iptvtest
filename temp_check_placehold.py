import json

try:
    with open(r'C:\Users\abdel\Downloads\localhost.har', 'r', encoding='utf-8') as f:
        har = json.load(f)
        
    entries = [e for e in har.get('log', {}).get('entries', []) if 'placehold.co' in e.get('request', {}).get('url', '')]
    if not entries:
        print("No requests to placehold.co found.")
    else:
        for e in entries[:10]:
            print(f"Status: {e.get('response', {}).get('status')} URL: {e.get('request', {}).get('url')}")
except Exception as e:
    print("Error:", e)
