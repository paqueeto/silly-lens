import { existsSync } from "node:fs";
import { Config } from "@remotion/cli/config";

// Use a preinstalled Chromium when one is available (cloud sandboxes);
// otherwise Remotion downloads its own headless shell on first run.
const browser =
  process.env.REMOTION_BROWSER ??
  "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
if (existsSync(browser)) Config.setBrowserExecutable(browser);

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setCodec("h264");
Config.setCrf(18);
Config.setPixelFormat("yuv420p");
