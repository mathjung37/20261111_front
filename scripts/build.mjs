import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "src");
const output = path.join(root, "dist");

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(source, output, { recursive: true });

const template = await readFile(path.join(source, "config.js"), "utf8");
const apiBaseUrl = process.env.API_BASE_URL?.trim() || "http://localhost:8000";
const demoMode = (process.env.DEMO_MODE ?? "true").toLowerCase() !== "false";
const config = template
  .replace('"__API_BASE_URL__"', JSON.stringify(apiBaseUrl))
  .replace('"__DEMO_MODE__"', JSON.stringify(String(demoMode)));

await writeFile(path.join(output, "config.js"), config);
console.log(`Built frontend to ${output}`);
