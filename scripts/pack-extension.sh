#!/usr/bin/env bash
# Builds custom-sounds-for-gmeet-extension.zip at the repo root from extension/.
# The zip unzips to a folder named custom-sounds-for-gmeet with manifest.json at its
# root, ready for chrome://extensions > Load unpacked.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
mkdir -p "$TMP/custom-sounds-for-gmeet"
cp -r "$ROOT/extension/." "$TMP/custom-sounds-for-gmeet/"
( cd "$TMP" && zip -r -q custom-sounds-for-gmeet-extension.zip custom-sounds-for-gmeet )
cp "$TMP/custom-sounds-for-gmeet-extension.zip" "$ROOT/custom-sounds-for-gmeet-extension.zip"
rm -rf "$TMP"
echo "Built $ROOT/custom-sounds-for-gmeet-extension.zip"
