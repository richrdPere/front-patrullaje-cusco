import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// Environment
import { environment } from 'src/environments/environment';

// Interfaces
import { PaginadoResponse } from '../interfaces/login/loginResponse';

@Injectable({
  providedIn: 'root'
})
export class PoliciasService {
  // 1. Environment
  envs = environment;

  // 2. Variables globales
  API_BASE = this.envs.main_url + 'unidad-patrullaje';

  API_NEW_POLICIA: string = this.API_BASE + '/crear';
  API_GET_ALL_POLICIAS: string = this.API_BASE + '/todos';
  API_GET_POLICIAS_PAGINATED: string = this.API_BASE + '/paginado';
  API_GET_POLICIA_BY_ID: string = this.API_BASE + '/detalle/';
  API_UPDATE_POLICIA: string = this.API_BASE + '/editar/';
  API_DELETE_UNIDAD: string = this.API_BASE + '/eliminar/';


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
  // 1.- Crear policia
  // ===========================================================
  newPolicia(data: any): Observable<any> {
    return this.http.post<any>(this.API_NEW_POLICIA, data);
  }


  // ===========================================================
  // 2.- Obtener todos los policias
  // ===========================================================
  getAllPolicias() {
    return this.http.get<any>(`${this.API_GET_ALL_POLICIAS}`);
  }

  // ===========================================================
  // 3.- Obtener todos los policias (paginado)
  // ===========================================================
  getPoliciasPaginated(filters: {
    page?: number;
    limit?: number;
    nombres?: string;
    dni?: string;
  }): Observable<PaginadoResponse> {

    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    const headers = this.getAuthHeaders().headers;

    return this.http.get<PaginadoResponse>(this.API_GET_POLICIAS_PAGINATED, { params, headers });
  }

  // ===========================================================
  // 4.- Obtener policia por ID
  // ===========================================================
  getPoliciaById(id: string): Observable<any> {
    return this.http.get<any>(`${this.API_GET_POLICIA_BY_ID}${id}`);
  }

  // ===========================================================
  // 5.- Actualizar policia
  // ===========================================================
  updatePolicia(id: string, data: Partial<any>): Observable<any> {
    return this.http.put<any>(`${this.API_UPDATE_POLICIA}${id}`, data);
  }

  // ===========================================================
  // 6.- Eliminar policia
  // ===========================================================
  deletePolicia(id: string): Observable<any> {
    return this.http.delete(`${this.API_DELETE_UNIDAD}${id}`);
  }
}
