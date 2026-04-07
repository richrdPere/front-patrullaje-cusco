import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// Environment
import { environment } from 'src/environments/environment';

// Interfaces
import { PaginadoResponse } from '../interfaces/login/loginResponse';

export interface UltimoCodigoResponse {
  codigo: string;
}


@Injectable({
  providedIn: 'root'
})
export class UnidadPatrullajeService {

  // 1. Environment
  envs = environment;

  // 2. Variables globales
  API_BASE = this.envs.main_url + 'unidad-patrullaje';

  API_LISTAR_UNIDADES: string = this.API_BASE + '/paginado';
  API_GET_UNIDADES: string = this.API_BASE + 'todos';
  API_CREAR_UNIDAD: string = this.API_BASE + '/crear';
  API_ACTUALIZAR_UNIDAD: string = this.API_BASE + '/editar/';
  API_OBTENER_UNIDAD_POR_ID: string = this.API_BASE + '/detalle/';
  API_ELIMINAR_UNIDAD: string = this.API_BASE + '/eliminar/';
  API_GET_ULTIMO_CODIGO: string = this.API_BASE + '/codigo';
  API_ALL_UNIDADES: string = this.API_BASE + '/todos';

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

  // ===========================================================
  // 1.- Obtener todas las unidades (PAGINADO)
  // ===========================================================
  getUnidadesPaginado(filters: {
    page?: number;
    limit?: number;
    placa?: string;
    descripcion?: string;
  }

  ): Observable<PaginadoResponse> {

    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    const headers = this.getAuthHeaders().headers;

    return this.http.get<PaginadoResponse>(this.API_LISTAR_UNIDADES, { params, headers });
  }

  // ===========================================================
  // 2.- Obtener una unidad por ID
  // ===========================================================
  getUnidadByID(id: string): Observable<any> {
    return this.http.get<any>(`${this.API_OBTENER_UNIDAD_POR_ID}${id}`);
  }

  // ===========================================================
  // 3.- Crear nueva unidad
  // ===========================================================
  newUnidad(data: any): Observable<any> {
    return this.http.post<any>(this.API_CREAR_UNIDAD, data);
  }

  // ===========================================================
  // 4.- Actualizar unidad
  // ===========================================================
  updateUnidad(id: string, data: Partial<any>): Observable<any> {
    return this.http.put<any>(`${this.API_ACTUALIZAR_UNIDAD}${id}`, data);
  }

  // ===========================================================
  // 5.- Eliminar unidad
  // ===========================================================
  deleteUnidad(id: string): Observable<any> {
    return this.http.delete(`${this.API_ELIMINAR_UNIDAD}${id}`);
  }

  // ===========================================================
  // 6.- Obtener ultimo codigo
  // ===========================================================
  getUltimoCodigo() {
    return this.http.get<UltimoCodigoResponse>(this.API_GET_ULTIMO_CODIGO);
  }

  // ===========================================================
  // 7.- Obtener todas las unidades
  // ===========================================================
  getAllUnidades() {
    return this.http.get<any>(`${this.API_ALL_UNIDADES}`);
  }

}
