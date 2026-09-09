// ============================================================
// TIPOS
// ============================================================

import { ApiResponse } from "../alertas.interface";

export type TipoPatrullaje =
  | 'A_PIE'
  | 'MOTORIZADO'
  | 'OTRO';

export type ModalidadPatrullaje =
  | 'MUNICIPAL'
  | 'INTEGRADO';

export type EstadoPatrullaje =
  | 'PROGRAMADO'
  | 'ASIGNADO'
  | 'ACEPTADO'
  | 'EN_CURSO'
  | 'FINALIZADO';

// ============================================================
// REQUEST
// ============================================================

export interface CreatePatrullajeProgramadoRequest {
  /*
   * Puede ser null para patrullajes a pie.
   */
  unidad_id: number | null;

  zona_id: number;

  tipo_patrullaje: TipoPatrullaje;

  modalidad_patrullaje:
  ModalidadPatrullaje;

  detalle_tipo_patrullaje:
  string | null;

  /*
   * Formato esperado: YYYY-MM-DD
   */
  fecha: string;

  /*
   * Formato esperado: HH:mm:ss
   */
  hora_inicio: string;

  hora_fin: string;

  descripcion: string | null;

  /*
   * IDs correspondientes a Usuario.id
   */
  serenos: number[];

  /*
   * IDs correspondientes a Policia.id
   */
  policias: number[];
}

// ============================================================
// COORDENADA
// ============================================================

export interface PatrullajeCoordenadaData {
  lat: number;
  lng: number;
}

// ============================================================
// ZONA
// ============================================================

export interface CreatePatrullajeZonaData {
  nombre: string;
  descripcion: string | null;
  riesgo: string | null;
  coordenadas:  PatrullajeCoordenadaData[];
}

// ============================================================
// UNIDAD
// ============================================================

export type EstadoUnidadPatrullaje =
  | 'DISPONIBLE'
  | 'EN_PATRULLAJE'
  | 'MANTENIMIENTO'
  | 'FUERA_DE_SERVICIO';

export interface CreatePatrullajeUnidadData {
  id: number;
  codigo: string;
  tipo: string;
  placa: string | null;
  estado: EstadoUnidadPatrullaje;
}

// ============================================================
// DATA
// ============================================================
export interface CreatePatrullajeProgramadoData {
  id: number;
  unidad_id: number | null;
  zona_id: number;
  tipo_patrullaje: TipoPatrullaje;
  modalidad_patrullaje: ModalidadPatrullaje;
  detalle_tipo_patrullaje: string | null;
  estado: EstadoPatrullaje;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  descripcion: string | null;
  zona: CreatePatrullajeZonaData;
  unidad: CreatePatrullajeUnidadData | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// RESPONSE
// ============================================================
export type CreatePatrullajeProgramadoResponse = ApiResponse<CreatePatrullajeProgramadoData>;
