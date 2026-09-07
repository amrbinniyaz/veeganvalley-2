# Insider section footage

Drop up to three video files here, then run:

```
npm run ingest
```

They are used in **filename order**, so name them `01-…`, `02-…`, `03-…`. Anything in
`.mp4 .mov .webm .m4v .mkv` works — `scripts/ingest_clips.py` centre-crops to 9:16, scales to
720×1280, caps at 12s, keeps audio, and writes `public/video/insider-{1,2,3}.mp4` plus posters.

Nothing else in the project needs to change: the page always points at those three filenames.

## Where the current clips came from

Until real footage lands, `npm run clips` fills the same three slots with product turntables
generated from `public/img/seq/` — the bottle turning against a flat brand ground. They are
silent, so the sound toggle hides itself automatically. Running `npm run ingest` overwrites them.

## Getting your own Instagram posts as files

Instagram serves media through authenticated GraphQL, so a post URL cannot be fetched — the
page HTML contains no media link at all. Get the original instead:

- **Best:** the source file you uploaded (camera roll, editor export). Higher quality than
  anything Instagram will give back, since their copy is re-encoded.
- **Otherwise:** Instagram → Settings → *Your activity* → *Download your information* → request
  your posts. Meta emails a zip of the originals. Takes anywhere from minutes to a day.

## Rights

Only put footage here that is **yours, or licensed for commercial use**. If a clip came from a
creator or customer, record their written permission below — who, what, when, and where they
gave it. A screenshot of the DM in this folder is fine.

| File | Source | Permission |
|---|---|---|
| _(none yet)_ | | |
