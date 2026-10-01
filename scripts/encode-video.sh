#!/usr/bin/env bash
# Encode a gameplay capture for the portfolio and extract its poster frame.
#
#   scripts/encode-video.sh <input> <slug> [options]
#
#   --audio          keep the audio track (dropped by default; card previews are muted)
#   --ss <sec>       trim: start offset
#   --t <sec>        trim: max duration
#   --crop <w:h:x:y> crop before scaling (e.g. remove pillarbox bars)
#   --poster <sec>   poster frame time, relative to the trimmed clip (default 1.5)
#   --crf <n>        x264 quality (default 27, lower = better/larger)
#
# Output: videos/<slug>.mp4 and videos/posters/<slug>.jpg
set -euo pipefail

in="$1"; slug="$2"; shift 2
audio=0; ss=""; dur=""; crop=""; poster=1.5; crf=27
while [ $# -gt 0 ]; do
  case "$1" in
    --audio) audio=1 ;;
    --ss) ss="$2"; shift ;;
    --t) dur="$2"; shift ;;
    --crop) crop="$2"; shift ;;
    --poster) poster="$2"; shift ;;
    --crf) crf="$2"; shift ;;
    *) echo "unknown option: $1" >&2; exit 1 ;;
  esac
  shift
done

root="$(cd "$(dirname "$0")/.." && pwd)"
out="$root/videos/$slug.mp4"
mkdir -p "$root/videos/posters"

# Fit inside 720x1280 (portrait) or 1280x720 (landscape), never upscale, square pixels, max 30fps.
vf="${crop:+crop=$crop,}scale='if(gt(iw,ih),min(1280,iw),min(720,iw))':-2:flags=lanczos,setsar=1,fps='min(30,source_fps)'"

trim=()
[ -n "$ss" ] && trim+=(-ss "$ss")
[ -n "$dur" ] && trim+=(-t "$dur")

if [ "$audio" = 1 ]; then a=(-c:a aac -b:a 96k -ac 2); else a=(-an); fi

ffmpeg -v error -y ${trim[@]+"${trim[@]}"} -i "$in" -vf "$vf" \
  -c:v libx264 -preset slow -crf "$crf" -profile:v high -pix_fmt yuv420p -g 60 \
  "${a[@]}" -movflags +faststart -map_metadata -1 "$out"

ffmpeg -v error -y -ss "$poster" -i "$out" -frames:v 1 -vf "scale='min(540,iw)':-2:flags=lanczos" -q:v 4 \
  "$root/videos/posters/$slug.jpg"

printf '%-26s %6s KB  poster %5s KB\n' "$slug" \
  "$(( $(stat -f%z "$out") / 1024 ))" "$(( $(stat -f%z "$root/videos/posters/$slug.jpg") / 1024 ))"
