import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

//Environment
import { environment } from '@environments/environment';
import { ZonaPatrullaje } from './../interfaces/zonaPatrullaje';
import { PaginadoResponse } from '../interfaces/login/loginResponse';

@Injectable({ providedIn: 'root' })
export class PatrullajeProgramadoService {

  // 1.- Enviroment
  envs = environment;

  // 2.- variables publicas
  private url: string = this.envs.main_url;

  API_BASE = this.envs.main_url + 'patrullaje-programado';

  API_NEW_PATRULLAJE: string = this.API_BASE + '/crear';
  API_GET_ALL_PATRULLAJE: string = this.API_BASE + '/todos';
  API_GET_PATRULLAJES_PAGINATED: string = this.API_BASE + '/paginado';
  API_GET_PATRULLAJE_BY_ID: string = this.API_BASE + '/detalle/';
  API_UPDATE_PATRULLAJE: string = this.API_BASE + '/editar/';
  API_DELETE_PATRULLAJE: string = this.API_BASE + '/eliminar/';

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
  // 1.- Crear Patrullaje
  // ===========================================================
  newPatrullajeProgramado(patrullaje: any): Observable<any> {
    return this.http.post(this.API_NEW_PATRULLAJE, patrullaje);
  }

  // ===========================================================
  // 2.- Obtener todos los Patrullajes
  // ===========================================================
  getAllPatrullajeProgramado() {
    return this.http.get<any>(`${this.API_GET_ALL_PATRULLAJE}`);
  }

  // ===========================================================
  // 3.- Obtener todos los Patrullajes (paginado)
  // ===========================================================
  getPatrullajesProgramadoPaginated(filters: {
    page?: number;
    limit?: number;
    fecha?: string,
    descripcion?: string
  }): Observable<PaginadoResponse> {

    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params = params.set(key, value.toString());
      }
    });

    const headers = this.getAuthHeaders().headers;
    return this.http.get<PaginadoResponse>(this.API_GET_PATRULLAJES_PAGINATED, { params, headers });
  }

  // ===========================================================
  // 4.- Obtener Patrullaje por ID
  // ===========================================================
  getPatrullajeProgramadoById(id: string): Observable<any> {
    return this.http.get(this.API_GET_PATRULLAJE_BY_ID + `${id}`);
  }

  // ===========================================================
  // 5.- Actualizar Patrullaje por ID
  // ===========================================================
  updatePatrullajeProgramado(id: string, data: Partial<any>): Observable<any> {
    return this.http.put<any>(`${this.API_UPDATE_PATRULLAJE}${id}`, data);
  }

  // ===========================================================
  // 6.- Eliminar Patrullaje Programado
  // ===========================================================
  deletePatrullajeProgramado(id: string): Observable<any> {
    return this.http.delete(`${this.API_DELETE_PATRULLAJE}${id}`);
  }
}
