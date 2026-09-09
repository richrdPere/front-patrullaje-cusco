import { ApiResponse } from '../alertas.interface';
import {
  EstadoPatrullaje,
  EstadoUnidadPatrullaje,
  ModalidadPatrullaje,
  TipoPatrullaje,
} from './create-patrullaje-programado.model';

// ============================================================
// FILTROS
// ============================================================

export interface GetPatrullajesAllParams {
  fecha?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  estado?: EstadoPatrullaje;
  zona_id?: number;
  unidad_id?: number;
}

// ============================================================
// UNIDAD
// ============================================================

export interface PatrullajeAllUnidadData {
  id: number;
  codigo: string;
  tipo: string;
  placa: string | null;
  estado: EstadoUnidadPatrullaje;
}

// ============================================================
// ZONA
// ============================================================

export interface PatrullajeAllZonaData {
  id: number;
  nombre: string;
  riesgo: string | null;
}

// ============================================================
// ITEM
// ============================================================

export interface PatrullajeAllItemData {
  id: number;
  unidad_id: number | null;
  zona_id: number;
  tipo_patrullaje: TipoPatrullaje;
  modalidad_patrullaje: ModalidadPatrullaje;
  detalle_tipo_patrullaje: string | null;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: EstadoPatrullaje;
  descripcion: string | null;
  unidad: PatrullajeAllUnidadData | null;
  zona: PatrullajeAllZonaData | null;
}

// ============================================================
// DATA
// ============================================================

export interface GetPatrullajesAllData {
  total: number;
  items: PatrullajeAllItemData[];
}

// ============================================================
// RESPONSE
// ============================================================
export type GetPatrullajesAllResponse = ApiResponse<GetPatrullajesAllData>;


