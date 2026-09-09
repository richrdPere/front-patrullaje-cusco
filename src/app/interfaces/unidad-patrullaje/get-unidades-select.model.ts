import { ApiResponse } from '../alertas.interface';
import { EstadoUnidadPatrullaje } from './get-unidades-paginated.model';

export interface UnidadPatrullajeSelectItem {
  value: number;
  label: string;
  codigo: string;
  tipo: string;
  placa: string | null;
  estado: EstadoUnidadPatrullaje;
  descripcion: string | null;
  disponible: boolean;
}

export interface GetUnidadesSelectData {
  total: number;
  items: UnidadPatrullajeSelectItem[];
}

export type GetUnidadesSelectResponse = ApiResponse<GetUnidadesSelectData>;


