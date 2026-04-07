import { Usuario } from "./usuarioResponse";

export interface LoginResponse {
  message: string;
  token: string;
  usuario: Usuario;
  roles: string[];
}




export interface PaginadoResponse {
  data: any[];
  total: number;
  page: number;
  limit: number;
}
