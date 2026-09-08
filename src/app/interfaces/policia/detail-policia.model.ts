import { ApiResponse } from "../alertas.interface";
import { EstadoPolicia } from "./create-policia.model";

// Datos personales del policía
export interface PoliciaPersonaData {
  id: number;
  nombres: string;
  apellidos: string;
  documento_identidad: string;
  telefono: string | null;
  direccion: string | null;
  departamento: string | null;
  provincia: string | null;
  distrito: string | null;
}

// Detalle del policía
export interface PoliciaByIdData {
  id: number;
  persona_id: number;
  grado: string;
  comisaria: string;
  codigo_institucional: string;
  estado: EstadoPolicia;
  persona: PoliciaPersonaData;
}

// Response del endpoint
export type GetPoliciaByIdResponse = ApiResponse<PoliciaByIdData>;
