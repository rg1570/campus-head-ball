#!/bin/bash
set -e
cd "$(dirname "$0")"
ROOT="$(pwd)"
if [ ! -f "$ROOT/public/index.html" ]; then
  echo "HATA: ZIP'in içindeki her şeyi campus-head-ball depo klasörünün köküne kopyala."
  echo "public/index.html bulunamadı."
  read -n 1 -s -r -p "Kapatmak için bir tuşa bas..."
  exit 1
fi
mkdir -p "$ROOT/public/icons"
cp "$ROOT/mobile_files/mobile.js" "$ROOT/public/mobile.js"
cp "$ROOT/mobile_files/mobile.css" "$ROOT/public/mobile.css"
cp "$ROOT/mobile_files/manifest.webmanifest" "$ROOT/public/manifest.webmanifest"
cp "$ROOT/mobile_files/sw.js" "$ROOT/public/sw.js"
cp "$ROOT/mobile_files/icons/"*.png "$ROOT/public/icons/"
python3 - "$ROOT/public/index.html" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1]); s=p.read_text(encoding='utf-8')
s=s.replace('width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no','width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover')
if '/manifest.webmanifest' not in s:
    s=s.replace('<meta name="theme-color" content="#07141a">','<meta name="theme-color" content="#07141a">\n  <meta name="apple-mobile-web-app-capable" content="yes">\n  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n  <meta name="apple-mobile-web-app-title" content="Kafa Topu">\n  <link rel="manifest" href="/manifest.webmanifest">\n  <link rel="apple-touch-icon" href="/icons/icon-180.png">')
if '/mobile.css' not in s:
    s=s.replace('<link rel="stylesheet" href="/upgrade.css">','<link rel="stylesheet" href="/upgrade.css">\n  <link rel="stylesheet" href="/mobile.css">')
if '/mobile.js' not in s:
    s=s.replace('<script src="/socket.io/socket.io.js"></script><script src="/client.js"></script>','<script src="/socket.io/socket.io.js"></script><script src="/client.js"></script><script src="/mobile.js"></script>')
p.write_text(s,encoding='utf-8')
PY
node --check "$ROOT/public/mobile.js"
printf '\nTAMAMLANDI — Platform seçimi + telefon joystick/J/K + cross-platform kontrol katmanı eklendi.\n'
printf 'Şimdi GitHub Desktop -> Commit to main -> Push origin yap.\n\n'
read -n 1 -s -r -p "Kapatmak için bir tuşa bas..."
