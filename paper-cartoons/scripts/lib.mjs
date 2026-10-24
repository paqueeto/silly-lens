import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { selectComposition } from "@remotion/renderer";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const PUBLIC = path.join(ROOT, "public");
export const OUT = path.join(ROOT, "out");

const DEFAULT_BROWSER =
  "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";

/** A preinstalled Chromium if there is one; otherwise Remotion downloads its own. */
export function browserExecutable() {
  const candidate = process.env.REMOTION_BROWSER ?? DEFAULT_BROWSER;
  return existsSync(candidate) ? candidate : null;
}

export function listStories() {
  const dir = path.join(ROOT, "src/stories");
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(path.join(dir, d.name, "story.json")))
    .map((d) => d.name);
}

export function loadStory(id) {
  const file = path.join(ROOT, "src/stories", id, "story.json");
  if (!existsSync(file)) {
    throw new Error(`No story "${id}". Stories: ${listStories().join(", ") || "(none)"}`);
  }
  return JSON.parse(readFileSync(file, "utf8"));
}

export function storyArg() {
  const id = process.argv[2];
  if (!id) {
    console.error(`Usage: npm run <script> -- <story-id>\nStories: ${listStories().join(", ")}`);
    process.exit(1);
  }
  return id;
}

let bundled = null;
export async function getBundle() {
  bundled ??= await bundle({ entryPoint: path.join(ROOT, "src/index.ts"), publicDir: PUBLIC });
  return bundled;
}

export async function getComposition(id, inputProps = {}) {
  const serveUrl = await getBundle();
  const composition = await selectComposition({
    serveUrl,
    id,
    inputProps,
    browserExecutable: browserExecutable(),
  });
  return { serveUrl, composition };
}

export const seconds = (s) => {
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const ss = String(Math.floor(s % 60)).padStart(2, "0");
  return h > 0 ? `${h}:${String(m % 60).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
};
