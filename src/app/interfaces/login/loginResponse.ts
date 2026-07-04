import { Usuario } from "./usuarioResponse";

export interface LoginResponse {
  token: string;
  roles: string[];
  usuario: Usuario;
}

// export interface PaginadoResponse {
//   data: any[];
//   total: number;
//   page: number;
//   limit: number;
// }
