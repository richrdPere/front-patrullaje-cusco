import { ApiResponse } from "../alertas.interface";

// Opción del selector de policías
export interface PoliciaSelectItem {
  value: number;
  label: string;
  dni: string;
  grado: string;
  comisaria: string;
  codigo_institucional: string;
  descripcion: string;
}

// Data del selector
export interface PoliciasSelectData {
  total: number;
  items: PoliciaSelectItem[];
}

// Response del endpoint
export type PoliciasSelectResponse =
  ApiResponse<PoliciasSelectData>;
