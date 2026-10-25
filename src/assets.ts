import { continueRender, delayRender, staticFile } from "remotion";

// Fonts ship in public/fonts so renders never need the network.
if (typeof document !== "undefined") {
  const handle = delayRender("Loading fonts");
  const faces: [string, number, string][] = [
    ["Fredoka", 500, "fredoka-latin-500-normal"],
    ["Fredoka", 600, "fredoka-latin-600-normal"],
    ["Fredoka", 700, "fredoka-latin-700-normal"],
    ["Caveat", 500, "caveat-latin-500-normal"],
    ["Caveat", 700, "caveat-latin-700-normal"],
    ["Gochi Hand", 400, "gochi-hand-latin-400-normal"],
  ];
  Promise.all(
    faces.map(([family, weight, file]) =>
      new FontFace(family, `url(${staticFile(`fonts/${file}.woff2`)}) format("woff2")`, { weight: String(weight) })
        .load()
        .then((face) => document.fonts.add(face)),
    ),
  )
    .catch((err) => console.error("Font failed to load", err))
    .finally(() => continueRender(handle));
}
