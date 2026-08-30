import type { AlumnoData } from "@/lib/types";

export function createBlankAlumnoData(): AlumnoData {
  const blank = (keys: string[]) => Object.fromEntries(keys.map((key) => [key, ""])) as Record<string, string>;
  const dia = { proteina: "", carbohidratos: "", grasa: "", agua: "" };
  return {
    nombreCompleto: "Nuevo proyecto",
    edad: "",
    correo: "coach@example.com",
    fotoFrontal: null,
    fotoLateral: null,
    fotoPosterior: null,
    controles: [{ fecha: new Date().toISOString().slice(0, 10), control: 1, peso: "", musculo: "", grasa: "" }],
    metodologia: blank(["metodologia", "velocidadContraccion", "objetivo", "flexibilidad", "metodologiaIntensidad", "frecuenciaSemana", "duracionMicrociclo", "tiempoRecuperacion", "duracionPrograma", "trabajoCardiovascular", "tipoFuerza"]) as AlumnoData["metodologia"],
    alimentacion: blank(["modeloCarbohidratos", "modeloProteinas", "modeloGrasas", "modeloVitaminasMinerales", "modeloAgua", "modeloSodio"]) as AlumnoData["alimentacion"],
    nutricionDias: { entrenosFuertes: dia, entrenosMedios: dia, soloCardio: dia, descanso: dia },
    planEntrenamiento: { dias: [] },
    planNutricional: { dias: [] },
    suplementacion: { items: [] },
    ayudasErgogenicas: { descripcion: "" },
  };
}
