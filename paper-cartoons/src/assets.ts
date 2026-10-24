import { continueRender, delayRender, staticFile } from "remotion";

// Fredoka ships in public/fonts so renders never need the network.
if (typeof document !== "undefined") {
  const handle = delayRender("Loading Fredoka");
  Promise.all(
    [500, 600, 700].map((weight) =>
      new FontFace("Fredoka", `url(${staticFile(`fonts/fredoka-latin-${weight}-normal.woff2`)}) format("woff2")`, {
        weight: String(weight),
      })
        .load()
        .then((face) => document.fonts.add(face)),
    ),
  )
    .catch((err) => console.error("Font failed to load", err))
    .finally(() => continueRender(handle));
}
