import { ApiResponse } from '../alertas.interface';

// ==========================================================
// QUERY PARAMS
// ==========================================================

export interface PersonalDisponibilidadQueryParams {
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  patrullaje_excluir_id?: number;
}

// ==========================================================
// TIPOS
// ==========================================================

export type TipoPersonalDisponible =
  | 'SERENO'
  | 'POLICIA';

export type EstadoOperativoPersonal =
  | 'DISPONIBLE'
  | 'ASIGNADO'
  | 'ACEPTADO'
  | 'EN_SERVICIO';

export type EstadoAsignacionPersonal =
  | 'ASIGNADO'
  | 'ACEPTADO'
  | 'EN_SERVICIO';

export type EstadoPatrullajeConflicto =
  | 'PROGRAMADO'
  | 'ASIGNADO'
  | 'ACEPTADO'
  | 'EN_CURSO';

// ==========================================================
// CONFLICTO DE HORARIO
// ==========================================================

export interface PersonalConflictoData {
  patrullaje_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;

  estado_patrullaje:
  EstadoPatrullajeConflicto;

  estado_asignacion:
  EstadoAsignacionPersonal;
}

// ==========================================================
// SERENO
// ==========================================================

export interface SerenoDisponibilidadData {
  value: number;
  label: string;
  tipo_personal: 'SERENO';

  username: string | null;
  correo: string | null;

  nombres: string;
  apellidos: string;

  documento_identidad: string | null;
  foto_perfil: string | null;

  disponible: boolean;

  estado_operativo:
  EstadoOperativoPersonal;

  conflicto:
  PersonalConflictoData | null;
}

// ==========================================================
// POLICÍA
// ==========================================================

export interface PoliciaDisponibilidadData {
  value: number;
  label: string;
  tipo_personal: 'POLICIA';

  nombres: string;
  apellidos: string;

  documento_identidad: string | null;
  cip: string | null;
  foto_perfil: string | null;

  disponible: boolean;

  estado_operativo:
  EstadoOperativoPersonal;

  conflicto:
  PersonalConflictoData | null;
}

// ==========================================================
// ITEM GENÉRICO
// ==========================================================

export type PersonalDisponibilidadItem =
  | SerenoDisponibilidadData
  | PoliciaDisponibilidadData;

// ==========================================================
// DATA
// ==========================================================

export interface PersonalDisponibilidadData {
  fecha: string;
  hora_inicio: string;
  hora_fin: string;

  patrullaje_excluir_id: number | null;

  total_serenos: number;
  total_policias: number;

  serenos_disponibles: number;
  policias_disponibles: number;

  serenos: SerenoDisponibilidadData[];
  policias: PoliciaDisponibilidadData[];
}

// ==========================================================
// RESPONSE
// ==========================================================

export type PersonalDisponibilidadResponse = ApiResponse<PersonalDisponibilidadData>;
