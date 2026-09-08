// Eliminación exitosa
export interface EliminarPoliciaSuccessData {
  policia_id: number;
  persona_id: number;
}

export interface EliminarPoliciaSuccessResponse {
  success: true;
  message: string;
  data?: EliminarPoliciaSuccessData;
}

// Policía con patrullajes asociados
export interface EliminarPoliciaConflictData {
  total_asignaciones: number;
}

export interface EliminarPoliciaConflictResponse {
  success: false;
  message: string;
  data: EliminarPoliciaConflictData;
}

// Posibles respuestas del backend
export type EliminarPoliciaResponse =
  | EliminarPoliciaSuccessResponse
  | EliminarPoliciaConflictResponse;
