import re
from pathlib import Path
p = Path(r"c:\Users\abdel\OneDrive\Desktop\vipx.m3u")
text = p.read_text(encoding='utf-8', errors='replace')
lines = text.splitlines()
entries = []
i = 0
while i < len(lines):
    l = lines[i].strip()
    if not l:
        i += 1; continue
    if l.upper().startswith('#EXTINF'):
        extinf = l
        j = i+1
        url = None
        while j < len(lines):
            cand = lines[j].strip()
            if not cand:
                j += 1; continue
            if cand.startswith('#'):
                j += 1; continue
            url = cand; break
        if url is None: break
        m = re.search(r'group-title="([^"]+)"', extinf, re.I)
        group = m.group(1).strip() if m else ''
        title = extinf.split(',',1)[1].strip() if ',' in extinf else ''
        entries.append({'title':title,'group':group,'url':url})
        i = j+1
    else:
        i += 1

kw = ['football','soccer','futbol','premier','la liga','champions','liga','serie a','match','دوري','كأس']
matches = [e for e in entries if any(k in (e['title']+' '+e['group']+' '+e['url']).lower() for k in kw)]
print('Total entries:', len(entries))
print('Matches:', len(matches))
for e in matches[:40]:
    print(e['title'],'|',e['group'],'|',e['url'])

# show some live-like entries (urls without extension)
nosfx = [e for e in entries if not re.search(r'\.(m3u8|m3u|mp4|mkv|ts)$', e['url'], re.I)]
print('\nEntries with no file extension (may be stream ids):', len(nosfx))
for e in nosfx[:20]:
    print(e['title'],'|',e['url'])
