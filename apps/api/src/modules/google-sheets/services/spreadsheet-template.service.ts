export const COURSE_SHEET_TEMPLATE_VERSION = 1;

export interface SheetTemplate {
  sheets: Array<{
    title: string;
    index: number;
    headers: string[][];
  }>;
}

export const sheetTemplate: SheetTemplate = {
  sheets: [
    { title: 'Asistencia', index: 0, headers: [] },
    { title: 'Clases - Bitácora', index: 1, headers: [
      ['Parcial', 'Fecha', 'Clase', 'Tema', 'Bitácora', 'Actividades', 'Observaciones', 'Cerrada el'],
    ]},
    { title: 'Detalle', index: 2, headers: [] },
    { title: 'Resumen', index: 3, headers: [
      ['Estudiante', 'P1 Firmas', 'P1 Promedio', 'P2 Firmas', 'P2 Promedio', 'P3 Firmas', 'P3 Promedio'],
    ]},
  ],
};

export const HEADER_BG = { red: 0.14, green: 0.36, blue: 0.67 };
export const HEADER_FG = { red: 1, green: 1, blue: 1 };

export function tabNames(): string[] {
  return sheetTemplate.sheets.map((s) => s.title);
}
