#!/usr/bin/env bash
# Downloads the default sound set (Mixkit previews) into ./sounds for local use.
# The audio files are not redistributed in this repository. They are fetched from
# Mixkit's CDN and are subject to the Mixkit Free License (https://mixkit.co/license/).
# You can replace any file in ./sounds with your own .mp3, or add a URL per action in the app.
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)/sounds"
mkdir -p "$DIR"

# name=mixkit_sfx_id
PAIRS="
msgpop=2354
bubble=2357
drypop=2356
longpop=2358
bell=933
happybells=937
positive=951
confirm=2867
correct=2870
magicring=2344
hint=911
start=2574
back=2575
doorbell=2864
"

for pair in $PAIRS; do
  name="${pair%%=*}"; id="${pair#*=}"
  url="https://assets.mixkit.co/active_storage/sfx/${id}/${id}-preview.mp3"
  curl -fsSL -A "Mozilla/5.0" -o "$DIR/$name.mp3" "$url" && echo "ok  $name.mp3"
done

echo "Done. ${DIR}"
