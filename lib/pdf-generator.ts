// @ts-nocheck
'use client';

import { PDFDocument, PDFPage, PDFFont, rgb, StandardFonts } from 'pdf-lib';

type PdfPage = PDFPage;
type PdfFont = PDFFont;
import { AlumnoData, NutricionDia } from './types';

// Helper functions para verificar si una sección tiene datos
const hasBasicData = (data: AlumnoData): boolean => {
  return !!(data.nombreCompleto || data.edad || data.correo);
};

const hasPhotos = (data: AlumnoData): boolean => {
  return !!(data.fotoFrontal || data.fotoLateral || data.fotoPosterior);
};

const hasControls = (data: AlumnoData): boolean => {
  return data.controles.length > 0 && data.controles.some(c => c.peso || c.musculo || c.grasa);
};

const hasMetodologia = (data: AlumnoData): boolean => {
  const m = data.metodologia;
  return !!(m.metodologia || m.velocidadContraccion || m.objetivo || m.flexibilidad || 
            m.metodologiaIntensidad || m.frecuenciaSemana || m.duracionMicrociclo || 
            m.tiempoRecuperacion || m.duracionPrograma || m.trabajoCardiovascular || m.tipoFuerza);
};

const hasAlimentacion = (data: AlumnoData): boolean => {
  const a = data.alimentacion;
  return !!(a.modeloCarbohidratos || a.modeloProteinas || a.modeloGrasas || 
            a.modeloVitaminasMinerales || a.modeloAgua || a.modeloSodio);
};

const hasNutricionDia = (dia: NutricionDia): boolean => {
  return !!(dia.proteina || dia.carbohidratos || dia.grasa || dia.agua);
};

const hasNutricionDias = (data: AlumnoData): boolean => {
  return hasNutricionDia(data.nutricionDias.entrenosFuertes) ||
         hasNutricionDia(data.nutricionDias.entrenosMedios) ||
         hasNutricionDia(data.nutricionDias.soloCardio) ||
         hasNutricionDia(data.nutricionDias.descanso);
};

const hasPlanEntrenamiento = (data: AlumnoData): boolean => {
  return data.planEntrenamiento.dias.length > 0 &&
         data.planEntrenamiento.dias.some(dia => 
           dia.titulo || dia.ejercicios.some(e => e.nombre || e.series || e.repeticiones)
         );
};

const hasPlanNutricional = (data: AlumnoData): boolean => {
  return data.planNutricional.dias.length > 0 &&
         data.planNutricional.dias.some(dia => 
           dia.titulo || dia.comidas.some(c => 
             c.nombre || c.merienda || c.alimentos.some(a => a.nombre || a.cantidad)
           )
         );
};

const hasSuplemementacion = (data: AlumnoData): boolean => {
  return data.suplementacion.items.length > 0 &&
         data.suplementacion.items.some(item => item.trim() !== '') ||
         !!data.ayudasErgogenicas.descripcion;
};

