import { ApiResponse } from '../alertas.interface';
import {
  EstadoPatrullaje,
  EstadoUnidadPatrullaje,
  ModalidadPatrullaje,
  TipoPatrullaje,
} from './create-patrullaje-programado.model';

// ============================================================
// ESTADO DE ASIGNACIÓN
// ============================================================

export type EstadoAsignacionPatrullaje =
  | 'ASIGNADO'
  | 'ACEPTADO'
  | 'RECHAZADO'
  | 'EN_SERVICIO'
  | 'FINALIZADO';

// ============================================================
// FILTROS
// ============================================================

export interface GetPatrullajesPaginatedParams {
  page?: number;
  limit?: number;
  fecha?: string;
  descripcion?: string;
  estado?: EstadoPatrullaje;
  tipo_patrullaje?: TipoPatrullaje;
  modalidad_patrullaje?: ModalidadPatrullaje;
  zona_id?: number;
  unidad_id?: number;
}

// ============================================================
// UNIDAD
// ============================================================

export interface PatrullajePaginatedUnidadData {
  id: number;
  codigo: string;
  tipo: string;
  placa: string | null;
  estado: EstadoUnidadPatrullaje;
}

// ============================================================
// ZONA
// ============================================================

export interface PatrullajePaginatedZonaData {
  id: number;

  nombre: string;

  descripcion: string | null;

  riesgo: string | null;
}

// ============================================================
// SERENO
// ============================================================

export interface PatrullajePaginatedSerenoData {
  asignacion_id: number;

  usuario_id: number;

  nombres: string;

  apellidos: string;

  roles: string[];

  estado_asignacion:
  EstadoAsignacionPatrullaje;

  fecha_asignacion: string;
}

// ============================================================
// POLICÍA
// ============================================================

export interface PatrullajePaginatedPoliciaData {
  asignacion_id: number;

  policia_id: number;

  nombres: string;

  apellidos: string;

  grado: string | null;

  comisaria: string | null;

  estado_asignacion:
  EstadoAsignacionPatrullaje;

  fecha_asignacion: string;
}

// ============================================================
// ITEM DE PATRULLAJE
// ============================================================

export interface PatrullajePaginatedItemData {
  id: number;

  /*
   * Es null en patrullajes que no utilizan unidad.
   */
  unidad_id: number | null;

  zona_id: number;

  tipo_patrullaje:
  TipoPatrullaje;

  modalidad_patrullaje:
  ModalidadPatrullaje;

  detalle_tipo_patrullaje:
  string | null;

  creado_por_usuario_id:
  number | null;

  fecha: string;

  hora_inicio: string;

  hora_fin: string;

  descripcion: string | null;

  estado:
  EstadoPatrullaje;

  unidad:
  PatrullajePaginatedUnidadData | null;

  zona:
  PatrullajePaginatedZonaData | null;

  serenos:
  PatrullajePaginatedSerenoData[];

  policias:
  PatrullajePaginatedPoliciaData[];

  createdAt: string;

  updatedAt: string;
}

// ============================================================
// DATA PAGINADA
// ============================================================

export interface GetPatrullajesPaginatedData {
  total: number;

  page: number;

  limit: number;

  totalPages: number;

  items: PatrullajePaginatedItemData[];
}

// ============================================================
// RESPONSE
// ============================================================
export type GetPatrullajesPaginatedResponse = ApiResponse<GetPatrullajesPaginatedData>;


