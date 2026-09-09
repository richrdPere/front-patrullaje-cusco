import { ApiResponse } from '../alertas.interface';
import { CreateUnidadPatrullajeRequest } from './create-unidad-patrullaje.model';

import {
  EstadoUnidadPatrullaje,
  UnidadPatrullajeData,
} from './get-unidades-paginated.model';

// ============================================================
// REQUEST
// ============================================================
export interface UpdateUnidadPatrullajeRequest
  extends CreateUnidadPatrullajeRequest {
  estado: EstadoUnidadPatrullaje;
}

// ============================================================
// RESPONSE
// ============================================================
export type UpdateUnidadPatrullajeResponse = ApiResponse<UnidadPatrullajeData>;



