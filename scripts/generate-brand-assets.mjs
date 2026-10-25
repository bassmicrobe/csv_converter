import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = new URL("../", import.meta.url);
const file = (path) => fileURLToPath(new URL(path, root));
const brand = (name) => file(`public/brand/ezcsv-${name}.svg`);

await mkdir(file("public/icons/"), { recursive: true });

const favicon = await readFile(brand("favicon"));
await writeFile(file("src/app/icon.svg"), favicon);

// ICO directory entries point to PNG images at the common browser sizes.
const sizes = [16, 32, 48];
const images = await Promise.all(
  sizes.map((size) =>
    sharp(favicon, { density: 192 }).resize(size, size).png().toBuffer(),
  ),
);
const header = Buffer.alloc(6 + images.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach((image, index) => {
  const entry = 6 + index * 16;
  header[entry] = sizes[index];
  header[entry + 1] = sizes[index];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(image.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += image.length;
});
await writeFile(
  file("src/app/favicon.ico"),
  Buffer.concat([header, ...images]),
);

const appIcon = await readFile(brand("appicon-dark"));
await Promise.all(
  [
    [180, "src/app/apple-icon.png"],
    [192, "public/icons/icon-192.png"],
    [512, "public/icons/icon-512.png"],
  ].map(([size, path]) =>
    sharp(appIcon)
      .resize(size, size)
      .flatten({ background: "#1c1917" })
      .png()
      .toFile(file(path)),
  ),
);

const lockup = (await readFile(brand("lockup-dark"), "utf8")).replace(
  /^<svg\b[^>]*>|<\/svg>\s*$/g,
  "",
);
const ogImage = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="0.5" cy="0" r="0.9">
      <stop offset="0" stop-color="#064e3b"/>
      <stop offset="1" stop-color="#1c1917"/>
    </radialGradient>
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M60 0H0V60" fill="none" stroke="#fafaf9" stroke-opacity="0.035"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <g transform="translate(344.03 90) scale(2.2)">${lockup}</g>
  <g font-family="Arial, Helvetica, sans-serif" text-anchor="middle">
    <text x="600" y="365" font-size="40" font-weight="700" fill="#fafaf9">Your CSV. Your browser.</text>
    <text x="600" y="411" font-size="24" fill="#d6d3d1">Edit and convert CSV / TSV files without uploading your data.</text>
    <g font-size="20" fill="#a7f3d0">
      <rect x="278" y="462" width="190" height="46" rx="23" fill="#064e3b" stroke="#059669"/>
      <text x="373" y="492">No data uploads</text>
      <rect x="488" y="462" width="172" height="46" rx="23" fill="#064e3b" stroke="#059669"/>
      <text x="574" y="492">PDF / QR export</text>
      <rect x="680" y="462" width="242" height="46" rx="23" fill="#064e3b" stroke="#059669"/>
      <text x="801" y="492">Free. No sign-up.</text>
    </g>
    <text x="600" y="577" font-size="22" fill="#a8a29e">ezcsv.com</text>
  </g>
</svg>`;

await sharp(Buffer.from(ogImage))
  .png()
  .toFile(file("src/app/opengraph-image.png"));
console.log(
  "Generated favicon, app icons, and Open Graph image from public/brand SVGs.",
);
