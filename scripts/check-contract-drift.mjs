import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const files = [resolve(root, "contracts/project-import.v1.schema.json"), resolve(root, "..", "trainingApp-mcp/contracts/project-import.v1.schema.json")];
const hashes = files.map((file) => createHash("sha256").update(readFileSync(file)).digest("hex"));
if (hashes[0] !== hashes[1]) throw new Error(`Contract drift detected: ${hashes.join(" != ")}`);
console.log(`Contract hash: ${hashes[0]}`);
