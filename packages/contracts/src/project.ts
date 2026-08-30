import { z } from "zod";

const shortText = (max = 500) => z.string().trim().max(max);
const longText = (max = 4000) => z.string().trim().max(max);

export const AssetRefSchema = z.object({
  id: z.string().min(1).max(100),
  url: z.string().url().max(2048),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif"]),
  byteSize: z.number().int().positive().max(15 * 1024 * 1024),
}).strict();

export type AssetRef = z.infer<typeof AssetRefSchema>;

const controlSchema = z.object({
  fecha: z.string().max(30), control: z.number().int().min(1).max(999),
  peso: shortText(), musculo: shortText(), grasa: shortText(),
}).strict();

const metodologiaSchema = z.object({
  metodologia: longText(), velocidadContraccion: shortText(), objetivo: longText(), flexibilidad: longText(),
  metodologiaIntensidad: longText(), frecuenciaSemana: shortText(), duracionMicrociclo: shortText(),
  tiempoRecuperacion: shortText(), duracionPrograma: shortText(), trabajoCardiovascular: longText(), tipoFuerza: shortText(),
}).strict();

const alimentacionSchema = z.object({
  modeloCarbohidratos: longText(), modeloProteinas: longText(), modeloGrasas: longText(),
  modeloVitaminasMinerales: longText(), modeloAgua: longText(), modeloSodio: longText(),
}).strict();

const nutricionDiaSchema = z.object({ proteina: shortText(), carbohidratos: shortText(), grasa: shortText(), agua: shortText() }).strict();
const ejercicioSchema = z.object({ nombre: shortText(), series: shortText(100), repeticiones: shortText(100) }).strict();
const planEntrenamientoSchema = z.object({
  dias: z.array(z.object({ titulo: shortText(200), ejercicios: z.array(ejercicioSchema).max(12) }).strict()).max(7),
}).strict();

const planNutricionalSchema = z.object({
  dias: z.array(z.object({
    titulo: shortText(200),
    comidas: z.array(z.object({
      nombre: shortText(200),
      alimentos: z.array(z.object({ nombre: shortText(200), cantidad: shortText(200) }).strict()).max(50),
      merienda: shortText(1000).optional(),
    }).strict()).max(30),
  }).strict()).max(7),
}).strict();

export const TrainingProjectDataSchema = z.object({
  nombreCompleto: shortText(200), edad: shortText(20), correo: z.string().email().max(320),
  fotoFrontal: AssetRefSchema.nullable(), fotoLateral: AssetRefSchema.nullable(), fotoPosterior: AssetRefSchema.nullable(),
  controles: z.array(controlSchema).min(1).max(52), metodologia: metodologiaSchema, alimentacion: alimentacionSchema,
  nutricionDias: z.object({ entrenosFuertes: nutricionDiaSchema, entrenosMedios: nutricionDiaSchema, soloCardio: nutricionDiaSchema, descanso: nutricionDiaSchema }).strict(),
  planEntrenamiento: planEntrenamientoSchema, planNutricional: planNutricionalSchema,
  suplementacion: z.object({ items: z.array(shortText(500)).max(100) }).strict(),
  ayudasErgogenicas: z.object({ descripcion: longText() }).strict(),
}).strict();

export type TrainingProjectData = z.infer<typeof TrainingProjectDataSchema>;

export const ProjectImportSchema = z.object({
  schemaVersion: z.literal(1), expectedRevision: z.number().int().min(0),
  project: z.object({ externalKey: z.string().trim().min(1).max(120).regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/), name: shortText(200), description: longText(2000) }).strict(),
  data: TrainingProjectDataSchema,
}).strict();

export type ProjectImport = z.infer<typeof ProjectImportSchema>;

export const ProjectSnapshotSchema = z.object({
  id: z.string(), externalKey: z.string(), name: z.string(), description: z.string(), schemaVersion: z.literal(1),
  data: TrainingProjectDataSchema, revision: z.number().int(), createdAt: z.string(), updatedAt: z.string(),
}).strict();

export type ProjectSnapshot = z.infer<typeof ProjectSnapshotSchema>;
