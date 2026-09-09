import { ApiResponse } from '../alertas.interface';
import {
  RiesgoZona
} from './zona.model';

export interface GetZonasPaginatedParams {
  page?: number;
  limit?: number;
  search?: string;
  nombre?: string;
  descripcion?: string;
  riesgo?: RiesgoZona;
  estado?: boolean | 'todos';
}

export interface ZonaPaginatedItem {
  id: number;
  nombre: string;
  descripcion: string | null;
  riesgo: RiesgoZona;
  estado: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetZonasPaginatedData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  items: ZonaPaginatedItem[];
}

export type GetZonasPaginatedResponse = ApiResponse<GetZonasPaginatedData>;
