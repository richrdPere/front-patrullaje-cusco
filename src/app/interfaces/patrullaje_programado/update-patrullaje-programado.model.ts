import { ApiResponse } from '../alertas.interface';
import {
  CreatePatrullajeProgramadoRequest,
  CreatePatrullajeUnidadData,
  CreatePatrullajeZonaData,
  EstadoPatrullaje,
  ModalidadPatrullaje,
  TipoPatrullaje,
} from './create-patrullaje-programado.model';

// ============================================================
// REQUEST
// ============================================================

/*
 * Actualmente la actualización reemplaza todos los campos
 * del patrullaje, incluyendo serenos y policías.
 */
export interface UpdatePatrullajeProgramadoRequest
  extends CreatePatrullajeProgramadoRequest { }

// ============================================================
// DATA
// ============================================================

export interface UpdatePatrullajeProgramadoData {
  id: number;

  /*
   * Es null cuando el patrullaje no utiliza una unidad.
   */
  unidad_id: number | null;

  zona_id: number;

  tipo_patrullaje:
  TipoPatrullaje;

  modalidad_patrullaje:
  ModalidadPatrullaje;

  detalle_tipo_patrullaje:
  string | null;

  fecha: string;

  hora_inicio: string;

  hora_fin: string;

  descripcion: string | null;

  estado:
  EstadoPatrullaje;

  /*
   * Es null en patrullajes a pie.
   */
  unidad:
  CreatePatrullajeUnidadData | null;

  zona:
  CreatePatrullajeZonaData | null;

  /*
   * IDs de Usuario.
   */
  serenos: number[];

  /*
   * IDs de Policia.
   */
  policias: number[];

  updatedAt: string;
}

// ============================================================
// RESPONSE
// ============================================================
export type UpdatePatrullajeProgramadoResponse = ApiResponse<UpdatePatrullajeProgramadoData>;



