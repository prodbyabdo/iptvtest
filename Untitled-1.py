"""xstream IPTV -> split into live, movies and shows .m3u files

Usage examples:
  python Untitled-1.py --url "http://server/get.php?username=USER&password=PASS&type=m3u" 
  python Untitled-1.py --input playlist.m3u --outdir out

The script splits entries by `group-title` or by simple keyword matching
and writes three files: `live.m3u`, `movies.m3u`, `shows.m3u` in the
output directory (current directory by default).
"""
from __future__ import annotations

import argparse
import os
import re
import sys
from typing import Dict, List, Optional

try:
	import requests
except Exception:
	requests = None


def fetch_url(url: str, timeout: int = 20) -> str:
	if requests:
		resp = requests.get(url, timeout=timeout)
		resp.raise_for_status()
		return resp.text
	# fallback
	from urllib.request import urlopen

	with urlopen(url, timeout=timeout) as r:
		return r.read().decode("utf-8", errors="replace")


def parse_m3u(content: str) -> List[Dict[str, Optional[str]]]:
	"""Parse M3U content into list of entries.

	Each entry is a dict with keys: 'extinf', 'url', 'group', 'title'
	"""
	lines = content.splitlines()
	i = 0
	entries: List[Dict[str, Optional[str]]] = []
	while i < len(lines):
		line = lines[i].strip()
		if not line:
			i += 1
			continue
		if line.upper().startswith("#EXTINF"):
			extinf = line
			# find next non-empty, non-comment line for url
			j = i + 1
			url = None
			while j < len(lines):
				cand = lines[j].strip()
				if not cand:
					j += 1
					continue
				if cand.startswith("#"):
					j += 1
					continue
				url = cand
				break
			if url is None:
				break
			# extract group-title
			m = re.search(r'group-title="([^"]+)"', extinf, re.I)
			group = m.group(1).strip() if m else None
			title = extinf.split(",", 1)[1].strip() if "," in extinf else None
			entries.append({"extinf": extinf, "url": url, "group": group, "title": title})
			i = j + 1
		else:
			i += 1
	return entries


def categorize_entry(entry: Dict[str, Optional[str]]) -> str:
	"""Return one of: 'movies', 'shows', 'live'"""
	group = (entry.get("group") or "").lower()
	title = (entry.get("title") or "").lower()
	url = (entry.get("url") or "").lower()

	movie_keys = ["movie", "film", "movies", "films"]
	show_keys = ["show", "series", "serial", "episode", "tv series", "tvshows", "tv-show"]

	for k in movie_keys:
		if k in group or k in title or k in url:
			return "movies"

	for k in show_keys:
		if k in group or k in title or k in url:
			return "shows"

	# if group exists and not keywords, use live as default
	return "live"


def write_m3u(entries: List[Dict[str, Optional[str]]], path: str) -> None:
	os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
	with open(path, "w", encoding="utf-8") as f:
		f.write("#EXTM3U\n")
		for e in entries:
			f.write(e["extinf"] + "\n")
			f.write(e["url"] + "\n")


def main(argv: Optional[List[str]] = None) -> int:
	parser = argparse.ArgumentParser(description="Split xstream/m3u into live/movies/shows .m3u files")
	group = parser.add_mutually_exclusive_group(required=True)
	group.add_argument("--url", help="URL to an m3u (xstream get.php ... or raw m3u)")
	group.add_argument("--input", help="Local m3u file path")
	parser.add_argument("--outdir", default=".", help="Output directory")
	parser.add_argument("--live", default="live.m3u", help="Filename for live output")
	parser.add_argument("--movies", default="movies.m3u", help="Filename for movies output")
	parser.add_argument("--shows", default="shows.m3u", help="Filename for shows output")
	parser.add_argument("--dry-run", action="store_true", help="Don't write files; just print stats")

	args = parser.parse_args(argv)

	if args.url:
		print(f"Fetching: {args.url}")
		try:
			content = fetch_url(args.url)
		except Exception as ex:
			print("Error fetching URL:", ex, file=sys.stderr)
			return 2
	else:
		with open(args.input, "r", encoding="utf-8") as f:
			content = f.read()

	entries = parse_m3u(content)
	cats = {"live": [], "movies": [], "shows": []}
	for e in entries:
		cat = categorize_entry(e)
		cats[cat].append(e)

	print(f"Total entries parsed: {len(entries)}")
	for k in ["live", "movies", "shows"]:
		print(f"  {k}: {len(cats[k])}")

	if args.dry_run:
		return 0

	out_live = os.path.join(args.outdir, args.live)
	out_movies = os.path.join(args.outdir, args.movies)
	out_shows = os.path.join(args.outdir, args.shows)

	write_m3u(cats["live"], out_live)
	write_m3u(cats["movies"], out_movies)
	write_m3u(cats["shows"], out_shows)

	print("Wrote:")
	print(" ", out_live)
	print(" ", out_movies)
	print(" ", out_shows)
	return 0


if __name__ == "__main__":
	raise SystemExit(main())

