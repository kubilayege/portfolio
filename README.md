# Portfolio

Static site — no build step. `index.html` is a shell; all content lives in `projects.js` and is rendered by `script.js`.

Run locally:

```sh
python3 -m http.server 8080
```

## Adding a project

1. Encode the capture (needs `ffmpeg`):

   ```sh
   scripts/encode-video.sh path/to/capture.mov my-game            # muted preview
   scripts/encode-video.sh path/to/capture.mov my-game --audio    # keep sound
   ```

   Options: `--ss`/`--t` to trim, `--crop w:h:x:y` to remove bars, `--poster <sec>` to pick the poster frame, `--crf` for quality.
   Output: `videos/my-game.mp4` (H.264, ≤720p portrait / ≤1280p landscape, faststart) and `videos/posters/my-game.jpg`.

2. Add an entry to `PROJECTS` in `projects.js`. The field reference is at the top of that file.

Projects open in a shareable detail view at `#game/<slug>` or `#tool/<slug>`.
