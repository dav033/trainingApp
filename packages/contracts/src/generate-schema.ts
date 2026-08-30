import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { ProjectImportSchema } from "./project.js";

const output = fileURLToPath(new URL("../../../contracts/project-import.v1.schema.json", import.meta.url));
const schema = { ...z.toJSONSchema(ProjectImportSchema, { target: "draft-2020-12" }), $schema: "https://json-schema.org/draft/2020-12/schema", schemaVersion: 1 };
const json = `${JSON.stringify(schema, null, 2)}\n`;
await mkdir(output.replace(/[\\/][^\\/]+$/, ""), { recursive: true });
await writeFile(output, json, "utf8");
await writeFile(`${output}.sha256`, `${createHash("sha256").update(json).digest("hex")}  project-import.v1.schema.json\n`, "utf8");
console.log(`Generated ${output}`);
