import { ApiResponse } from '../alertas.interface';
import {
  CoordenadaZona,
  RiesgoZona,
  ZonaData,
} from './zona.model';

export interface UpdateZonaRequest {
  nombre: string;
  descripcion: string | null;
  coordenadas: CoordenadaZona[];
  riesgo: RiesgoZona;
}

export type UpdateZonaResponse = ApiResponse<ZonaData>;
