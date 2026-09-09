import { ApiResponse } from '../alertas.interface';
import { UnidadPatrullajeData } from './get-unidades-paginated.model';

// ============================================================
// RESPONSE
// ============================================================

export type GetUnidadByIdResponse = ApiResponse<UnidadPatrullajeData>;

