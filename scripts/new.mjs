// Start a new cartoon from a template. It renders straight away; then rewrite
// the lines in story.json and tweak scenes.tsx.
//   npm run new -- <story-id> --template bedtime|counting|adventure
//        [--hero fox] [--name Pip] [--friend bunny] [--friend-name Lulu]
//        [--world night-forest|night-sea|starry-sky|sunny-meadow|snowy-hill]
//        [--thing star|flower|snowflake|apple|shell] [--title "Pip and the Big Night"]
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ROOT } from "./lib.mjs";

const KINDS = ["owl", "mouse", "bunny", "bear", "fox", "cat", "hedgehog", "monkey"];
const WORLDS = {
  "night-forest": { mood: "bedtime", place: "in a quiet forest", thing: "star" },
  "night-sea": { mood: "bedtime", place: "by the sleepy sea", thing: "shell" },
  "starry-sky": { mood: "bedtime", place: "up among the clouds", thing: "star" },
  "sunny-meadow": { mood: "playful", place: "in a sunny meadow", thing: "flower" },
  "snowy-hill": { mood: "playful", place: "on a snowy hill", thing: "snowflake" },
};
const THINGS = ["star", "flower", "snowflake", "apple", "shell"];
const TEMPLATES = {
  bedtime: { world: "night-forest", title: "__NAME__ Can Do It" },
  counting: { world: "sunny-meadow", title: "Count with __NAME__" },
  adventure: { world: "sunny-meadow", title: "__NAME__'s Big Adventure" },
};

const args = process.argv.slice(2);
const id = args[0];
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i > 0 && args[i + 1] ? args[i + 1] : fallback;
};
const fail = (msg) => {
  console.error(msg);
  process.exit(1);
};

if (!id || id.startsWith("--")) fail("Usage: npm run new -- <story-id> --template bedtime|counting|adventure [--hero fox --name Pip ...]");
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) fail(`Story id "${id}" must be kebab-case, like pip-and-the-big-night.`);
const template = opt("template", "bedtime");
if (!TEMPLATES[template]) fail(`Unknown template "${template}". Choose: ${Object.keys(TEMPLATES).join(", ")}`);
const world = opt("world", TEMPLATES[template].world);
if (!WORLDS[world]) fail(`Unknown world "${world}". Choose: ${Object.keys(WORLDS).join(", ")}`);
const hero = opt("hero", "fox");
const friend = opt("friend", hero === "bunny" ? "mouse" : "bunny");
for (const k of [hero, friend]) if (!KINDS.includes(k)) fail(`Unknown character "${k}". Choose: ${KINDS.join(", ")}`);
const thing = opt("thing", WORLDS[world].thing);
if (!THINGS.includes(thing)) fail(`Unknown thing "${thing}". Choose: ${THINGS.join(", ")}`);
const name = opt("name", "Pip");
const friendName = opt("friend-name", "Lulu");

const storyDir = path.join(ROOT, "src/stories", id);
if (existsSync(storyDir)) fail(`src/stories/${id} already exists.`);

const cap = (s) => s[0].toUpperCase() + s.slice(1);
const plural = (s) => (s.endsWith("s") ? s : s + "s");
const seed = parseInt(createHash("sha1").update(id).digest("hex").slice(0, 6), 16) % 1000;
const tokens = {
  __TITLE__: opt("title", TEMPLATES[template].title),
  __ID__: id,
  __NAME__: name,
  __KIND__: hero,
  __FRIEND_KIND__: friend,
  __FRIEND__: friendName,
  __PLACE_CAP__: cap(WORLDS[world].place),
  __PLACE__: WORLDS[world].place,
  __THING_KIND__: thing,
  __THINGS__: plural(thing),
  __THING__: thing,
  __WORLD__: world,
  __MOOD__: WORLDS[world].mood,
  __SEED__: String(seed),
};
const fill = (text) => {
  let out = text;
  // Title first: it may itself contain __NAME__.
  for (const [k, v] of Object.entries(tokens)) out = out.split(k).join(v);
  return out;
};

mkdirSync(storyDir, { recursive: true });
for (const file of ["story.json", "scenes.tsx"]) {
  const src = readFileSync(path.join(ROOT, "templates", template, file), "utf8");
  writeFileSync(path.join(storyDir, file), fill(src));
}

// Register the story.
const indexFile = path.join(ROOT, "src/stories/index.ts");
const camel = id.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
let index = readFileSync(indexFile, "utf8");
index = index.replace(
  "// @new-story-imports",
  `import ${camel}Spec from "./${id}/story.json";\nimport { scenes as ${camel}Scenes } from "./${id}/scenes.tsx";\n// @new-story-imports`,
);
index = index.replace("  // @new-story-entries", `  { spec: ${camel}Spec as StorySpec, scenes: ${camel}Scenes },\n  // @new-story-entries`);
writeFileSync(indexFile, index);

const story = JSON.parse(readFileSync(path.join(storyDir, "story.json"), "utf8"));
console.log(`Created src/stories/${id}/ from the "${template}" template
  "${story.title}" · ${name} the ${hero}${template === "counting" ? "" : ` and ${friendName} the ${friend}`} · ${world} · ${story.mood}

Next:
  1. Rewrite the narration in src/stories/${id}/story.json (keep the scene ids, or update scenes.tsx to match).
  2. npm run still -- ${id} --scenes      check every scene
  3. npm run make -- ${id} --draft         narrate → music → quick render`);
