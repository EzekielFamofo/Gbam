import { $ } from "bun";
import path from "path";

const cliDir = path.resolve(import.meta.dirname, "..");

const targets = [
  { target: "bun-darwin-arm64", pkg: "darwin-arm64", bin: "gbam" },
  { target: "bun-darwin-x64", pkg: "darwin-x64", bin: "gbam" },
  { target: "bun-windows-arm64", pkg: "win32-arm64", bin: "gbam.exe" },
  { target: "bun-windows-x64", pkg: "win32-x64", bin: "gbam.exe" },
];

console.log("🚀 Building platform-specific native binaries...\n");

for (const { target, pkg, bin } of targets) {
  const outputPath = path.join(cliDir, `../cli-binaries/${pkg}/bin/${bin}`);
  console.log(`📦 Building ${target} -> ${outputPath}`);
  
  await $`bun build ${path.join(cliDir, "src/index.tsx")} --compile --target=${target} --outfile ${outputPath}`;
}

console.log("\n✅ All binaries compiled successfully!");