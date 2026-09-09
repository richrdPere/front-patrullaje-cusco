import { ApiResponse } from "../alertas.interface";

export interface DeleteZonaData {
  id: number;
  nombre: string;
  estado: boolean;
  eliminado: boolean;
  updatedAt: string;
}

export type DeleteZonaResponse = ApiResponse<DeleteZonaData>;
