import { ApiResponse } from '../alertas.interface';
import {
  EstadoPatrullaje,
} from './create-patrullaje-programado.model';

// ============================================================
// DATA
// ============================================================

export interface FinishPatrullajeProgramadoData {
  id: number;
  estado_anterior: EstadoPatrullaje;
  estado: EstadoPatrullaje;

  /*
   * Es false cuando el patrullaje ya estaba finalizado.
   */
  actualizado: boolean;

  /*
   * Cantidad de asignaciones cambiadas a FINALIZADO.
   */
  personal_finalizado: number;

  /*
   * Indica si la unidad cambió de EN_PATRULLAJE
   * a DISPONIBLE.
   */
  unidad_liberada: boolean;
  fecha_fin: string | null;
}

// ============================================================
// RESPONSE
// ============================================================
export type FinishPatrullajeProgramadoResponse = ApiResponse<FinishPatrullajeProgramadoData>;


