import { ApiResponse } from "../alertas.interface";
import { EstadoPolicia } from "./create-policia.model";

// Filtros del listado paginado
export interface PoliciasPaginadoParams {
  page?: number;
  limit?: number;
  nombres?: string;
  dni?: string;
}

// Persona asociada al policía
export interface PoliciaPaginadoPersona {
  id: number;
  nombres: string;
  apellidos: string;
  documento_identidad: string;
  telefono: string | null;
  direccion: string | null;
  departamento: string | null;
  provincia: string | null;
  distrito: string | null;
  foto_perfil: string | null;
  foto_perfil_key: string | null;
  createdAt: string;
  updatedAt: string;
}

// Policía del listado
export interface PoliciaData {
  id: number;
  persona_id: number;
  grado: string;
  comisaria: string;
  codigo_institucional: string;
  estado: EstadoPolicia;
  persona: PoliciaPaginadoPersona;
}

// Información paginada
export interface PoliciasPaginadoData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  items: PoliciaData[];
}

// Response del endpoint
export type PoliciasPaginadoResponse = ApiResponse<PoliciasPaginadoData>;
