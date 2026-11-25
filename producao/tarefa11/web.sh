#!/usr/bin/env bash
# Edição de distribuição em duas passagens. A faixa AAC e as legendas são copiadas.
set -euo pipefail
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
ffmpeg -v error -y -i "$1" -map 0:v -c:v libx264 -preset fast -threads 7 \
    -b:v 365k -pass 1 -passlogfile "$work/pass" -an -f null -
ffmpeg -v error -y -i "$1" -map 0 -c:v libx264 -preset fast -threads 7 \
    -b:v 365k -pass 2 -passlogfile "$work/pass" -c:a copy -c:s copy -movflags +faststart "$2"
