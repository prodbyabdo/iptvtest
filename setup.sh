#!/bin/bash
# IPTV Pro Player - Quick Setup Script
# Run this to verify all files are in place

echo "🎬 IPTV Pro Player - Setup Verification"
echo "========================================"

files=(
  "iptv-pro-player.html"
  "football-api.js"
  "omdb-api.js"
  "README.md"
  "API_REFERENCE.md"
)

missing=0

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    size=$(wc -c < "$file")
    echo "✓ $file ($(numfmt --to=iec-i --suffix=B $size 2>/dev/null || echo "$size bytes"))"
  else
    echo "✗ $file (MISSING)"
    missing=$((missing + 1))
  fi
done

echo ""
if [ $missing -eq 0 ]; then
  echo "✅ All files found! Ready to use."
  echo ""
  echo "Next steps:"
  echo "1. Open iptv-pro-player.html in your browser"
  echo "2. Click ⚙️ Settings"
  echo "3. Configure your IPTV credentials and API keys"
  echo "4. Click 💾 Save Settings"
  echo "5. Start exploring!"
else
  echo "❌ Missing $missing file(s). Please ensure all files are in the same directory."
fi

echo ""
echo "📝 For setup help, see README.md"
echo "🔧 For API details, see API_REFERENCE.md"
