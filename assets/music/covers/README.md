Place cover images for the soundtrack in this folder.

Each track in `../tracks.json` has a `cover` field. Set it to the filename of the image stored here, for example:

```json
{
  "title": "COLORS",
  "artist": "FLOW",
  "file": "colors-flow.mp3",
  "cover": "colors.png"
}
```

The player falls back to `assets/logo.png` whenever `cover` is `null` or the image cannot be loaded.
