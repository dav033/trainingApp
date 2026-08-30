import assert from "node:assert/strict";
import test from "node:test";
import { ProjectImportSchema } from "../src/project.js";

const emptyData = {
  nombreCompleto: "Ingrid Herrera", edad: "28", correo: "ingrid@example.com", fotoFrontal: null, fotoLateral: null, fotoPosterior: null,
  controles: [{ fecha: "2026-08-30", control: 1, peso: "", musculo: "", grasa: "" }],
  metodologia: Object.fromEntries(["metodologia", "velocidadContraccion", "objetivo", "flexibilidad", "metodologiaIntensidad", "frecuenciaSemana", "duracionMicrociclo", "tiempoRecuperacion", "duracionPrograma", "trabajoCardiovascular", "tipoFuerza"].map((key) => [key, ""])),
  alimentacion: Object.fromEntries(["modeloCarbohidratos", "modeloProteinas", "modeloGrasas", "modeloVitaminasMinerales", "modeloAgua", "modeloSodio"].map((key) => [key, ""])),
  nutricionDias: Object.fromEntries(["entrenosFuertes", "entrenosMedios", "soloCardio", "descanso"].map((key) => [key, { proteina: "", carbohidratos: "", grasa: "", agua: "" }])),
  planEntrenamiento: { dias: [] }, planNutricional: { dias: [] }, suplementacion: { items: [] }, ayudasErgogenicas: { descripcion: "" },
};

test("accepts the complete empty project shape", () => {
  assert.equal(ProjectImportSchema.safeParse({ schemaVersion: 1, expectedRevision: 0, project: { externalKey: "ingrid-herrera", name: "INGRID HERRERA", description: "" }, data: emptyData }).success, true);
});

test("enforces plan limits and email validation", () => {
  const result = ProjectImportSchema.safeParse({ schemaVersion: 1, expectedRevision: 0, project: { externalKey: "bad key", name: "", description: "" }, data: { ...emptyData, correo: "not-an-email", planEntrenamiento: { dias: Array.from({ length: 8 }, () => ({ titulo: "", ejercicios: [] })) } } });
  assert.equal(result.success, false);
});
