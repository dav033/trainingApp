import type { TrainingProjectData } from "@training/contracts";
import { TrainingProjectDataSchema } from "@training/contracts";

export type AlumnoData = TrainingProjectData;
export type AssetRef = NonNullable<TrainingProjectData["fotoFrontal"]>;
export type Control = TrainingProjectData["controles"][number];
export type MetodologiaEntrenamiento = TrainingProjectData["metodologia"];
export type MetodologiaAlimentacion = TrainingProjectData["alimentacion"];
export type NutricionDia = TrainingProjectData["nutricionDias"][keyof TrainingProjectData["nutricionDias"]];
export type Ejercicio = TrainingProjectData["planEntrenamiento"]["dias"][number]["ejercicios"][number];
export type DiaPlan = TrainingProjectData["planEntrenamiento"]["dias"][number];
export type PlanEntrenamiento = TrainingProjectData["planEntrenamiento"];
export type Alimento = TrainingProjectData["planNutricional"]["dias"][number]["comidas"][number]["alimentos"][number];
export type Comida = TrainingProjectData["planNutricional"]["dias"][number]["comidas"][number];
export type DiaNutricional = TrainingProjectData["planNutricional"]["dias"][number];
export type PlanNutricional = TrainingProjectData["planNutricional"];
export type Suplementacion = TrainingProjectData["suplementacion"];
export type AyudasErgogenicas = TrainingProjectData["ayudasErgogenicas"];
export { TrainingProjectDataSchema };
