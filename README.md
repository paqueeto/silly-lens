# Silly Lens

A playful in-browser photo booth. Try fruit, animal, and food lenses on a studio buddy, then turn on your camera for a live snap. Photos stay on this device.

## Use it

1. Pick a lens (Kitty, Pizza, Donut, and friends).
2. Hit the red shutter for a 3-2-1 countdown.
3. Download a polaroid, or turn on your camera for a live face-tracked snap.

Camera access is optional. Studio mode works without it.

## Run locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default port 8080).

```bash
npm run build
npm run preview
```

## Stack

React, TanStack Start, Vite, Tailwind, MediaPipe face landmarks, canvas filters.

## Also in this repo

`paper-cartoons/` is a separate project: felt-and-paper kids' cartoons rendered from code with Remotion, plus a Claude Code skill that takes one story idea to a finished MP4. See `paper-cartoons/README.md`.