export const generatePDF = async (data: AlumnoData) => {
  try {
    // 1. Cargar el template PDF
    const templateBytes = await fetch('/template.pdf').then(res => res.arrayBuffer());
    const templateDoc = await PDFDocument.load(templateBytes);
    
    // 2. Crear un nuevo documento que incluirá todo
    const finalDoc = await PDFDocument.create();
    
    // 3. Copiar las primeras 2 páginas del template
    const templatePages = await finalDoc.copyPages(templateDoc, [0, 1]);
    templatePages.forEach(page => finalDoc.addPage(page));
    
    // Cargar fuentes (disponibles globalmente)
    const helveticaBold = await finalDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await finalDoc.embedFont(StandardFonts.Helvetica);
    
    // Marca: icono Forged by Yesitrainer (forged_transparent.png) en el header
    let forgedLogo: Awaited<ReturnType<PDFDocument['embedPng']>> | null = null;
    try {
      const res = await fetch('/forged_transparent.png');
      if (res.ok) {
        const ab = await res.arrayBuffer();
        forgedLogo = await finalDoc.embedPng(new Uint8Array(ab));
      }
    } catch {
      // Si falla la carga, se usará texto
    }
    const BRAND_PLAN_NAME = 'Forged by Yesitrainer';

    const drawBrandBadge = (
      page: { drawImage: (img: Awaited<ReturnType<PDFDocument['embedPng']>>, opts: { x: number; y: number; width: number; height: number }) => void; drawText: (text: string, opts: { x: number; y: number; size: number; font: typeof helveticaBold; color: ReturnType<typeof rgb> }) => void },
      rightX: number,
      yCenter: number,
      logoHeight: number
    ) => {
      if (forgedLogo) {
        const scale = logoHeight / forgedLogo.height;
        const w = forgedLogo.width * scale;
        page.drawImage(forgedLogo, { x: rightX - w, y: yCenter - logoHeight / 2, width: w, height: logoHeight });
      } else {
        const size = 11;
        const tw = helveticaBold.widthOfTextAtSize(BRAND_PLAN_NAME, size);
        page.drawText(BRAND_PLAN_NAME, { x: rightX - tw, y: yCenter - 5, size, font: helveticaBold, color: blanco });
      }
    };

    // Colores (disponibles globalmente)
    const verde = rgb(0.72, 0.72, 0.72); // gris medio
    const negro = rgb(0, 0, 0);
    const blanco = rgb(1, 1, 1);
    const grisClaro = rgb(0.9, 0.9, 0.9);
    
    const width = 595;
    const height = 842;

    // =========================
    // MATERIAL DESIGN SYSTEM
    // =========================
    const MATERIAL = {
      page: { width: 595, height: 842 },
      margin: 40,
      gap: 14,
      pad: 14,
      radius: 14,
      minBottom: 60,
      colors: {
        bg:         rgb(1, 1, 1),
        surface:    rgb(0.976, 0.98, 0.984),
        border:     rgb(0.89, 0.9, 0.91),
        shadow:     rgb(0.95, 0.955, 0.96),
        text:       rgb(0.11, 0.12, 0.14),
        muted:      rgb(0.42, 0.45, 0.50),
        accent:     rgb(0.58, 0.61, 0.66),
        accentSoft: rgb(0.91, 0.92, 0.93),
        zebra:      rgb(0.985, 0.988, 0.992),
      },
    } as const;

    const measureText = (font: PdfFont, text: string, size: number) =>
      font.widthOfTextAtSize(text, size);

    const truncateTextG = (text: string, maxWidth: number, font: PdfFont, size: number): string => {
      const str = String(text || "");
      if (measureText(font, str, size) <= maxWidth) return str;
      let s = str;
      while (s.length > 0 && measureText(font, s + "…", size) > maxWidth) s = s.slice(0, -1);
      return s ? s + "…" : "…";
    };

    const wrapText = (
      text: string,
      maxWidth: number,
      font: PdfFont,
      size: number,
      maxLines?: number
    ): string[] => {
      const str = String(text || "").trim();
      if (!str) return [];
      const words = str.split(/\s+/);
      const lines: string[] = [];
      let current = "";
      for (const w of words) {
        const test = current ? `${current} ${w}` : w;
        if (measureText(font, test, size) <= maxWidth) {
          current = test;
        } else {
          if (current) lines.push(current);
          current = w;
        }
      }
      if (current) lines.push(current);
      if (typeof maxLines === "number" && lines.length > maxLines) {
        const out = lines.slice(0, maxLines);
        out[maxLines - 1] = truncateTextG(out[maxLines - 1], maxWidth, font, size);
        return out;
      }
      return lines;
    };

    const drawMaterialBackground = (pg: PdfPage) => {
      pg.drawRectangle({ x: 0, y: 0, width: MATERIAL.page.width, height: MATERIAL.page.height, color: MATERIAL.colors.bg });
    };

    // Degradado metálico horizontal (franjas apiladas de arriba a abajo)
    // t=0 → parte superior (tira 0), t=1 → parte inferior
    const drawMetallicH = (pg: PdfPage, x: number, yBottom: number, w: number, h: number) => {
      const steps = 22;
      const stripH = h / steps;
      for (let i = 0; i < steps; i++) {
        // t=0 en la franja superior (dibujamos de abajo hacia arriba)
        const t = 1 - i / (steps - 1);
        // Curva metálica plateada: rango 0.76–0.93 para buen contraste con texto negro
        const g = 0.82 + 0.10 * Math.cos(t * Math.PI) - 0.03 * Math.cos(t * 2.8 * Math.PI);
        const gClamped = Math.max(0.76, Math.min(0.94, g));
        pg.drawRectangle({
          x,
          y: yBottom + i * stripH,
          width: w,
          height: stripH + 0.8,
          color: rgb(gClamped * 0.95, gClamped * 0.97, gClamped),
        });
      }
    };

    // Degradado metálico vertical (franjas de izquierda a derecha, para barras estrechas)
    const drawMetallicV = (pg: PdfPage, x: number, yBottom: number, w: number, h: number) => {
      const steps = 10;
      const stripW = w / steps;
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        // Pico brillante en el centro (t=0.5)
        const g = 0.72 + 0.22 * Math.sin((t + 0.05) * Math.PI);
        const gClamped = Math.max(0.60, Math.min(0.96, g));
        pg.drawRectangle({
          x: x + i * stripW,
          y: yBottom,
          width: stripW + 0.5,
          height: h,
          color: rgb(gClamped * 0.95, gClamped * 0.97, gClamped),
        });
      }
    };

    const drawCardM = (pg: PdfPage, x: number, yTop: number, w: number, h: number) => {
      pg.drawRectangle({ x: x + 2, y: (yTop - h) - 2, width: w, height: h, color: MATERIAL.colors.shadow, borderRadius: MATERIAL.radius });
      pg.drawRectangle({ x, y: yTop - h, width: w, height: h, color: MATERIAL.colors.surface, borderRadius: MATERIAL.radius });
    };

    const drawChipM = (pg: PdfPage, x: number, yTop: number, label: string) => {
      const padX = 10, padY = 5, size = 9;
      const w = measureText(helveticaBold, label, size) + padX * 2;
      const h = size + padY * 2;
      // Base redondeada (para que las esquinas sean del color de fondo)
      pg.drawRectangle({ x, y: yTop - h, width: w, height: h, color: MATERIAL.colors.surface, borderRadius: 999 });
      // Degradado metálico encima (sin radio, quedará contenido visualmente dentro del pill)
      drawMetallicH(pg, x + 2, yTop - h + 2, w - 4, h - 4);
      // Texto encima
      pg.drawText(label, { x: x + padX, y: yTop - h + padY + 1, size, font: helveticaBold, color: rgb(0.08, 0.09, 0.11) });
      return { w, h };
    };

    const drawHeaderMinimal = (pg: PdfPage, yTop: number, titleLines: string[]) => {
      const headerH = 56;
      drawMetallicV(pg, MATERIAL.margin, yTop - headerH + 10, 4, headerH - 20);
      titleLines.slice(0, 2).forEach((t, i) => {
        pg.drawText(t, { x: MATERIAL.margin + 14, y: yTop - 24 - (i * 18), size: 18, font: helveticaBold, color: MATERIAL.colors.text });
      });
      drawBrandBadge(pg, MATERIAL.page.width - MATERIAL.margin, yTop - headerH / 2, 22);
      pg.drawRectangle({ x: MATERIAL.margin, y: yTop - headerH - 8, width: MATERIAL.page.width - MATERIAL.margin * 2, height: 1, color: MATERIAL.colors.border });
      return yTop - headerH - 18;
    };

    const drawFooterM = (pg: PdfPage) => {
      pg.drawText("Generado el " + new Date().toLocaleDateString("es"), { x: MATERIAL.margin, y: 28, size: 8.5, font: helvetica, color: MATERIAL.colors.muted });
    };

    const startMaterialPage = (titleLines: string[]) => {
      const pg = finalDoc.addPage([MATERIAL.page.width, MATERIAL.page.height]);
      drawMaterialBackground(pg);
      let y = MATERIAL.page.height - MATERIAL.margin;
      y = drawHeaderMinimal(pg, y, titleLines);
      return { page: pg, y };
    };

    const ensureSpace = (state: { page: PdfPage; y: number }, neededHeight: number, titleLines: string[]) => {
      if (state.y - neededHeight < MATERIAL.minBottom) {
        drawFooterM(state.page);
        return startMaterialPage(titleLines);
      }
      return state;
    };

    const drawIntroCard = (pg: PdfPage, x: number, yTop: number, w: number, text: string) => {
      const pad = MATERIAL.pad, size = 10, lineH = 14;
      const lines = wrapText(text, w - pad * 2, helvetica, size, 4);
      const h = Math.max(54, pad * 2 + lines.length * lineH);
      drawCardM(pg, x, yTop, w, h);
      pg.drawRectangle({ x: x + pad, y: yTop - 10, width: 80, height: 2, color: MATERIAL.colors.accent, borderRadius: 2 });
      let y = yTop - pad - 10;
      for (const line of lines) {
        pg.drawText(line, { x: x + pad, y, size, font: helvetica, color: MATERIAL.colors.muted, maxWidth: w - pad * 2 });
        y -= lineH;
      }
      return yTop - h - MATERIAL.gap;
    };

    const drawKeyValueCard = (pg: PdfPage, x: number, yTop: number, w: number, label: string, value: string) => {
      const pad = MATERIAL.pad, labelSize = 8.5, valueSize = 11, lineH = 13;
      const safeValue = (value && value.trim()) ? value : "—";
      const valueLines = wrapText(safeValue, w - pad * 2, helvetica, valueSize, 2);
      const h = 12 + 6 + valueLines.length * lineH + 8;
      drawCardM(pg, x, yTop, w, h);
      pg.drawText(label, { x: x + pad, y: yTop - 13, size: labelSize, font: helveticaBold, color: MATERIAL.colors.muted });
      let y = yTop - 27;
      valueLines.forEach((ln) => {
        pg.drawText(ln, { x: x + pad, y, size: valueSize, font: helveticaBold, color: MATERIAL.colors.text, maxWidth: w - pad * 2 });
        y -= lineH;
      });
      return yTop - h - 7;
    };

    const drawGridCard = (pg: PdfPage, x: number, yTop: number, w: number, h: number, label: string, value: string) => {
      const pad = MATERIAL.pad, labelSize = 9, valueSize = 12, lineH = 15;
      drawCardM(pg, x, yTop, w, h);
      pg.drawRectangle({ x: x + pad, y: yTop - 12, width: 70, height: 2, color: MATERIAL.colors.accent, borderRadius: 2 });
      pg.drawText(label, { x: x + pad, y: yTop - 28, size: labelSize, font: helveticaBold, color: MATERIAL.colors.muted, maxWidth: w - pad * 2 });
      const safeValue = (value && value.trim()) ? value : "—";
      const lines = wrapText(safeValue, w - pad * 2, helveticaBold, valueSize, 2);
      let y = yTop - 52;
      lines.forEach((ln) => {
        pg.drawText(ln, { x: x + pad, y, size: valueSize, font: helveticaBold, color: MATERIAL.colors.text, maxWidth: w - pad * 2 });
        y -= lineH;
      });
    };

    const drawNutritionSection = (
      pg: PdfPage, x: number, yTop: number, w: number,
      chipLabel: string,
      nutricion: { proteina: string; carbohidratos: string; grasa: string; agua: string }
    ) => {
      const pad = MATERIAL.pad, h = 128;
      drawCardM(pg, x, yTop, w, h);
      const chip = drawChipM(pg, x + pad, yTop - pad + 4, chipLabel);
      const tableX = x + pad, tableW = w - pad * 2;
      const tableTop = yTop - pad - chip.h - 10, tableH = 72;
      pg.drawRectangle({ x: tableX, y: tableTop - tableH, width: tableW, height: tableH, color: MATERIAL.colors.bg, borderColor: MATERIAL.colors.border, borderWidth: 1, borderRadius: 12 });
      const cols = 4, colW = tableW / cols;
      for (let i = 1; i < cols; i++) {
        pg.drawRectangle({ x: tableX + colW * i, y: tableTop - tableH, width: 1, height: tableH, color: MATERIAL.colors.border });
      }
      pg.drawRectangle({ x: tableX, y: tableTop - 34, width: tableW, height: 1, color: MATERIAL.colors.border });
      const headers = ["Proteína (gr)", "Carbohidratos (gr)", "Grasa (gr)", "Agua"];
      const values = [nutricion.proteina || "—", nutricion.carbohidratos || "—", nutricion.grasa || "—", nutricion.agua || "—"];
      headers.forEach((t, i) => {
        pg.drawText(truncateTextG(t, colW - 20, helveticaBold, 9), { x: tableX + i * colW + 10, y: tableTop - 22, size: 9, font: helveticaBold, color: MATERIAL.colors.text, maxWidth: colW - 20 });
      });
      values.forEach((t, i) => {
        pg.drawText(truncateTextG(String(t), colW - 20, helveticaBold, 12), { x: tableX + i * colW + 10, y: tableTop - 56, size: 12, font: helveticaBold, color: MATERIAL.colors.text, maxWidth: colW - 20 });
      });
      return yTop - h - MATERIAL.gap;
    };
    const drawTableCard = (
      pg: PdfPage,
      x: number,
      yTop: number,
      w: number,
      chipLabel: string,
      headers: string[],
      rows: string[][],
      colRatios: number[]
    ) => {
      const pad = MATERIAL.pad;
      const headerH = 28;
      const chipH = 19;
      const lineH = 13;
      const cellPadV = 7;  // padding vertical dentro de cada celda
      const size = 9.5;

      const tX = x + pad;
      const tW = w - pad * 2;

      const colW = colRatios.map(r => Math.floor(tW * r));
      const usedW = colW.slice(0, -1).reduce((a, b) => a + b, 0);
      colW[colW.length - 1] = tW - usedW;

      const colX: number[] = [];
      let cx = tX;
      for (const cw of colW) { colX.push(cx); cx += cw; }

      // Pre-calcular líneas de cada fila (col 0 puede hacer wrap)
      const rowWrapped: string[][] = rows.map(r => {
        const cellText = String(r[0] ?? "");
        return wrapText(cellText || "—", colW[0] - 16, helvetica, size);
      });
      const rowHeights: number[] = rowWrapped.map(lines =>
        Math.max(28, cellPadV * 2 + lines.length * lineH)
      );
      const totalBodyH = rowHeights.reduce((a, b) => a + b, 0);
      const tableContainerH = headerH + totalBodyH;
      const h = pad + chipH + 10 + tableContainerH + pad;

      drawCardM(pg, x, yTop, w, h);
      const chip = drawChipM(pg, x + pad, yTop - pad + 4, chipLabel);
      const tTop = yTop - pad - chip.h - 10;

      // Contenedor redondeado tabla
      pg.drawRectangle({
        x: tX, y: tTop - tableContainerH, width: tW, height: tableContainerH,
        color: MATERIAL.colors.bg, borderColor: MATERIAL.colors.border, borderWidth: 1, borderRadius: 10,
      });

      // Cabecera metálica
      drawMetallicH(pg, tX, tTop - headerH, tW, headerH);
      headers.forEach((hdr, i) => {
        pg.drawText(truncateTextG(hdr, colW[i] - 16, helveticaBold, 9), {
          x: colX[i] + 8, y: tTop - headerH + 9, size: 9, font: helveticaBold,
          color: MATERIAL.colors.text, maxWidth: colW[i] - 16,
        });
      });

      // Filas de datos con altura dinámica
      let y = tTop - headerH;
      rows.forEach((r, idx) => {
        const rh = rowHeights[idx];
        if (idx % 2 === 1) pg.drawRectangle({ x: tX, y: y - rh, width: tW, height: rh, color: MATERIAL.colors.zebra });
        pg.drawRectangle({ x: tX, y: y - rh, width: tW, height: 1, color: MATERIAL.colors.border });

        // Columna 0: texto envuelto, alineado arriba-izquierda con cellPadV de margen superior
        rowWrapped[idx].forEach((ln, li) => {
          pg.drawText(ln, {
            x: colX[0] + 8,
            y: y - cellPadV - (li + 1) * lineH + 2,
            size, font: helvetica, color: MATERIAL.colors.text, maxWidth: colW[0] - 16,
          });
        });

        // Columnas 1+: texto centrado verticalmente
        const midY = y - rh / 2 - size / 2 + 1;
        for (let i = 1; i < r.length; i++) {
          const cellText = String(r[i] ?? "");
          const txt = truncateTextG(cellText || "—", colW[i] - 16, helvetica, size);
          if (/[0-9]/.test(cellText)) {
            const tw = measureText(helvetica, txt, size);
            pg.drawText(txt, { x: colX[i] + colW[i] - 8 - tw, y: midY, size, font: helvetica, color: MATERIAL.colors.text });
          } else {
            const tw = measureText(helvetica, txt, size);
            pg.drawText(txt, { x: colX[i] + (colW[i] - tw) / 2, y: midY, size, font: helvetica, color: MATERIAL.colors.text });
          }
        }

        y -= rh;
      });

      return yTop - h - MATERIAL.gap;
    };

    const drawTextBlockCard = (
      pg: PdfPage,
      x: number,
      yTop: number,
      w: number,
      chipLabel: string,
      textLines: string[]
    ) => {
      const pad = MATERIAL.pad;
      const fontSize = 10;
      const lineH = 14;
      const chipH = 19;

      const contentLines: string[] = [];
      for (const ln of textLines) {
        const wrapped = wrapText(ln, w - pad * 2 - 20, helvetica, fontSize);
        contentLines.push(...(wrapped.length ? wrapped : [" "]));
      }

      const h = Math.max(80, pad + chipH + 10 + pad + contentLines.length * lineH + pad);
      drawCardM(pg, x, yTop, w, h);
      const chip = drawChipM(pg, x + pad, yTop - pad + 4, chipLabel);

      pg.drawRectangle({
        x: x + pad, y: (yTop - h) + pad,
        width: w - pad * 2, height: h - pad * 2 - chip.h - 6,
        color: MATERIAL.colors.bg, borderRadius: 12,
      });

      let y = yTop - pad - chip.h - 18;
      for (const ln of contentLines) {
        pg.drawText(ln, { x: x + pad + 10, y, size: fontSize, font: helvetica, color: MATERIAL.colors.text, maxWidth: w - pad * 2 - 20 });
        y -= lineH;
      }

      return yTop - h - MATERIAL.gap;
    };

    // =========================
    // FIN MATERIAL HELPERS
    // =========================

    // 4. Crear la página de "Hoja de Vida del Alumno" (solo si tiene datos)
    if (hasBasicData(data) || hasPhotos(data) || hasControls(data)) {
      // Página 3: diseño Material / minimal
      const page = finalDoc.addPage([width, height]);

      // =========================
      // Tokens de diseño (Material)
      // =========================
      const MARGIN = 40;
      const GAP = 14;
      const RADIUS = 14;
      const CARD_PAD = 14;

      // Paleta (clara, minimal)
      const BG = rgb(1, 1, 1);                          // #FFFFFF
      const SURFACE = rgb(0.976, 0.98, 0.984);          // #F9FAFB
      const BORDER = rgb(0.89, 0.9, 0.91);              // #E3E5E8
      const TEXT = rgb(0.11, 0.12, 0.14);               // #1C1F24
      const MUTED = rgb(0.42, 0.45, 0.50);              // #6B7280
      const ACCENT = rgb(0.58, 0.61, 0.66);             // gris metálico claro
      const ACCENT_SOFT = rgb(0.91, 0.92, 0.93);        // gris claro
      const ZEBRA = rgb(0.985, 0.988, 0.992);           // muy suave

      const contentWidth = width - (MARGIN * 2);

      // Fondo blanco
      page.drawRectangle({ x: 0, y: 0, width, height, color: BG });

      // Helpers
      const truncateText = (text: string, maxWidth: number, font: typeof helvetica, size: number): string => {
        const str = String(text || "");
        if (font.widthOfTextAtSize(str, size) <= maxWidth) return str;
        let s = str;
        while (s.length > 0 && font.widthOfTextAtSize(s + "…", size) > maxWidth) s = s.slice(0, -1);
        return s ? s + "…" : "…";
      };

      const drawCard = (x: number, yTop: number, w: number, h: number) => {
        // sombra sutil (simulada con un rectángulo atrás, desplazado)
        page.drawRectangle({
          x: x + 2,
          y: (yTop - h) - 2,
          width: w,
          height: h,
          color: rgb(0.95, 0.955, 0.96),
          borderRadius: RADIUS,
        });

        // superficie principal
        page.drawRectangle({
          x,
          y: yTop - h,
          width: w,
          height: h,
          color: SURFACE,
          borderColor: BORDER,
          borderWidth: 1,
          borderRadius: RADIUS,
        });
      };

      const drawSmallHeader = (yTop: number) => {
        // Header minimal: acento verde + título + marca derecha
        const headerH = 44;

        // línea verde (acento)
        page.drawRectangle({
          x: MARGIN,
          y: yTop - headerH + 10,
          width: 4,
          height: headerH - 20,
          color: ACCENT,
          borderRadius: 2,
        });

        page.drawText("Hoja de vida", {
          x: MARGIN + 14,
          y: yTop - 28,
          size: 18,
          font: helveticaBold,
          color: TEXT,
        });

        // Marca (logo o texto) a la derecha, centrado verticalmente
        drawBrandBadge(page, width - MARGIN, yTop - headerH / 2, 22);

        return headerH;
      };

      const drawLabelValue = (
        x: number,
        yTop: number,
        w: number,
        label: string,
        value: string
      ) => {
        // Campo estilo Material dentro de una tarjeta: label pequeño + value
        const h = 54;

        // caja interna (blanca)
        page.drawRectangle({
          x,
          y: yTop - h,
          width: w,
          height: h,
          color: BG,
          borderColor: BORDER,
          borderWidth: 1,
          borderRadius: 12,
        });

        page.drawText(label, {
          x: x + 12,
          y: yTop - 18,
          size: 8.5,
          font: helveticaBold,
          color: MUTED,
        });

        const maxW = w - 24;
        const v = truncateText(value || "—", maxW, helvetica, 12);

        page.drawText(v, {
          x: x + 12,
          y: yTop - 38,
          size: 12,
          font: helveticaBold,
          color: TEXT,
          maxWidth: maxW,
        });

        return h;
      };

      const parseNumber = (v: string): number => {
        const s = String(v || "").replace(",", ".");
        const m = s.match(/-?\d+(\.\d+)?/);
        return m ? Number(m[0]) : NaN;
      };

      const formatDeltaKg = (d: number): string => {
        if (!Number.isFinite(d)) return "—";
        const sign = d > 0 ? "+" : d < 0 ? "-" : "0";
        const abs = Math.abs(d);
        const val = abs % 1 === 0 ? abs.toFixed(0) : abs.toFixed(1);
        if (sign === "0") return "0 kg";
        return `${sign}${val} kg`;
      };

      const formatDeltaPP = (d: number): string => {
        if (!Number.isFinite(d)) return "—";
        const sign = d > 0 ? "+" : d < 0 ? "-" : "0";
        const abs = Math.abs(d);
        const val = abs % 1 === 0 ? abs.toFixed(0) : abs.toFixed(1);
        if (sign === "0") return "0 pp";
        return `${sign}${val} pp`;
      };

      const embedImageFromDataUrl = async (dataUrl: string) => {
        const parts = dataUrl.split(",");
        if (parts.length < 2) return null;
        const header = parts[0].toLowerCase();
        const b64 = parts[1];

        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        try {
          if (header.includes("image/png")) return await finalDoc.embedPng(bytes);
          if (header.includes("image/jpeg") || header.includes("image/jpg")) return await finalDoc.embedJpg(bytes);
          return await finalDoc.embedPng(bytes);
        } catch {
          return null;
        }
      };

      const drawChip = (x: number, yTop: number, text: string) => {
        const padX = 10;
        const padY = 5;
        const size = 9;
        const tw = helveticaBold.widthOfTextAtSize(text, size);
        const w = tw + padX * 2;
        const h = size + padY * 2;

        page.drawRectangle({
          x,
          y: yTop - h,
          width: w,
          height: h,
          color: ACCENT_SOFT,
          borderRadius: 999,
        });

        page.drawText(text, {
          x: x + padX,
          y: yTop - h + padY + 1,
          size,
          font: helveticaBold,
          color: TEXT,
        });

        return { w, h };
      };

      const drawImageContain = (
        img: Awaited<ReturnType<PDFDocument["embedPng"]>> | Awaited<ReturnType<PDFDocument["embedJpg"]>>,
        x: number,
        yTop: number,
        w: number,
        h: number
      ) => {
        const iw = img.width;
        const ih = img.height;
        const scale = Math.min(w / iw, h / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        const dx = x + (w - dw) / 2;
        const dy = (yTop - h) + (h - dh) / 2;

        page.drawImage(img, { x: dx, y: dy, width: dw, height: dh });
      };

      const drawPhotoCard = async (
        x: number,
        yTop: number,
        w: number,
        h: number,
        label: "Frontal" | "Lateral" | "Posterior",
        dataUrl: string | null
      ) => {
        drawCard(x, yTop, w, h);

        // chip
        const chip = drawChip(x + CARD_PAD, yTop - CARD_PAD + 4, label);

        // área de imagen
        const imgPadTop = CARD_PAD + chip.h + 10;
        const imgPad = CARD_PAD;
        const imgX = x + imgPad;
        const imgW = w - imgPad * 2;
        const imgH = h - imgPadTop - imgPad;

        // fondo de imagen (blanco)
        page.drawRectangle({
          x: imgX,
          y: (yTop - h) + imgPad,
          width: imgW,
          height: imgH,
          color: BG,
          borderColor: BORDER,
          borderWidth: 1,
          borderRadius: 12,
        });

        if (dataUrl) {
          const embedded = await embedImageFromDataUrl(dataUrl);
          if (embedded) {
            drawImageContain(embedded, imgX, yTop - imgPadTop + 4, imgW, imgH);
            return;
          }
        }

        // placeholder si no hay imagen o si falla
        const ph = "Sin imagen";
        const size = 10;
        const tw = helvetica.widthOfTextAtSize(ph, size);
        page.drawText(ph, {
          x: imgX + (imgW - tw) / 2,
          y: (yTop - h) + imgPad + (imgH / 2) - 5,
          size,
          font: helvetica,
          color: MUTED,
        });
      };

      const drawSectionTitle = (text: string, x: number, yTop: number) => {
        page.drawText(text, { x, y: yTop - 14, size: 12.5, font: helveticaBold, color: TEXT });
        page.drawRectangle({ x, y: yTop - 22, width: 160, height: 2, color: ACCENT, borderRadius: 2 });
        return 28;
      };

      const drawTable = (
        x: number,
        yTop: number,
        w: number,
        rows: Array<{ fecha: string; control: string; peso: string; musculo: string; grasa: string }>,
        diffRow: { fecha: string; control: string; peso: string; musculo: string; grasa: string }
      ) => {
        const headerH = 28;
        const rowH = 26;
        const totalRows = rows.length + 1;
        const h = headerH + (totalRows * rowH) + 18;

        drawCard(x, yTop, w, h);

        const innerX = x + CARD_PAD;
        const innerW = w - CARD_PAD * 2;
        let y = yTop - CARD_PAD;

        const colW = {
          fecha: Math.round(innerW * 0.24),
          control: Math.round(innerW * 0.14),
          peso: Math.round(innerW * 0.20),
          musculo: Math.round(innerW * 0.21),
          grasa: innerW - (Math.round(innerW * 0.24) + Math.round(innerW * 0.14) + Math.round(innerW * 0.20) + Math.round(innerW * 0.21)),
        };

        const colX = {
          fecha: innerX,
          control: innerX + colW.fecha,
          peso: innerX + colW.fecha + colW.control,
          musculo: innerX + colW.fecha + colW.control + colW.peso,
          grasa: innerX + colW.fecha + colW.control + colW.peso + colW.musculo,
        };

        // Header fondo
        page.drawRectangle({
          x: innerX,
          y: y - headerH,
          width: innerW,
          height: headerH,
          color: rgb(0.94, 0.945, 0.95),
          borderColor: BORDER,
          borderWidth: 1,
          borderRadius: 10,
        });

        const headerY = y - 18;
        const headerSize = 10;
        const drawHeaderText = (t: string, cx: number) => {
          page.drawText(t, { x: cx + 10, y: headerY, size: headerSize, font: helveticaBold, color: MUTED });
        };

        drawHeaderText("FECHA", colX.fecha);
        drawHeaderText("CONTROL", colX.control);
        drawHeaderText("PESO", colX.peso);
        drawHeaderText("MÚSCULO", colX.musculo);
        drawHeaderText("GRASA", colX.grasa);

        y -= headerH;

        const drawCellTextLeft = (t: string, cx: number, cy: number, maxW: number) => {
          const s = 9.8;
          const txt = truncateText(t || "—", maxW, helvetica, s);
          page.drawText(txt, { x: cx + 10, y: cy, size: s, font: helvetica, color: TEXT, maxWidth: maxW });
        };

        const drawCellTextRight = (t: string, cx: number, cy: number, cellW: number) => {
          const s = 9.8;
          const txt = String(t || "—");
          const tw = helvetica.widthOfTextAtSize(txt, s);
          const xRight = cx + cellW - 10;
          page.drawText(txt, { x: xRight - tw, y: cy, size: s, font: helvetica, color: TEXT });
        };

        const bodyRows = [...rows, diffRow];

        bodyRows.forEach((r, i) => {
          const isDiff = i === bodyRows.length - 1;
          const rowColor = isDiff ? ACCENT_SOFT : (i % 2 === 0 ? BG : ZEBRA);

          page.drawRectangle({
            x: innerX,
            y: y - rowH,
            width: innerW,
            height: rowH,
            color: rowColor,
            borderColor: BORDER,
            borderWidth: 0.75,
            borderRadius: 0,
          });

          const textY = y - rowH + 8;

          drawCellTextLeft(r.fecha, colX.fecha, textY, colW.fecha - 20);

          const cSize = 9.8;
          const cTxt = String(r.control || "—");
          const cTw = helvetica.widthOfTextAtSize(cTxt, cSize);
          page.drawText(cTxt, {
            x: colX.control + (colW.control - cTw) / 2,
            y: textY,
            size: cSize,
            font: isDiff ? helveticaBold : helvetica,
            color: TEXT,
          });

          drawCellTextRight(r.peso, colX.peso, textY, colW.peso);
          drawCellTextRight(r.musculo, colX.musculo, textY, colW.musculo);
          drawCellTextRight(r.grasa, colX.grasa, textY, colW.grasa);

          y -= rowH;
        });

        return h;
      };

      // =========================
      // Layout de la página
      // =========================
      let y = height - 42;

      // Header minimal
      y -= drawSmallHeader(y);
      y -= 18;

      // Bloque superior: Nombre + Edad (en una tarjeta)
      const infoCardH = 92;
      drawCard(MARGIN, y, contentWidth, infoCardH);

      const innerX = MARGIN + CARD_PAD;
      const innerW = contentWidth - (CARD_PAD * 2);
      const fieldGap = 12;

      const nameW = Math.round(innerW * 0.74) - Math.round(fieldGap / 2);
      const ageW = innerW - nameW - fieldGap;

      const fieldTop = y - 18;
      drawLabelValue(innerX, fieldTop, nameW, "Nombre completo", data.nombreCompleto || "—");
      drawLabelValue(innerX + nameW + fieldGap, fieldTop, ageW, "Edad", data.edad || "—");

      y -= infoCardH + 18;

      // Fotos (3 cards en fila)
      const photoH = 190;
      const photoW = Math.floor((contentWidth - (GAP * 2)) / 3);

      await drawPhotoCard(MARGIN, y, photoW, photoH, "Frontal", data.fotoFrontal);
      await drawPhotoCard(MARGIN + photoW + GAP, y, photoW, photoH, "Lateral", data.fotoLateral);
      await drawPhotoCard(MARGIN + (photoW + GAP) * 2, y, photoW, photoH, "Posterior", data.fotoPosterior);

      y -= photoH + 22;

      // Título sección
      y -= drawSectionTitle("DIFERENCIAS ENTRE: PESO, MÚSCULO Y GRASA", MARGIN, y);
      y -= 6;

      // Tabla de controles
      const controles = (data.controles || []).filter(c => (c.fecha || c.peso || c.musculo || c.grasa));
      const rows = controles.map(c => ({
        fecha: c.fecha || "—",
        control: String(c.control ?? "—"),
        peso: c.peso ? (c.peso.toLowerCase().includes("kg") ? c.peso : `${c.peso} kg`) : "—",
        musculo: c.musculo ? (c.musculo.includes("%") ? c.musculo : `${c.musculo}%`) : "—",
        grasa: c.grasa ? (c.grasa.includes("%") ? c.grasa : `${c.grasa}%`) : "—",
      }));

      let diffPeso = NaN;
      let diffMus = NaN;
      let diffGra = NaN;

      const first = controles[0];
      const last = controles[controles.length - 1];

      if (first && last && controles.length >= 2) {
        const p1 = parseNumber(first.peso);
        const p2 = parseNumber(last.peso);
        const m1 = parseNumber(first.musculo);
        const m2 = parseNumber(last.musculo);
        const g1 = parseNumber(first.grasa);
        const g2 = parseNumber(last.grasa);

        diffPeso = (Number.isFinite(p1) && Number.isFinite(p2)) ? (p2 - p1) : NaN;
        diffMus = (Number.isFinite(m1) && Number.isFinite(m2)) ? (m2 - m1) : NaN;
        diffGra = (Number.isFinite(g1) && Number.isFinite(g2)) ? (g2 - g1) : NaN;
      }

      const diffRow = {
        fecha: "DIFERENCIA",
        control: "—",
        peso: formatDeltaKg(diffPeso),
        musculo: formatDeltaPP(diffMus),
        grasa: formatDeltaPP(diffGra),
      };

      const tableH = drawTable(MARGIN, y, contentWidth, rows, diffRow);
      y -= tableH + 10;

      // Footer
      page.drawText("Generado el " + new Date().toLocaleDateString("es"), {
        x: MARGIN,
        y: 28,
        size: 8.5,
        font: helvetica,
        color: MUTED,
      });
    } // Fin de página 3 (Hoja de Vida)
    
    // === PÁGINA 4: METODOLOGÍA DEL ENTRENAMIENTO (Material/Minimal) ===
    if (hasMetodologia(data)) {
      const titleLines4 = ["Metodología del entrenamiento", "y periodización"];
      let state4 = startMaterialPage(titleLines4);
      const intro4 =
        "Para cada periodo del programa en 90 días se deben realizar algunos cambios en el método, la técnica, la ejecución, los ángulos. " +
        "A continuación el método de acuerdo al objetivo y al programa.";
      state4.y = drawIntroCard(state4.page, MATERIAL.margin, state4.y, width - MATERIAL.margin * 2, intro4);
      const campos4 = [
        { label: "Metodología", value: data.metodologia.metodologia },
        { label: "Velocidad de la contracción", value: data.metodologia.velocidadContraccion },
        { label: "Objetivo", value: data.metodologia.objetivo },
        { label: "Flexibilidad", value: data.metodologia.flexibilidad },
        { label: "Metodología de intensidad", value: data.metodologia.metodologiaIntensidad },
        { label: "Frecuencia en la semana", value: data.metodologia.frecuenciaSemana },
        { label: "Duración del microciclo", value: data.metodologia.duracionMicrociclo },
        { label: "Tiempo de recuperación", value: data.metodologia.tiempoRecuperacion },
        { label: "Duración del programa", value: data.metodologia.duracionPrograma },
        { label: "Trabajo cardiovascular", value: data.metodologia.trabajoCardiovascular },
        { label: "Tipo de fuerza", value: data.metodologia.tipoFuerza },
      ];
      for (const c of campos4) {
        state4 = ensureSpace(state4, 74, titleLines4);
        state4.y = drawKeyValueCard(state4.page, MATERIAL.margin, state4.y, width - MATERIAL.margin * 2, c.label, c.value || "—");
      }
      drawFooterM(state4.page);
    } // Fin de página 4 (Metodología del Entrenamiento)
    
    // ==================== PÁGINA 5: METODOLOGÍA DE LA ALIMENTACIÓN (Material/Minimal) ====================
    if (hasAlimentacion(data)) {
      const titleLines5 = ["Metodología de la", "alimentación"];
      let state5 = startMaterialPage(titleLines5);
      const intro5 =
        "La nutrición siempre en nuestro programa va ligada al tipo de entreno y las actividades cotidianas, por ello tenemos modelos de ingesta de los nutrientes para aprovecharlos en nuestro objetivo y así llevar una alimentación sana, logrando objetivos básicos de desarrollar masa, tonificar y perder grasa corporal.";
      state5.y = drawIntroCard(state5.page, MATERIAL.margin, state5.y, width - MATERIAL.margin * 2, intro5);
      const cards5: { label: string; value: string }[] = [
        { label: "Modelo de los carbohidratos", value: data.alimentacion.modeloCarbohidratos || "—" },
        { label: "Modelo de las proteínas", value: data.alimentacion.modeloProteinas || "—" },
        { label: "Modelo de las grasas", value: data.alimentacion.modeloGrasas || "—" },
        { label: "Modelo de las vitaminas y minerales", value: data.alimentacion.modeloVitaminasMinerales || "—" },
        { label: "Modelo del agua", value: data.alimentacion.modeloAgua || "—" },
        { label: "Modelo del sodio", value: data.alimentacion.modeloSodio || "—" },
      ];
      const contentW5 = width - MATERIAL.margin * 2;
      const gap5 = MATERIAL.gap;
      const colW5 = Math.floor((contentW5 - gap5) / 2);
      const cardH5 = 96;
      let y5 = state5.y;
      for (let row = 0; row < 3; row++) {
        state5 = ensureSpace({ page: state5.page, y: y5 }, cardH5 + 20, titleLines5);
        y5 = state5.y;
        drawGridCard(state5.page, MATERIAL.margin, y5, colW5, cardH5, cards5[row * 2].label, cards5[row * 2].value);
        drawGridCard(state5.page, MATERIAL.margin + colW5 + gap5, y5, colW5, cardH5, cards5[row * 2 + 1].label, cards5[row * 2 + 1].value);
        y5 -= cardH5 + gap5;
        state5.y = y5;
      }
      drawFooterM(state5.page);
    } // Fin de página 5 (Metodología de la Alimentación)
    
    // ==================== PÁGINA 6: NUTRICIÓN PARA DÍAS DE ENTRENOS (Material/Minimal) ====================
    if (hasNutricionDias(data)) {
      const titleLines6 = ["Nutrición para días", "de entrenos"];
      let state6 = startMaterialPage(titleLines6);
      const contentW6 = width - MATERIAL.margin * 2;
      const sections6: Array<{ chip: string; dia: { proteina: string; carbohidratos: string; grasa: string; agua: string } }> = [
        { chip: "Días fuertes", dia: data.nutricionDias.entrenosFuertes },
        { chip: "Días medios", dia: data.nutricionDias.entrenosMedios },
        { chip: "Solo cardio", dia: data.nutricionDias.soloCardio },
        { chip: "Descanso", dia: data.nutricionDias.descanso },
      ];
      for (const s of sections6) {
        if (!hasNutricionDia(s.dia)) continue;
        state6 = ensureSpace(state6, 150, titleLines6);
        state6.y = drawNutritionSection(state6.page, MATERIAL.margin, state6.y, contentW6, s.chip, s.dia);
      }
      drawFooterM(state6.page);
    } // Fin de página 6 (Nutrición para Días de Entrenos)
    
    // ==================== PLAN DE ENTRENAMIENTO (Material/Minimal) ====================
    if (hasPlanEntrenamiento(data)) {
      const titleLinesPE = ["Plan de", "entrenamiento"];
      let statePE = startMaterialPage(titleLinesPE);
      const contentWPE = width - MATERIAL.margin * 2;

      for (const dia of (data.planEntrenamiento.dias || [])) {
        if (!dia.titulo && dia.ejercicios.length === 0) continue;

        const rows = (dia.ejercicios || [])
          .filter((e) => e.nombre || e.series || e.repeticiones)
          .map((e, idx) => [
            `${idx + 1}. ${(e.nombre || "").trim() || "—"}`,
            String(e.series ?? "—"),
            String(e.repeticiones ?? "—"),
          ]);

        const chipH = 19, headerH = 28, rowH = 24, pad = MATERIAL.pad;
        const needed = pad + chipH + 10 + headerH + rows.length * rowH + pad + MATERIAL.gap;
        statePE = ensureSpace(statePE, needed, titleLinesPE);

        statePE.y = drawTableCard(
          statePE.page,
          MATERIAL.margin,
          statePE.y,
          contentWPE,
          dia.titulo ? `DÍAS: ${dia.titulo}` : "DÍAS",
          ["Ejercicios / principio de entrenamiento y metodología", "Series", "Repeticiones"],
          rows,
          [0.64, 0.18, 0.18]
        );
      }
      drawFooterM(statePE.page);
    } // Fin de páginas del Plan de Entrenamiento
    
    // ==================== PLAN NUTRICIONAL (Material/Minimal) ====================
    if (hasPlanNutricional(data)) {
      const titleLinesPN = ["Plan", "nutricional"];
      let statePN = startMaterialPage(titleLinesPN);
      const contentWPN = width - MATERIAL.margin * 2;
      const gapPN = MATERIAL.gap;

      for (const dia of (data.planNutricional.dias || [])) {
        if (!dia.titulo && dia.comidas.length === 0) continue;

        // Chip de día (card corto)
        statePN = ensureSpace(statePN, 54, titleLinesPN);
        const diaChipH = 44;
        drawCardM(statePN.page, MATERIAL.margin, statePN.y, contentWPN, diaChipH);
        drawChipM(statePN.page, MATERIAL.margin + MATERIAL.pad, statePN.y - MATERIAL.pad + 4, dia.titulo ? `DÍAS: ${dia.titulo}` : "DÍAS");
        statePN.y -= diaChipH + gapPN;

        for (const comida of (dia.comidas || [])) {
          if (!comida.nombre && comida.alimentos.length === 0 && !comida.merienda) continue;

          const alimentoRows = (comida.alimentos || [])
            .filter((a) => a.nombre || a.cantidad)
            .map((a) => [a.nombre || "—", a.cantidad || "—"]);

          const hasMerienda = !!comida.merienda;
          const colWPN = hasMerienda ? Math.floor((contentWPN - gapPN) / 2) : contentWPN;

          // Estimar altura para ensureSpace
          const chipH = 19, headerH = 28, rowH = 24, pad = MATERIAL.pad;
          const leftH = pad + chipH + 10 + headerH + Math.max(1, alimentoRows.length) * rowH + pad;
          const meriendaLines = hasMerienda ? wrapText(comida.merienda, colWPN - pad * 2 - 20, helvetica, 10) : [];
          const rightH = hasMerienda ? Math.max(80, pad + chipH + 10 + pad + meriendaLines.length * 14 + pad) : 0;
          const neededH = Math.max(leftH, rightH);

          statePN = ensureSpace(statePN, neededH, titleLinesPN);
          const rowTopY = statePN.y;

          const yLeft = drawTableCard(
            statePN.page, MATERIAL.margin, rowTopY, colWPN,
            comida.nombre || "Comida",
            ["Alimento", "Cantidad"],
            alimentoRows.length ? alimentoRows : [["—", "—"]],
            [0.70, 0.30]
          );

          let yRight = rowTopY;
          if (hasMerienda) {
            yRight = drawTextBlockCard(
              statePN.page, MATERIAL.margin + colWPN + gapPN, rowTopY, colWPN,
              "Merienda",
              [comida.merienda]
            );
          }

          statePN.y = Math.min(yLeft, yRight);
        }
      }
      drawFooterM(statePN.page);
    } // Fin de páginas del Plan Nutricional
    
    // ==================== SUPLEMENTACIÓN Y AYUDAS (Material/Minimal) ====================
    if (hasSuplemementacion(data)) {
      const titleLinesSup = ["Suplementación", "y ayudas"];
      let stateSup = startMaterialPage(titleLinesSup);
      const contentWSup = width - MATERIAL.margin * 2;

      // Suplementación items
      const supItems = (data.suplementacion.items || []).filter((s: string) => s.trim());
      if (supItems.length > 0) {
        stateSup = ensureSpace(stateSup, 200, titleLinesSup);
        stateSup.y = drawTextBlockCard(stateSup.page, MATERIAL.margin, stateSup.y, contentWSup, "Suplementación", supItems);
      }

      // Ayudas
      if (data.ayudasErgogenicas.descripcion) {
        stateSup = ensureSpace(stateSup, 160, titleLinesSup);
        stateSup.y = drawTextBlockCard(stateSup.page, MATERIAL.margin, stateSup.y, contentWSup, "Ayudas", [data.ayudasErgogenicas.descripcion]);
      }

      drawFooterM(stateSup.page);
    } // Fin de página Suplementación
    
    // Guardar PDF
    const pdfBytes = await finalDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hoja-vida-${data.nombreCompleto.replace(/\s+/g, '-').toLowerCase()}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error al generar el PDF. Por favor, intenta nuevamente.');
  }
};
