import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// Environment
import { environment } from '@environments/environment';

// Interfaces
import {
  Usuario,
  UsuarioListResponse,
  UsuarioDetalleResponse,
  CrearUsuarioResponse,
  UpdateUsuarioResponse,
  EstadoUsuarioResponse,
  SerenosConductoresResponse
} from '../interfaces/login/usuarioResponse';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  // 1. Environment
  envs = environment;

  // 2. Variables globales
  API_BASE = this.envs.main_url + 'usuarios';

  API_NEW_USUARIO: string = this.API_BASE + '/crear';
  API_GET_ALL_USUARIOS: string = this.API_BASE + '/serenos';
  API_GET_USUARIOS_PAGINATED: string = this.API_BASE + '/paginado';
  API_GET_USUARIO_BY_ID: string = this.API_BASE + '/detalle/';
  API_UPDATE_USUARIO: string = this.API_BASE + '/editar/';
  API_DELETE_USUARIO: string = this.API_BASE + '/eliminar/';
  API_CHANGE_STATE_USUARIO: string = this.API_BASE + '/estado/';

  constructor(private http: HttpClient) { }

  // ======= HEADER CON TOKEN =======
  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token'); // o sessionStorage según tu login
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return { headers };
  }

  // =========================================================
  // 1. Crear usuario
  // =========================================================
  newUsuario(data: any): Observable<CrearUsuarioResponse> {
    return this.http.post<CrearUsuarioResponse>(this.API_NEW_USUARIO, data, this.getAuthHeaders());
  }

  // =========================================================
  // 2. Obtener todos los serenos y conductores
  // =========================================================
  getSerenosAndConductores(): Observable<SerenosConductoresResponse> {
    return this.http.get<SerenosConductoresResponse>(`${this.API_GET_ALL_USUARIOS}`, this.getAuthHeaders());
  }

  // =========================================================
  // 3. Listar usuarios (paginado + buscador)
  // =========================================================
  getUsuariosPaginados(
    filters: {
      page?: number;
      limit?: number;
      nombres?: string;
      dni?: string;
      rol?: string;
    }
  ): Observable<UsuarioListResponse> {

    let params = new HttpParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<UsuarioListResponse>(this.API_GET_USUARIOS_PAGINATED, { params, ...this.getAuthHeaders() });
  }

  // =========================================================
  // 4. Obtener usuario por ID
  // =========================================================
  getUsuarioById(id: number): Observable<UsuarioDetalleResponse> {
    return this.http.get<UsuarioDetalleResponse>(`${this.API_GET_USUARIO_BY_ID}${id}`, this.getAuthHeaders());
  }

  // =========================================================
  // 5. Actualizar usuario
  // =========================================================
  updateUsuario(id: number, data: any): Observable<UpdateUsuarioResponse> {
    return this.http.put<UpdateUsuarioResponse>(`${this.API_UPDATE_USUARIO}${id}`, data, this.getAuthHeaders());
  }

  // =========================================================
  // 6. Eliminar usuario
  // =========================================================
  deleteUsuario(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_DELETE_USUARIO}${id}`, this.getAuthHeaders());
  }

  // =========================================================
  // 7. Cambiar estado usuario
  // =========================================================
  changeStateUsuario(id: number, estado: boolean): Observable<EstadoUsuarioResponse> {
    return this.http.patch<EstadoUsuarioResponse>(
      `${this.API_CHANGE_STATE_USUARIO}${id}`,
      { estado },
      this.getAuthHeaders()
    );
  }



}
