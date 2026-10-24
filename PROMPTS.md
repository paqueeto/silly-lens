# Ready prompts

Copy, paste into Claude Code (opened in this folder), and change the parts in
CAPITALS. Run them in order for a new cartoon; any of them works on its own later.

## 1 · Quick start from a template

```
Use the cartoon skill. Start a new cartoon from the BEDTIME template
(bedtime / counting / adventure). Hero: a HEDGEHOG named HAZEL. Friend: an OWL
named OLLIE. World: NIGHT-FOREST. The story: HAZEL IS AFRAID OF THE DARK AND OLLIE
SHOWS HER THE FIREFLIES. Rewrite the template's lines to tell this story, keep its
scene structure, and show me the script before rendering.
```

## 2 · A brand-new story (no template)

```
Use the cartoon skill. Make a new kids' cartoon: A SHY LITTLE OWL WHO IS AFRAID TO
FLY AT NIGHT, AND THE STARS HELP HER. Length: about 1 MINUTE. Mood: CALM BEDTIME.
Age 3 to 5. Start with the story and the scene plan, and wait for my OK before
building anything.
```

## 3 · Revise the plan

```
Good start. Changes: MAKE THE FRIEND A BUNNY, ADD A COUNTING MOMENT IN SCENE 3, AND
END WITH A LULLABY LINE. Keep everything else. Show me the updated plan.
```

## 4 · Build and check

```
Approved. Build it: create the story files, build every scene, then render one still
per scene and look at them yourself. Fix anything cropped, overlapping or hard to
read before showing me.
```

## 5 · Voice, music, draft

```
Narrate it with my ElevenLabs voice, make the music, and render a draft. Tell me the
running time and anything that looked off.
```

## 6 · Change something

```
In SCENE 4, MAKE THE STARS DROP ONE BY ONE ON THE COUNT AND MAKE THE HERO HOP HIGHER.
Re-check that scene's stills, then re-render the draft.
```

## 7 · Final

```
Render the final 1080p version and write a YouTube title, a description and 3
thumbnail ideas, following the YouTube checklist in the skill.
```

## Templates at a glance

| Template | Scenes | Shape | Best worlds |
|---|---|---|---|
| `bedtime` | 6 | home → worry → a friend helps → one, two, three → did it! → goodnight | night-forest, night-sea, starry-sky |
| `counting` | 5 | hello → 1-2-3 → 4-5 → count them all, hooray → bye | sunny-meadow, snowy-hill, night-sea |
| `adventure` | 6 | ready → off we go (hop, hop, hop) → new friend → a treasure → sharing → home | any |

Worlds: `night-forest`, `night-sea`, `starry-sky`, `sunny-meadow`, `snowy-hill`.
Characters: `owl`, `mouse`, `bunny`, `bear`, `fox`, `cat`, `hedgehog`.
Counting things: `star`, `flower`, `snowflake`, `apple`, `shell` (default: the world's own).

Directly from the terminal:

```bash
npm run new -- hazel-and-the-fireflies --template bedtime --hero hedgehog --name Hazel \
  --friend owl --friend-name Ollie --world night-forest --title "Hazel and the Fireflies"
npm run still -- hazel-and-the-fireflies --scenes
npm run make -- hazel-and-the-fireflies --draft
```
