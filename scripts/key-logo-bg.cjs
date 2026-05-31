// One-off: key out the black background of the Society logo JPEG and save a
// transparent PNG. Run: node scripts/key-logo-bg.cjs
// Uses sharp from the pegged project's node_modules (Society has no sharp dep).
const sharp = require("/home/colelevy/development/pegged/node_modules/sharp");
const path = require("path");

const IN = path.join(__dirname, "..", "src", "assets", "society-logo.jpeg");
const OUT = path.join(__dirname, "..", "src", "assets", "society-logo.png");

// Pixels darker than LOW become fully transparent; brighter than HIGH stay
// opaque; in between we feather the alpha for a clean edge. The cream plaque
// (lum ~220) and its brown border (lum ~50+) stay; the pure-black bg (lum ~0)
// goes transparent.
const LOW = 20;
const HIGH = 50;

(async () => {
  const { data, info } = await sharp(IN)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    let a;
    if (lum <= LOW) a = 0;
    else if (lum >= HIGH) a = 255;
    else a = Math.round(((lum - LOW) / (HIGH - LOW)) * 255);
    data[i + 3] = a;
  }

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(OUT);

  const m = await sharp(OUT).metadata();
  console.log("wrote", OUT, `${m.width}x${m.height} hasAlpha=${m.hasAlpha}`);
})();
