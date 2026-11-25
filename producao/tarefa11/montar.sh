#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
dest=../../docs/media
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
python render.py original "$work/original.mp4"
python render.py epilogo "$work/epilogo.mp4"
bash multiplexar.sh "$work/original.mp4" "$work/epilogo.mp4" "$work/master.mp4"
bash web.sh "$work/master.mp4" "$dest/securepath-semestre.mp4"
