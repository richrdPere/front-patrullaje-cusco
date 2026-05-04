export interface Persona {
  id: number;
  nombres: string;
  apellidos: string;
  documento_identidad: string;
  telefono?: string;
  direccion?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  foto_perfil?: string;
  updatedAt?: string;
}

export interface Usuario {
  id: number;
  username: string;
  correo: string;
  estado: boolean;
  createdAt?: string;
  updatedAt?: string;
  persona: Persona;
  roles: string[];
}

// RESPONSE INTERFACES FOR USUARIOS

// - usuario paginado
export interface UsuarioListResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Usuario[];
}

// - usuario detalle
export interface UsuarioDetalleResponse extends Usuario { }

// - crear usuario
export interface CrearUsuarioResponse {
  message: string;
  usuario: Usuario;
}

// - actualizar usuario
export interface UpdateUsuarioResponse {
  message: string;
}

// - cambiar estado usuario
export interface EstadoUsuarioResponse {
  message: string;
  usuario: {
    id: number;
    username: string;
    estado: boolean;
    persona: Persona;
  };
}

// - listar serenos y conductores
export interface SerenosConductoresResponse {
  total: number;
  data: Usuario[];
}
