import { Persona } from "../login/usuarioResponse";
import { Policia } from "./IPolicia";

// 1. Lista de policías con paginación
export interface PoliciaListResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Policia[];
}

// 2. Detalle de un policía específico
export interface PoliciaDetalleResponse extends Policia { }

// 3. Respuesta al crear un nuevo policía
export interface CrearPoliciaResponse {
  message: string;
  data: {
    id: number;
    persona: Persona;
  };
}

// 4. Respuesta al actualizar un policía
export interface UpdatePoliciaResponse {
  message: string;
}

// 5. Respuesta al eliminar un policía
export interface DeletePoliciaResponse {
  message: string;
}

// 6. Formato para dropdowns o selectores de policías
export interface PoliciaSelectResponse {
  total: number;
  data: PoliciaSelectItem[];
}

export interface PoliciaSelectItem {
  id: number;
  label: string;
  dni: string;
  grado: string;
  comisaria: string;
  persona: Persona;
}
