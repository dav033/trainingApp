import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { openDatabase } from "../src/db/database.js";
import { ProjectRepository } from "../src/repositories/project-repository.js";
import { RevisionConflictError } from "../src/errors.js";

const data = { nombreCompleto: "Ingrid", edad: "28", correo: "ingrid@example.com", fotoFrontal: null, fotoLateral: null, fotoPosterior: null, controles: [{ fecha: "2026-08-30", control: 1, peso: "", musculo: "", grasa: "" }], metodologia: Object.fromEntries(["metodologia", "velocidadContraccion", "objetivo", "flexibilidad", "metodologiaIntensidad", "frecuenciaSemana", "duracionMicrociclo", "tiempoRecuperacion", "duracionPrograma", "trabajoCardiovascular", "tipoFuerza"].map((key) => [key, ""])), alimentacion: Object.fromEntries(["modeloCarbohidratos", "modeloProteinas", "modeloGrasas", "modeloVitaminasMinerales", "modeloAgua", "modeloSodio"].map((key) => [key, ""])), nutricionDias: Object.fromEntries(["entrenosFuertes", "entrenosMedios", "soloCardio", "descanso"].map((key) => [key, { proteina: "", carbohidratos: "", grasa: "", agua: "" }])), planEntrenamiento: { dias: [] }, planNutricional: { dias: [] }, suplementacion: { items: [] }, ayudasErgogenicas: { descripcion: "" } } as const;

test("persists revisions and rejects stale writes", () => {
  const dir = mkdtempSync(join(tmpdir(), "training-api-"));
  const db = openDatabase(join(dir, "training.db"));
  const repository = new ProjectRepository(db, "http://localhost:4100");
  const created = repository.create({ externalKey: "ingrid", name: "Ingrid", description: "", data });
  assert.equal(created.snapshot.revision, 1);
  const updated = repository.update(created.snapshot.id, 1, { name: "Ingrid 2", description: "", data });
  assert.equal(updated.snapshot.revision, 2);
  assert.throws(() => repository.update(created.snapshot.id, 1, { name: "Ingrid 3", description: "", data }), RevisionConflictError);
  db.close(); rmSync(dir, { recursive: true, force: true });
});
