import { ApiResponse } from "../alertas.interface";
import { EstadoPolicia } from "./create-policia.model";


// Request para cambiar estado
export interface CambiarEstadoPoliciaRequest {
  estado: EstadoPolicia;
}

// Resultado del cambio de estado
export interface CambiarEstadoPoliciaData {
  id: number;
  estado: EstadoPolicia;

  /*
   * true: el estado fue modificado.
   * false: el policía ya tenía el estado solicitado.
   */
  actualizado: boolean;
}

// | Response del endpoint
export type CambiarEstadoPoliciaResponse = ApiResponse<CambiarEstadoPoliciaData>;
