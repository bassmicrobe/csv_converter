import path from "node:path";

/** staged に含まれる対象があるか（package.json のみの更新では Biome をスキップ） */
function shouldRunBiome(files) {
  return files.some((f) => {
    if (path.basename(f) === "package.json") return false;
    if (/\.(js|jsx|ts|tsx|css)$/i.test(f)) return true;
    const base = path.basename(f);
    if (base === "biome.json" || base === "vercel.json") return true;
    if (/^tsconfig.*\.json$/.test(base)) return true;
    if (base === "vitest.config.ts") return true;
    return false;
  });
}

export default {
  "*": (files) => {
    if (!shouldRunBiome(files)) return [];
    return "corepack pnpm exec biome check --write .";
  },
};
