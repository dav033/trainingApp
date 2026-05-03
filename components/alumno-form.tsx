"use client";

import { useState } from "react";
import { AlumnoData, Control } from "@/lib/types";
import { generatePDF } from "@/lib/pdf-generator";

const steps = [
  { id: "datos",        label: "Datos personales",  icon: "👤" },
  { id: "metodologia",  label: "Entrenamiento",      icon: "🏋️" },
  { id: "alimentacion", label: "Alimentación",       icon: "🥗" },
  { id: "nutricion",    label: "Nutrición diaria",   icon: "📊" },
  { id: "plan",         label: "Plan de entreno",    icon: "📋" },
  { id: "plannut",      label: "Plan nutricional",   icon: "🍽️" },
  { id: "suplementos",  label: "Suplementación",     icon: "💊" },
];

const sectionTitles: Record<string, string> = {
  datos:        "Datos personales",
  metodologia:  "Metodología de entrenamiento",
  alimentacion: "Metodología de alimentación",
  nutricion:    "Nutrición diaria",
  plan:         "Plan de entrenamiento",
  plannut:      "Plan nutricional",
  suplementos:  "Suplementación",
};

export function AlumnoForm() {
  const [activeTab, setActiveTab]               = useState("datos");
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [isGenerating, setIsGenerating]         = useState(false);

  const [formData, setFormData] = useState<AlumnoData>({
    nombreCompleto: "",
    edad: "",
    correo: "",
    fotoFrontal: null,
    fotoLateral: null,
    fotoPosterior: null,
    controles: [{
      fecha: new Date().toISOString().split('T')[0],
      control: 1, peso: "", musculo: "", grasa: "",
    }],
    metodologia: {
      metodologia: "", velocidadContraccion: "", objetivo: "", flexibilidad: "",
      metodologiaIntensidad: "", frecuenciaSemana: "", duracionMicrociclo: "",
      tiempoRecuperacion: "", duracionPrograma: "", trabajoCardiovascular: "", tipoFuerza: "",
    },
    alimentacion: {
      modeloCarbohidratos: "", modeloProteinas: "", modeloGrasas: "",
      modeloVitaminasMinerales: "", modeloAgua: "", modeloSodio: "",
    },
    nutricionDias: {
      entrenosFuertes: { proteina: "", carbohidratos: "", grasa: "", agua: "" },
      entrenosMedios:  { proteina: "", carbohidratos: "", grasa: "", agua: "" },
      soloCardio:      { proteina: "", carbohidratos: "", grasa: "", agua: "" },
      descanso:        { proteina: "", carbohidratos: "", grasa: "", agua: "" },
    },
    planEntrenamiento: { dias: [] },
    planNutricional:   { dias: [] },
    suplementacion:    { items: [] },
    ayudasErgogenicas: { descripcion: "" },
  });

  // ── Handlers (lógica intacta) ──────────────────────────────────────────────

  const handleInputChange = (field: keyof AlumnoData, value: string) =>
    setFormData(p => ({ ...p, [field]: value }));

  const handleImageUpload = (field: "fotoFrontal" | "fotoLateral" | "fotoPosterior", file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => setFormData(p => ({ ...p, [field]: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleControlChange = (index: number, field: keyof Control, value: string | number) => {
    const c = [...formData.controles];
    c[index] = { ...c[index], [field]: value };
    setFormData(p => ({ ...p, controles: c }));
  };

  const handleMetodologiaChange = (field: keyof AlumnoData['metodologia'], value: string) =>
    setFormData(p => ({ ...p, metodologia: { ...p.metodologia, [field]: value } }));

  const handleAlimentacionChange = (field: keyof AlumnoData['alimentacion'], value: string) =>
    setFormData(p => ({ ...p, alimentacion: { ...p.alimentacion, [field]: value } }));

  const handleNutricionChange = (
    tipo: keyof AlumnoData['nutricionDias'],
    field: keyof AlumnoData['nutricionDias']['entrenosFuertes'],
    value: string
  ) => setFormData(p => ({
    ...p,
    nutricionDias: { ...p.nutricionDias, [tipo]: { ...p.nutricionDias[tipo], [field]: value } },
  }));

  const addDiaPlan = () => {
    if (formData.planEntrenamiento.dias.length >= 7) return;
    setFormData(p => ({
      ...p,
      planEntrenamiento: {
        dias: [...p.planEntrenamiento.dias, { titulo: `DÍA ${p.planEntrenamiento.dias.length + 1}`, ejercicios: [] }],
      },
    }));
  };

  const removeDiaPlan = (i: number) =>
    setFormData(p => ({ ...p, planEntrenamiento: { dias: p.planEntrenamiento.dias.filter((_, j) => j !== i) } }));

  const updateDiaTitulo = (i: number, titulo: string) =>
    setFormData(p => ({
      ...p,
      planEntrenamiento: { dias: p.planEntrenamiento.dias.map((d, j) => j === i ? { ...d, titulo } : d) },
    }));

  const addEjercicio = (diaIndex: number) => {
    if (formData.planEntrenamiento.dias[diaIndex].ejercicios.length >= 12) return;
    setFormData(p => ({
      ...p,
      planEntrenamiento: {
        dias: p.planEntrenamiento.dias.map((d, i) =>
          i === diaIndex ? { ...d, ejercicios: [...d.ejercicios, { nombre: '', series: '', repeticiones: '' }] } : d
        ),
      },
    }));
  };

  const removeEjercicio = (diaIndex: number, ei: number) =>
    setFormData(p => ({
      ...p,
      planEntrenamiento: {
        dias: p.planEntrenamiento.dias.map((d, i) =>
          i === diaIndex ? { ...d, ejercicios: d.ejercicios.filter((_, j) => j !== ei) } : d
        ),
      },
    }));

  const updateEjercicio = (diaIndex: number, ei: number, field: 'nombre' | 'series' | 'repeticiones', value: string) =>
    setFormData(p => ({
      ...p,
      planEntrenamiento: {
        dias: p.planEntrenamiento.dias.map((d, i) =>
          i === diaIndex
            ? { ...d, ejercicios: d.ejercicios.map((e, j) => j === ei ? { ...e, [field]: value } : e) }
            : d
        ),
      },
    }));

  const addDiaNutricional = () => {
    if (formData.planNutricional.dias.length >= 7) return;
    setFormData(p => ({
      ...p,
      planNutricional: {
        dias: [...p.planNutricional.dias, { titulo: `DÍA ${p.planNutricional.dias.length + 1}`, comidas: [] }],
      },
    }));
  };

  const removeDiaNutricional = (i: number) =>
    setFormData(p => ({ ...p, planNutricional: { dias: p.planNutricional.dias.filter((_, j) => j !== i) } }));

  const updateDiaNutricionalTitulo = (i: number, titulo: string) =>
    setFormData(p => ({
      ...p,
      planNutricional: { dias: p.planNutricional.dias.map((d, j) => j === i ? { ...d, titulo } : d) },
    }));

  const addComida = (diaIndex: number) =>
    setFormData(p => ({
      ...p,
      planNutricional: {
        dias: p.planNutricional.dias.map((d, i) =>
          i === diaIndex ? { ...d, comidas: [...d.comidas, { nombre: '', alimentos: [], merienda: '' }] } : d
        ),
      },
    }));

  const removeComida = (diaIndex: number, ci: number) =>
    setFormData(p => ({
      ...p,
      planNutricional: {
        dias: p.planNutricional.dias.map((d, i) =>
          i === diaIndex ? { ...d, comidas: d.comidas.filter((_, j) => j !== ci) } : d
        ),
      },
    }));

  const updateComida = (diaIndex: number, ci: number, field: 'nombre' | 'merienda', value: string) =>
    setFormData(p => ({
      ...p,
      planNutricional: {
        dias: p.planNutricional.dias.map((d, i) =>
          i === diaIndex
            ? { ...d, comidas: d.comidas.map((c, j) => j === ci ? { ...c, [field]: value } : c) }
            : d
        ),
      },
    }));

  const addAlimento = (diaIndex: number, ci: number) =>
    setFormData(p => ({
      ...p,
      planNutricional: {
        dias: p.planNutricional.dias.map((d, i) =>
          i === diaIndex
            ? { ...d, comidas: d.comidas.map((c, j) => j === ci ? { ...c, alimentos: [...c.alimentos, { nombre: '', cantidad: '' }] } : c) }
            : d
        ),
      },
    }));

  const removeAlimento = (diaIndex: number, ci: number, ai: number) =>
    setFormData(p => ({
      ...p,
      planNutricional: {
        dias: p.planNutricional.dias.map((d, i) =>
          i === diaIndex
            ? { ...d, comidas: d.comidas.map((c, j) => j === ci ? { ...c, alimentos: c.alimentos.filter((_, k) => k !== ai) } : c) }
            : d
        ),
      },
    }));

  const updateAlimento = (diaIndex: number, ci: number, ai: number, field: 'nombre' | 'cantidad', value: string) =>
    setFormData(p => ({
      ...p,
      planNutricional: {
        dias: p.planNutricional.dias.map((d, i) =>
          i === diaIndex
            ? {
                ...d,
                comidas: d.comidas.map((c, j) =>
                  j === ci ? { ...c, alimentos: c.alimentos.map((a, k) => k === ai ? { ...a, [field]: value } : a) } : c
                ),
              }
            : d
        ),
      },
    }));

  const addSuplemento = () =>
    setFormData(p => ({ ...p, suplementacion: { items: [...p.suplementacion.items, ''] } }));

  const removeSuplemento = (i: number) =>
    setFormData(p => ({ ...p, suplementacion: { items: p.suplementacion.items.filter((_, j) => j !== i) } }));

  const updateSuplemento = (i: number, value: string) =>
    setFormData(p => ({ ...p, suplementacion: { items: p.suplementacion.items.map((s, j) => j === i ? value : s) } }));

  const updateAyudasErgogenicas = (value: string) =>
    setFormData(p => ({ ...p, ayudasErgogenicas: { descripcion: value } }));

  const markSectionCompleted = (id: string) => {
    if (!completedSections.includes(id)) setCompletedSections(prev => [...prev, id]);
  };

  const addControl = () => {
    const last = formData.controles[formData.controles.length - 1];
    setFormData(p => ({
      ...p,
      controles: [...p.controles, { fecha: new Date().toISOString().split('T')[0], control: last.control + 1, peso: "", musculo: "", grasa: "" }],
    }));
  };

  const removeControl = (i: number) => {
    if (formData.controles.length > 1)
      setFormData(p => ({ ...p, controles: p.controles.filter((_, j) => j !== i) }));
  };

  const handleGeneratePDF = async () => {
    if (!formData.nombreCompleto || !formData.edad || !formData.correo) {
      alert("Por favor completa todos los campos obligatorios");
      return;
    }
    setIsGenerating(true);
    try { await generatePDF(formData); }
    catch (e) { console.error(e); alert('Error al generar el PDF'); }
    finally { setIsGenerating(false); }
  };

  const loadExampleData = async () => {
    try {
      const res    = await fetch('/image.png');
      const blob   = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = reader.result as string;
        setFormData({
          nombreCompleto: "INGRID HERRERA", edad: "28", correo: "ingrid.herrera@ejemplo.com",
          fotoFrontal: img, fotoLateral: img, fotoPosterior: img,
          controles: [
            { fecha: "2026-02-01", control: 1, peso: "56", musculo: "35", grasa: "25" },
            { fecha: "2026-02-08", control: 2, peso: "55", musculo: "36", grasa: "24" },
          ],
          metodologia: {
            metodologia: "SUPER SERIES, DROP SETS, SERIES PIRAMIDALES",
            velocidadContraccion: "EXCENTRICA",
            objetivo: "RECOMPOSICION CORPORAL / PERDIDA DE PESO",
            flexibilidad: "10 MINUTOS POS ENTRENAMIENTO",
            metodologiaIntensidad: "POR VOLUMEN DE ENTRENAMIENTO",
            frecuenciaSemana: "5", duracionMicrociclo: "5 SEMANAS + SEMANA 0",
            tiempoRecuperacion: "90 SEGUNDOS", duracionPrograma: "HASTA ABRIL 2026",
            trabajoCardiovascular: "30 MINUTOS DIARIOS", tipoFuerza: "HIPERTROFIA",
          },
          alimentacion: {
            modeloCarbohidratos: "CICLICOS", modeloProteinas: "LINEALES", modeloGrasas: "OMEGA 3",
            modeloVitaminasMinerales: "MULTIVITAMINICO MAGNESIO", modeloAgua: "3 a 4 LITROS DIA", modeloSodio: "SAL MARINA",
          },
          nutricionDias: {
            entrenosFuertes: { proteina: "200 gr", carbohidratos: "350 gr", grasa: "80 gr", agua: "4 litros" },
            entrenosMedios:  { proteina: "180 gr", carbohidratos: "300 gr", grasa: "70 gr", agua: "3.5 litros" },
            soloCardio:      { proteina: "150 gr", carbohidratos: "250 gr", grasa: "60 gr", agua: "3 litros" },
            descanso:        { proteina: "120 gr", carbohidratos: "200 gr", grasa: "50 gr", agua: "2.5 litros" },
          },
          planEntrenamiento: {
            dias: [{
              titulo: "DÍA 1: PIERNAS Y GLÚTEOS",
              ejercicios: [
                { nombre: "1. CALENTAMIENTO EN ELÍPTICA 7 MIN + MOVILIDAD ARTICULAR", series: "1", repeticiones: "" },
                { nombre: "2. CALENTAR MOVIMIENTOS: SENTADILLAS, TIJERAS CON PESO CORPORAL", series: "3", repeticiones: "10" },
                { nombre: "3. SENTADILLA EN MÁQUINA SMITH + AVANZADAS CON MANCUERNAS", series: "3", repeticiones: "15-20" },
                { nombre: "4. SENTADILLA TIPO SUMO CON UNA MANCUERNA PESADA", series: "3", repeticiones: "12-15" },
                { nombre: "5. PRENSA UNIPODAL (UNA PIERNA)", series: "3", repeticiones: "12-15" },
              ],
            }],
          },
          planNutricional: {
            dias: [{
              titulo: "LUNES A VIERNES",
              comidas: [
                {
                  nombre: "DESAYUNO",
                  alimentos: [
                    { nombre: "Huevos", cantidad: "2 + 2 CLARAS" },
                    { nombre: "Queso Cottage", cantidad: "50 G" },
                    { nombre: "Piña", cantidad: "1" },
                  ],
                  merienda: "1 BATIDO DE PROTEÍNA + 15 G DE FRUTOS SECOS",
                },
                {
                  nombre: "ALMUERZO",
                  alimentos: [
                    { nombre: "Proteína", cantidad: "150 G" },
                    { nombre: "Ensalada Verde", cantidad: "100 G" },
                  ],
                  merienda: "1 YOGURT GRIEGO + FRUTOS ROJOS",
                },
              ],
            }],
          },
          suplementacion: {
            items: [
              '1. PROTEÍNA: AISLADA DE SUERO SEGUN INDICACIONES',
              '2. CREATINA TODOS LOS DIAS 5 GR',
              '3. PRE WORKOUT (OPCIONAL) ANTES DE ENTRENAR',
              '4. MAGNESIO CITRATO ANTES DE DORMIR',
            ],
          },
          ayudasErgogenicas: { descripcion: '' },
        });
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error(e);
      alert('Error al cargar datos de ejemplo');
    }
  };

  // ── Navigation ─────────────────────────────────────────────────────────────

  const currentIndex  = steps.findIndex(s => s.id === activeTab);
  const prevSection   = currentIndex > 0 ? steps[currentIndex - 1].id : null;
  const nextSection   = currentIndex < steps.length - 1 ? steps[currentIndex + 1].id : null;
  const isLastSection = currentIndex === steps.length - 1;

  const goNext = () => {
    markSectionCompleted(activeTab);
    if (isLastSection) handleGeneratePDF();
    else if (nextSection) setActiveTab(nextSection);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>

      {/* ── Sidebar — Material Navigation Rail ───────────────────────────────── */}
      <aside style={{
        width: '256px', minWidth: '256px',
        backgroundColor: '#211F26',
        borderRight: '1px solid #35343B',
        height: '100vh',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0,
      }}>
        {/* App header */}
        <div style={{ padding: '24px 16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: '#DA667B',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', flexShrink: 0,
              boxShadow: '0px 1px 2px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(218,102,123,0.2)',
            }}>⚡</div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 500, color: '#E5E6E4', margin: 0, letterSpacing: '0.01em' }}>
                Hoja de Vida
              </p>
              <p style={{ fontSize: '11px', color: '#6C6977', margin: 0, letterSpacing: '0.04em' }}>
                Forged by Yesitrainer
              </p>
            </div>
          </div>
        </div>

        {/* M3 Navigation items */}
        <nav style={{ flex: 1, padding: '8px 12px', overflowY: 'auto' }}>
          {steps.map((step, idx) => {
            const isActive    = activeTab === step.id;
            const isCompleted = completedSections.includes(step.id);
            return (
              <button
                key={step.id}
                onClick={() => setActiveTab(step.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  width: '100%', padding: '0 16px', marginBottom: '2px',
                  height: '52px',
                  background: isActive ? 'rgba(218,102,123,0.16)' : 'transparent',
                  border: 'none',
                  borderRadius: '26px',        /* M3 full-pill indicator */
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'background 200ms ease',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(232,228,240,0.08)';
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                {/* M3 active indicator dot / check */}
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                  backgroundColor: isCompleted
                    ? '#DA667B'
                    : isActive
                    ? 'rgba(218,102,123,0.24)'
                    : 'rgba(232,228,240,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isCompleted ? '13px' : '12px',
                  color: isCompleted ? '#FFFFFF' : isActive ? '#DA667B' : '#6C6977',
                  fontWeight: 500,
                  transition: 'all 200ms',
                }}>
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span style={{
                  fontSize: '14px',
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? '#F2B8C6' : isCompleted ? '#9E9BA8' : '#8C8FA0',
                  transition: 'color 200ms',
                  letterSpacing: '0.01em',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {step.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* M3 Linear progress indicator */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #35343B' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', color: '#6C6977', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 }}>Progreso</span>
            <span style={{ fontSize: '12px', color: '#F2B8C6', fontWeight: 500 }}>
              {completedSections.length} / {steps.length}
            </span>
          </div>
          {/* M3 Linear progress */}
          <div style={{ height: '4px', background: 'rgba(218,102,123,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(completedSections.length / steps.length) * 100}%`,
              background: '#DA667B',
              borderRadius: '2px',
              transition: 'width 400ms cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '40px 48px', backgroundColor: '#1C1B20' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>

          {/* M3 Section header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            marginBottom: '28px',
          }}>
            <div>
              <p style={{ fontSize: '11px', color: '#9AC8D4', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500 }}>
                Paso {currentIndex + 1} de {steps.length}
              </p>
              <h1 style={{ fontSize: '24px', fontWeight: 400, color: '#E5E6E4', margin: 0, letterSpacing: '0em' }}>
                {sectionTitles[activeTab]}
              </h1>
            </div>
            <button className="btn-link" onClick={loadExampleData} style={{ marginTop: '10px', flexShrink: 0 }}>
              Llenar con ejemplo
            </button>
          </div>

          {/* ── DATOS PERSONALES ─────────────────────────────────────────────── */}
          {activeTab === 'datos' && (
            <div>
              {/* Información básica */}
              <div className="form-card">
                <span className="group-label">Información básica</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label className="form-label">Nombre completo *</label>
                    <input className="form-input" placeholder="INGRID HERRERA"
                      value={formData.nombreCompleto} onChange={e => handleInputChange("nombreCompleto", e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Edad *</label>
                    <input className="form-input" type="number" placeholder="28"
                      value={formData.edad} onChange={e => handleInputChange("edad", e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Correo electrónico *</label>
                  <input className="form-input" type="email" placeholder="correo@ejemplo.com"
                    value={formData.correo} onChange={e => handleInputChange("correo", e.target.value)} />
                </div>
              </div>

              {/* Fotos */}
              <div className="form-card">
                <span className="group-label">Fotografías</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  {(['fotoFrontal', 'fotoLateral', 'fotoPosterior'] as const).map((key, i) => (
                    <div key={key}>
                      <label className="form-label">{['Frontal', 'Lateral', 'Posterior'][i]}</label>
                      {formData[key] ? (
                        <div style={{ position: 'relative' }}>
                          <img
                            src={formData[key] as string}
                            alt={key}
                            style={{ width: '100%', height: '130px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #35343B', display: 'block' }}
                          />
                          <button
                            onClick={() => setFormData(p => ({ ...p, [key]: null }))}
                            style={{
                              position: 'absolute', top: '6px', right: '6px',
                              background: 'rgba(28,27,32,0.88)', border: '1px solid #48464F',
                              color: '#C8C5D0', width: '28px', height: '28px', borderRadius: '50%',
                              cursor: 'pointer', fontSize: '14px', lineHeight: 1,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontFamily: 'inherit',
                            }}
                          >×</button>
                        </div>
                      ) : (
                        <label style={{ display: 'block', cursor: 'pointer' }}>
                          <div style={{
                            border: '1px dashed #48464F', borderRadius: '12px', height: '130px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            gap: '8px',
                            color: '#6C6977', fontSize: '13px',
                            transition: 'border-color 200ms, background 200ms',
                            background: 'transparent',
                          }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLDivElement).style.borderColor = '#DA667B';
                              (e.currentTarget as HTMLDivElement).style.background = 'rgba(218,102,123,0.05)';
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLDivElement).style.borderColor = '#48464F';
                              (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                            }}
                          >
                            <span style={{ fontSize: '22px' }}>📷</span>
                            <span>Subir imagen</span>
                          </div>
                          <input type="file" accept="image/*" style={{ display: 'none' }}
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(key, f); }} />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Controles */}
              <div className="form-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span className="group-label" style={{ margin: 0 }}>Controles de medición</span>
                  <button className="btn-link" onClick={addControl}>+ Agregar control</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 1fr 1fr 1fr 36px', gap: '8px', paddingBottom: '10px', borderBottom: '1px solid #35343B', marginBottom: '4px' }}>
                  {['Fecha', 'Control', 'Peso (kg)', 'Músculo (%)', 'Grasa (%)', ''].map(h => (
                    <span key={h} className="th">{h}</span>
                  ))}
                </div>

                {formData.controles.map((ctrl, index) => (
                  <div key={index} className="row-hover" style={{
                    display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 1fr 1fr 1fr 36px',
                    gap: '8px', padding: '6px 0', borderBottom: '1px solid #2A2930', alignItems: 'center',
                  }}>
                    <input className="form-input" type="date" value={ctrl.fecha}
                      onChange={e => handleControlChange(index, "fecha", e.target.value)} />
                    <input className="form-input" type="number" value={ctrl.control}
                      onChange={e => handleControlChange(index, "control", parseInt(e.target.value))}
                      style={{ textAlign: 'center' }} />
                    <input className="form-input" placeholder="56" value={ctrl.peso}
                      onChange={e => handleControlChange(index, "peso", e.target.value)} />
                    <input className="form-input" placeholder="35" value={ctrl.musculo}
                      onChange={e => handleControlChange(index, "musculo", e.target.value)} />
                    <input className="form-input" placeholder="25" value={ctrl.grasa}
                      onChange={e => handleControlChange(index, "grasa", e.target.value)} />
                    {formData.controles.length > 1
                      ? <button className="btn-delete" onClick={() => removeControl(index)}>×</button>
                      : <span />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── METODOLOGÍA ──────────────────────────────────────────────────── */}
          {activeTab === 'metodologia' && (
            <div className="form-card">
              <span className="group-label">Parámetros generales</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {([
                  ['metodologia',          'Metodología',                   'SUPER SERIES, DROP SETS'],
                  ['velocidadContraccion',  'Velocidad de la contracción',   'EXCENTRICA'],
                  ['objetivo',             'Objetivo',                      'RECOMPOSICION CORPORAL'],
                  ['flexibilidad',         'Flexibilidad',                  '10 MINUTOS POS ENTRENAMIENTO'],
                  ['metodologiaIntensidad','Metodología de intensidad',     'POR VOLUMEN'],
                  ['frecuenciaSemana',     'Frecuencia semanal',            '5'],
                  ['duracionMicrociclo',   'Duración del microciclo',       '5 SEMANAS + SEMANA 0'],
                  ['tiempoRecuperacion',   'Tiempo de recuperación',        '90 SEGUNDOS'],
                  ['duracionPrograma',     'Duración del programa',         'HASTA ABRIL 2026'],
                  ['trabajoCardiovascular','Trabajo cardiovascular',        '30 MINUTOS DIARIOS'],
                  ['tipoFuerza',           'Tipo de fuerza',               'HIPERTROFIA'],
                ] as [keyof AlumnoData['metodologia'], string, string][]).map(([field, label, ph]) => (
                  <div key={field}>
                    <label className="form-label">{label}</label>
                    <input className="form-input" placeholder={ph}
                      value={formData.metodologia[field]}
                      onChange={e => handleMetodologiaChange(field, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ALIMENTACIÓN ─────────────────────────────────────────────────── */}
          {activeTab === 'alimentacion' && (
            <div>
              <p style={{ fontSize: '14px', color: '#8C8FA0', marginBottom: '20px', lineHeight: 1.7, padding: '14px 16px', background: '#28272E', borderRadius: '12px', borderLeft: '3px solid #3891A6' }}>
                La nutrición va ligada al tipo de entreno y actividades cotidianas. Define los modelos de ingesta de nutrientes para maximizar los resultados según el objetivo.
              </p>
              <div className="form-card">
                <span className="group-label">Modelos de nutrientes</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {([
                    ['modeloCarbohidratos',     'Carbohidratos',        'CICLICOS'],
                    ['modeloProteinas',          'Proteínas',            'LINEALES'],
                    ['modeloGrasas',             'Grasas',               'OMEGA 3'],
                    ['modeloVitaminasMinerales', 'Vitaminas y minerales','MULTIVITAMINICO MAGNESIO'],
                    ['modeloAgua',              'Agua',                 '3 a 4 LITROS DIA'],
                    ['modeloSodio',             'Sodio',                'SAL MARINA'],
                  ] as [keyof AlumnoData['alimentacion'], string, string][]).map(([field, label, ph]) => (
                    <div key={field}>
                      <label className="form-label">{label}</label>
                      <input className="form-input" placeholder={ph}
                        value={formData.alimentacion[field]}
                        onChange={e => handleAlimentacionChange(field, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── NUTRICIÓN DIARIA ─────────────────────────────────────────────── */}
          {activeTab === 'nutricion' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {([
                ['entrenosFuertes', 'Entrenamientos fuertes', '🔥'],
                ['entrenosMedios',  'Entrenamientos medios',  '⚡'],
                ['soloCardio',      'Solo cardio',            '🏃'],
                ['descanso',        'Descanso',               '😴'],
              ] as [keyof AlumnoData['nutricionDias'], string, string][]).map(([tipo, label, icon]) => (
                <div key={tipo} className="form-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(218,102,123,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{icon}</div>
                    <span className="group-label" style={{ margin: 0 }}>{label}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px' }}>
                    {(['proteina', 'carbohidratos', 'grasa', 'agua'] as const).map(field => (
                      <div key={field}>
                        <label className="form-label">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                        <input className="form-input"
                          placeholder={{ proteina: '200 gr', carbohidratos: '350 gr', grasa: '80 gr', agua: '4 L' }[field]}
                          value={formData.nutricionDias[tipo][field]}
                          onChange={e => handleNutricionChange(tipo, field, e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── PLAN DE ENTRENAMIENTO ────────────────────────────────────────── */}
          {activeTab === 'plan' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span className="group-label" style={{ margin: 0 }}>Días de entrenamiento</span>
                <button className="btn-link"
                  onClick={addDiaPlan}
                  style={{ opacity: formData.planEntrenamiento.dias.length >= 7 ? 0.3 : 1 }}
                  disabled={formData.planEntrenamiento.dias.length >= 7}
                >+ Agregar día</button>
              </div>

              {formData.planEntrenamiento.dias.length === 0
                ? (
                  <div style={{ textAlign: 'center', padding: '48px 24px', border: '1px dashed #35343B', borderRadius: '16px', background: '#211F26' }}>
                    <p style={{ fontSize: '32px', margin: '0 0 12px' }}>📋</p>
                    <p style={{ color: '#8C8FA0', fontSize: '14px', margin: '0 0 4px', fontWeight: 500 }}>Sin días aún</p>
                    <p style={{ color: '#6C6977', fontSize: '13px', margin: 0 }}>Usa el botón de arriba para agregar un día.</p>
                  </div>
                )
                : formData.planEntrenamiento.dias.map((dia, diaIndex) => (
                    <div key={diaIndex} className="form-card" style={{ marginBottom: '12px' }}>
                      {/* Day header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid #35343B' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(218,102,123,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#F2B8C6', fontWeight: 500, flexShrink: 0 }}>
                            {diaIndex + 1}
                          </div>
                          <input className="input-ghost"
                            placeholder={`DÍA ${diaIndex + 1}: GRUPO MUSCULAR`}
                            value={dia.titulo}
                            onChange={e => updateDiaTitulo(diaIndex, e.target.value)} />
                        </div>
                        <button className="btn-link-danger" onClick={() => removeDiaPlan(diaIndex)}>
                          Eliminar
                        </button>
                      </div>

                      {/* Column headers */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 36px', gap: '8px', paddingBottom: '8px', borderBottom: '1px solid #35343B', marginBottom: '4px' }}>
                        {['Ejercicio / metodología', 'Series', 'Reps', ''].map(h => (
                          <span key={h} className="th">{h}</span>
                        ))}
                      </div>

                      {dia.ejercicios.length === 0
                        ? <p style={{ color: '#6C6977', fontSize: '13px', padding: '10px 0' }}>Sin ejercicios. Usa el botón de abajo.</p>
                        : dia.ejercicios.map((ej, ei) => (
                            <div key={ei} className="row-hover" style={{
                              display: 'grid', gridTemplateColumns: '1fr 80px 100px 36px',
                              gap: '8px', padding: '5px 0', borderBottom: '1px solid #2A2930', alignItems: 'center',
                            }}>
                              <input className="form-input" placeholder="Nombre del ejercicio..."
                                value={ej.nombre} onChange={e => updateEjercicio(diaIndex, ei, 'nombre', e.target.value)} />
                              <input className="form-input" placeholder="3"
                                value={ej.series} onChange={e => updateEjercicio(diaIndex, ei, 'series', e.target.value)}
                                style={{ textAlign: 'center' }} />
                              <input className="form-input" placeholder="15-20"
                                value={ej.repeticiones} onChange={e => updateEjercicio(diaIndex, ei, 'repeticiones', e.target.value)}
                                style={{ textAlign: 'center' }} />
                              <button className="btn-delete" onClick={() => removeEjercicio(diaIndex, ei)}>×</button>
                            </div>
                          ))
                      }

                      <button className="btn-link" onClick={() => addEjercicio(diaIndex)} style={{ marginTop: '14px' }}>
                        + Agregar ejercicio
                      </button>
                    </div>
                  ))
              }
            </div>
          )}

          {/* ── PLAN NUTRICIONAL ─────────────────────────────────────────────── */}
          {activeTab === 'plannut' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span className="group-label" style={{ margin: 0 }}>Días del plan nutricional</span>
                <button className="btn-link"
                  onClick={addDiaNutricional}
                  style={{ opacity: formData.planNutricional.dias.length >= 7 ? 0.3 : 1 }}
                  disabled={formData.planNutricional.dias.length >= 7}
                >+ Agregar día</button>
              </div>

              {formData.planNutricional.dias.length === 0
                ? (
                  <div style={{ textAlign: 'center', padding: '48px 24px', border: '1px dashed #35343B', borderRadius: '16px', background: '#211F26' }}>
                    <p style={{ fontSize: '32px', margin: '0 0 12px' }}>🍽️</p>
                    <p style={{ color: '#8C8FA0', fontSize: '14px', margin: '0 0 4px', fontWeight: 500 }}>Sin días aún</p>
                    <p style={{ color: '#6C6977', fontSize: '13px', margin: 0 }}>Usa el botón de arriba para agregar un día.</p>
                  </div>
                )
                : formData.planNutricional.dias.map((dia, diaIndex) => (
                    <div key={diaIndex} className="form-card" style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid #35343B' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(56,145,166,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#9AC8D4', fontWeight: 500, flexShrink: 0 }}>
                            {diaIndex + 1}
                          </div>
                          <input className="input-ghost"
                            placeholder="LUNES A VIERNES"
                            value={dia.titulo}
                            onChange={e => updateDiaNutricionalTitulo(diaIndex, e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0, marginLeft: '8px' }}>
                          <button className="btn-link" onClick={() => addComida(diaIndex)}>+ Comida</button>
                          <button className="btn-link-danger" onClick={() => removeDiaNutricional(diaIndex)}>Eliminar</button>
                        </div>
                      </div>

                      {dia.comidas.length === 0
                        ? <p style={{ color: '#6C6977', fontSize: '13px' }}>Sin comidas. Agrega una arriba.</p>
                        : dia.comidas.map((comida, ci) => (
                            <div key={ci} style={{ marginBottom: '12px', background: '#211F26', borderRadius: '12px', padding: '14px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <input className="input-ghost-sm"
                                  placeholder="DESAYUNO"
                                  value={comida.nombre}
                                  onChange={e => updateComida(diaIndex, ci, 'nombre', e.target.value)} />
                                <div style={{ display: 'flex', gap: '4px', flexShrink: 0, marginLeft: '8px' }}>
                                  <button className="btn-link" onClick={() => addAlimento(diaIndex, ci)}>+ alimento</button>
                                  <button className="btn-link-danger" onClick={() => removeComida(diaIndex, ci)}>×</button>
                                </div>
                              </div>

                              {comida.alimentos.length > 0 && (
                                <div style={{ marginBottom: '12px' }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px 36px', gap: '8px', paddingBottom: '6px', borderBottom: '1px solid #35343B' }}>
                                    {['Alimento', 'Cantidad', ''].map(h => <span key={h} className="th">{h}</span>)}
                                  </div>
                                  {comida.alimentos.map((al, ai) => (
                                    <div key={ai} className="row-hover" style={{
                                      display: 'grid', gridTemplateColumns: '1fr 150px 36px',
                                      gap: '8px', padding: '5px 0', borderBottom: '1px solid #2A2930', alignItems: 'center',
                                    }}>
                                      <input className="form-input" placeholder="Nombre del alimento" value={al.nombre}
                                        onChange={e => updateAlimento(diaIndex, ci, ai, 'nombre', e.target.value)} />
                                      <input className="form-input" placeholder="100 G" value={al.cantidad}
                                        onChange={e => updateAlimento(diaIndex, ci, ai, 'cantidad', e.target.value)} />
                                      <button className="btn-delete" onClick={() => removeAlimento(diaIndex, ci, ai)}>×</button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div style={{ marginTop: '12px' }}>
                                <label className="form-label">Merienda / snack (opcional)</label>
                                <textarea className="form-textarea" rows={2}
                                  placeholder="1 BATIDO DE PROTEÍNA + FRUTOS SECOS..."
                                  value={comida.merienda || ''}
                                  onChange={e => updateComida(diaIndex, ci, 'merienda', e.target.value)} />
                              </div>
                            </div>
                          ))
                      }
                    </div>
                  ))
              }
            </div>
          )}

          {/* ── SUPLEMENTACIÓN ───────────────────────────────────────────────── */}
          {activeTab === 'suplementos' && (
            <div>
              <div className="form-card" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span className="group-label" style={{ margin: 0 }}>Suplementos</span>
                  <button className="btn-link" onClick={addSuplemento}>+ Agregar</button>
                </div>

                {formData.suplementacion.items.length === 0
                  ? <p style={{ color: '#6C6977', fontSize: '13px' }}>Sin suplementos aún.</p>
                  : formData.suplementacion.items.map((item, i) => (
                      <div key={i} className="row-hover" style={{
                        display: 'grid', gridTemplateColumns: '1fr 36px',
                        gap: '8px', padding: '5px 0', borderBottom: '1px solid #2A2930', alignItems: 'center',
                      }}>
                        <input className="form-input" placeholder={`${i + 1}. Suplemento...`}
                          value={item} onChange={e => updateSuplemento(i, e.target.value)} />
                        <button className="btn-delete" onClick={() => removeSuplemento(i)}>×</button>
                      </div>
                    ))
                }
              </div>

              <div className="form-card">
                <span className="group-label">Ayudas ergogénicas</span>
                <label className="form-label">Descripción (opcional)</label>
                <textarea className="form-textarea" rows={5}
                  placeholder="Describe las ayudas si aplica..."
                  value={formData.ayudasErgogenicas.descripcion}
                  onChange={e => updateAyudasErgogenicas(e.target.value)} />
              </div>
            </div>
          )}

          {/* ── Navigation footer ────────────────────────────────────────────── */}
          <div style={{
            display: 'flex', justifyContent: prevSection ? 'space-between' : 'flex-end',
            alignItems: 'center', marginTop: '40px', paddingTop: '24px', borderTop: '1px solid #35343B',
          }}>
            {prevSection && (
              <button className="btn-ghost" onClick={() => setActiveTab(prevSection)}>
                ← Anterior
              </button>
            )}
            <button
              className={isLastSection ? 'btn-primary' : 'btn-ghost'}
              onClick={goNext}
              disabled={isGenerating}
            >
              {isLastSection
                ? (isGenerating ? '⏳ Generando PDF...' : '⬇ Generar y descargar PDF')
                : 'Siguiente →'}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
