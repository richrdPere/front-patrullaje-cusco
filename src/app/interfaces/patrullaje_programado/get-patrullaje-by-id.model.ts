import { ApiResponse } from '../alertas.interface';
import {
  EstadoPatrullaje,
  EstadoUnidadPatrullaje,
  ModalidadPatrullaje,
  TipoPatrullaje,
} from './create-patrullaje-programado.model';

import {
  EstadoAsignacionPatrullaje,
} from './get-patrullajes-paginated.model';

// ============================================================
// ESTADO DEL POLICÍA
// ============================================================
export type EstadoPolicia =
  | 'ACTIVO'
  | 'INACTIVO';

// ============================================================
// COORDENADA
// ============================================================

export interface PatrullajeByIdCoordenadaData {
  lat: number;

  lng: number;
}

// ============================================================
// UNIDAD
// ============================================================

export interface PatrullajeByIdUnidadData {
  id: number;
  codigo: string;
  tipo: string;
  placa: string | null;
  estado: EstadoUnidadPatrullaje;
  descripcion: string | null;
}

// ============================================================
// ZONA
// ============================================================

export interface PatrullajeByIdZonaData {
  id: number;
  nombre: string;
  descripcion: string | null;
  riesgo: string | null;
  coordenadas: PatrullajeByIdCoordenadaData[];
}

// ============================================================
// SERENO
// ============================================================

export interface PatrullajeByIdSerenoData {
  asignacion_id: number;
  usuario_id: number;
  nombres: string;
  apellidos: string;
  documento_identidad: string;
  telefono: string | null;
  roles: string[];
  estado_asignacion: EstadoAsignacionPatrullaje;
  fecha_asignacion: string;
}

// ============================================================
// POLICÍA
// ============================================================

export interface PatrullajeByIdPoliciaData {
  asignacion_id: number;
  policia_id: number;
  nombres: string;
  apellidos: string;
  documento_identidad: string;
  telefono: string | null;
  grado: string | null;
  comisaria: string | null;
  codigo_institucional:  string | null;
  estado_policia:  EstadoPolicia;
  estado_asignacion:  EstadoAsignacionPatrullaje;
  fecha_asignacion: string;
}

// ============================================================
// DATA DEL PATRULLAJE
// ============================================================

export interface PatrullajeByIdData {
  id: number;
  unidad_id: number | null;
  zona_id: number;
  tipo_patrullaje: TipoPatrullaje;
  modalidad_patrullaje: ModalidadPatrullaje;
  detalle_tipo_patrullaje: string | null;
  creado_por_usuario_id: number | null;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  descripcion: string | null;
  estado: EstadoPatrullaje;
  unidad: PatrullajeByIdUnidadData | null;
  zona: PatrullajeByIdZonaData | null;
  serenos: PatrullajeByIdSerenoData[];
  policias: PatrullajeByIdPoliciaData[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// RESPONSE
// ============================================================
export type GetPatrullajeByIdResponse = ApiResponse<PatrullajeByIdData>;




