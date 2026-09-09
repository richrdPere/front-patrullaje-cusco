import { ApiResponse } from '../alertas.interface';
import {
  CoordenadaZona,
  RiesgoZona,
  ZonaData,
} from './zona.model';

export interface CreateZonaRequest {
  nombre: string;
  descripcion?: string | null;
  coordenadas: CoordenadaZona[];
  riesgo?: RiesgoZona;
}

export type CreateZonaResponse = ApiResponse<ZonaData>;
