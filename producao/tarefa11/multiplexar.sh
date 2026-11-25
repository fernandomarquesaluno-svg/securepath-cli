#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
media=../../docs/media
printf "file '%s'\n" "$(realpath "$1")" "$(realpath "$2")" > "$work/clips.txt"
ffmpeg -loglevel error -y -f concat -safe 0 -i "$work/clips.txt" \
 -i "$media/securepath-narracao-natural.wav" -i "$media/securepath-narracao-evolucao.wav" \
 -i faber.flac -i trilha.m4a -i efeitos.m4a -i "$media/securepath-semestre.vtt" \
 -filter_complex '[1:a][2:a]concat=n=2:v=0:a=1,aresample=48000,aformat=channel_layouts=stereo,apad,atrim=end=100.833333[a];[3:a]loudnorm=I=-17:TP=-2:LRA=9,aresample=48000,aformat=channel_layouts=stereo[v];[v][4:a][5:a]amix=inputs=3:duration=first:normalize=0,alimiter=limit=0.94:level=0:latency=1[b];[a][b]concat=n=2:v=0:a=1[out]' \
 -map 0:v -map '[out]' -map 6 -c:v copy -c:a aac -b:a 192k -c:s mov_text -metadata:s:s:0 language=por -movflags +faststart "$3"
