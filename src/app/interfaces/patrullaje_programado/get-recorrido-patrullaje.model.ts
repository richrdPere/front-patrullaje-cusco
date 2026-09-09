import { ApiResponse } from '../alertas.interface';
import {
  EstadoPatrullaje,
} from './create-patrullaje-programado.model';

// ============================================================
// TIPO DE PUNTO GPS
// ============================================================

export type TipoPuntoPatrullaje =
  | 'TRACKING'
  | 'EMERGENCIA'
  | 'MANUAL';

// ============================================================
// INFORMACIÓN DEL PATRULLAJE
// ============================================================

export interface RecorridoPatrullajeData {
  id: number;

  estado:
  EstadoPatrullaje;

  fechaInicio:
  string | null;

  fechaFin:
  string | null;
}

// ============================================================
// RESUMEN DEL RECORRIDO
// ============================================================

export interface RecorridoPatrullajeResumenData {
  totalPuntos: number;

  distanciaMetros: number;

  distanciaKilometros: number;

  velocidadPromedioKmh: number;

  ultimaActualizacion:
  string | null;
}

// ============================================================
// PUNTO GPS
// ============================================================

export interface RecorridoPatrullajePuntoData {
  id: number;

  usuarioId: number;

  lat: number;

  lng: number;

  /*
   * Puede ser null según el modelo PatrullajeGps.
   */
  velocidad: number | null;

  precision: number | null;

  fechaHora: string;

  tipo:
  TipoPuntoPatrullaje;
}

// ============================================================
// DATA
// ============================================================

export interface GetRecorridoPatrullajeData {
  patrullaje: RecorridoPatrullajeData;
  resumen: RecorridoPatrullajeResumenData;
  puntos: RecorridoPatrullajePuntoData[];
}

// ============================================================
// RESPONSE
// ============================================================
export type GetRecorridoPatrullajeResponse = ApiResponse<GetRecorridoPatrullajeData>;



