export interface AlumnoData {
  nombreCompleto: string;
  edad: string;
  correo: string;
  fotoFrontal: string | null;
  fotoLateral: string | null;
  fotoPosterior: string | null;
  controles: Control[];
  metodologia: MetodologiaEntrenamiento;
  alimentacion: MetodologiaAlimentacion;
  nutricionDias: NutricionPorDias;
  planEntrenamiento: PlanEntrenamiento;
  planNutricional: PlanNutricional;
  suplementacion: Suplementacion;
  ayudasErgogenicas: AyudasErgogenicas;
}

export interface Control {
  fecha: string;
  control: number;
  peso: string;
  musculo: string;
  grasa: string;
}

export interface MetodologiaEntrenamiento {
  metodologia: string;
  velocidadContraccion: string;
  objetivo: string;
  flexibilidad: string;
  metodologiaIntensidad: string;
  frecuenciaSemana: string;
  duracionMicrociclo: string;
  tiempoRecuperacion: string;
  duracionPrograma: string;
  trabajoCardiovascular: string;
  tipoFuerza: string;
}

export interface MetodologiaAlimentacion {
  modeloCarbohidratos: string;
  modeloProteinas: string;
  modeloGrasas: string;
  modeloVitaminasMinerales: string;
  modeloAgua: string;
  modeloSodio: string;
}

export interface NutricionDia {
  proteina: string;
  carbohidratos: string;
  grasa: string;
  agua: string;
}

export interface NutricionPorDias {
  entrenosFuertes: NutricionDia;
  entrenosMedios: NutricionDia;
  soloCardio: NutricionDia;
  descanso: NutricionDia;
}

export interface Ejercicio {
  nombre: string;
  series: string;
  repeticiones: string;
}

export interface DiaPlan {
  titulo: string;
  ejercicios: Ejercicio[];
}

export interface PlanEntrenamiento {
  dias: DiaPlan[];
}

export interface Alimento {
  nombre: string;
  cantidad: string;
}

export interface Comida {
  nombre: string; // Desayuno, Almuerzo, Comida, etc.
  alimentos: Alimento[];
  merienda?: string; // Merienda opcional (descripción)
}

export interface DiaNutricional {
  titulo: string; // Ej: "LUNES A VIERNES"
  comidas: Comida[];
}

export interface PlanNutricional {
  dias: DiaNutricional[];
}

export interface Suplementacion {
  items: string[];
}

export interface AyudasErgogenicas {
  descripcion: string;
}
