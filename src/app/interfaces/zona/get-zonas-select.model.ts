import { ApiResponse } from '../alertas.interface';
import { RiesgoZona } from './zona.model';

export interface GetZonasSelectParams {
  search?: string;
  riesgo?: RiesgoZona;
}

export interface ZonaSelectItem {
  value: number;
  label: string;
  nombre: string;
  descripcion: string | null;
  riesgo: RiesgoZona;
  riesgo_label: string;
  estado: boolean;
}

export interface GetZonasSelectData {
  total: number;
  items: ZonaSelectItem[];
}

export type GetZonasSelectResponse = ApiResponse<GetZonasSelectData>;
