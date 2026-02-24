"""Extract BeIN Sports channels from an M3U playlist file."""
import re
import sys
from pathlib import Path


def main():
    # Accept path via CLI argument, default to iptv.m3u in current directory
    if len(sys.argv) > 1:
        p = Path(sys.argv[1])
    else:
        p = Path("iptv.m3u")

    if not p.exists():
        print(f"File not found: {p}")
        print("Usage: python extract_bein.py [path/to/playlist.m3u]")
        sys.exit(1)

    print(f"Reading {p}...")
    try:
        text = p.read_text(encoding='utf-8', errors='replace')
    except Exception as e:
        print(f"Error reading file: {e}")
        sys.exit(1)

    lines = text.splitlines()
    entries = []

    for line in lines:
        line = line.strip()
        if line.startswith("#EXTINF") and "bein" in line.lower():
            group = ""
            m = re.search(r'group-title="([^"]+)"', line)
            if m:
                group = m.group(1)
            name = line.rsplit(',', 1)[-1].strip()
            entries.append(f"[{group}] {name}")

    print(f"Found {len(entries)} BeIN channels.")
    print("-" * 40)
    for e in entries[:50]:
        print(e)
    print("-" * 40)
    if len(entries) > 50:
        print(f"... and {len(entries) - 50} more.")


if __name__ == "__main__":
    main()
