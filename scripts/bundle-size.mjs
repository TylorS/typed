import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { execFileSync } from "node:child_process";
import { brotliCompressSync, gzipSync } from "node:zlib";

const examples = [
  ["typed-counter", "examples/counter/dist"],
  ["typed-fullstack", "examples/fullstack/dist"],
  ["typed-todomvc", "examples/todomvc/dist"],
];

const bundleAsset = /\.(?:css|js)$/;

export async function measureBundleDirectory(directory) {
  const assets = await findBundleAssets(directory);

  return Promise.all(
    assets.map(async (file) => {
      const contents = await readFile(file);

      return {
        file: relative(directory, file),
        raw: contents.length,
        gzip: gzipSync(contents).length,
        brotli: brotliCompressSync(contents).length,
      };
    }),
  );
}

async function findBundleAssets(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const file = join(directory, entry.name);
      return entry.isDirectory()
        ? findBundleAssets(file)
        : bundleAsset.test(entry.name)
          ? [file]
          : [];
    }),
  );

  return files.flat().sort();
}

function formatSize(bytes) {
  return `${(bytes / 1024).toFixed(2)} KiB`;
}

async function measureExamples() {
  for (const [name, outputDirectory] of examples) {
    execFileSync("pnpm", ["--filter", name, "run", "build"], { stdio: "inherit" });

    const assets = await measureBundleDirectory(outputDirectory);
    const totals = assets.reduce(
      (total, asset) => ({
        raw: total.raw + asset.raw,
        gzip: total.gzip + asset.gzip,
        brotli: total.brotli + asset.brotli,
      }),
      { raw: 0, gzip: 0, brotli: 0 },
    );

    console.log(`\n${name}`);
    console.table(
      [...assets, { file: "total", ...totals }].map((asset) => ({
        asset: asset.file,
        raw: formatSize(asset.raw),
        gzip: formatSize(asset.gzip),
        brotli: formatSize(asset.brotli),
      })),
    );
  }
}

if (import.meta.main) {
  await measureExamples();
}
