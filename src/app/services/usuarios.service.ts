import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// Environment
import { environment } from '@environments/environment';

// Interfaces
import { Usuario, UsuarioResponse } from '../interfaces/login/usuarioResponse';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  envs = environment;

  API_BASE = this.envs.main_url + 'usuarios';

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
  // 1. Listar usuarios (paginado + buscador)
  // =========================================================
  getUsuariosPaginados(
    filters: {
      page?: number;
      limit?: number;
      nombres?: string;
      dni?: string;
      rol?: string;
    }
  ): Observable<UsuarioResponse> {

    let params = new HttpParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    const headers = this.getAuthHeaders().headers;
    return this.http.get<UsuarioResponse>(this.API_BASE, { params, headers });
  }

  // =========================================================
  // 2. Obtener usuario por ID
  // =========================================================
  obtenerUsuario(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.API_BASE}/${id}`);
  }

  // =========================================================
  // 3. Crear usuario
  // =========================================================
  crearUsuario(data: any): Observable<any> {

    let headers = new HttpHeaders().set('Content-Type', 'application/json');

    return this.http.post(
      this.API_BASE,
      data,
      { headers }
    );
  }

  // =========================================================
  // 4. Actualizar usuario
  // =========================================================
  actualizarUsuario(id: number, data: any): Observable<any> {

    let headers = new HttpHeaders().set('Content-Type', 'application/json');

    return this.http.put(
      `${this.API_BASE}/${id}`,
      data,
      { headers }
    );
  }

  // =========================================================
  // 5. Eliminar usuario
  // =========================================================
  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.API_BASE}/${id}`);
  }

  // =========================================================
  // 6. Cambiar estado usuario
  // =========================================================
  cambiarEstado(id: number, estado: boolean): Observable<any> {

    return this.http.patch(
      `${this.API_BASE}/${id}/estado`,
      { estado }
    );

  }

}
