import { ApiResponse } from '../alertas.interface';
import { UnidadPatrullajeData } from './get-unidades-paginated.model';

// ============================================================
// REQUEST
// ============================================================
export interface CreateUnidadPatrullajeRequest {
  codigo: string;
  tipo: string;
  placa: string | null;
  descripcion: string | null;
}

// ============================================================
// RESPONSE
// ============================================================
export type CreateUnidadPatrullajeResponse = ApiResponse<UnidadPatrullajeData>;


