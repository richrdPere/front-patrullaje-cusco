import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

//Environment
import { environment } from '@environments/environment';

// Interface
import { ApiResponse } from '../pages/shared/interfaces/api-response';

@Injectable({ providedIn: 'root' })
export class HistorialPatrullajeService {
  // 1.- Enviroment
  envs = environment;

  // 2.- variables publicas
  API_BASE = this.envs.main_url + 'historial';

  API_GET_HISTORIAL_PATRULLAJE: string = this.API_BASE + '/patrullaje/';
  API_GET_HISTORIAL_DETALLE: string = this.API_BASE + '/detalle/';
  // API_GET_HISTORIAL_ZONA_RESUMEN: string = this.API_BASE + '/zona/';
  // API_PUT_ARCHIVAR_HISTORIAL: string = this.API_BASE + '/archivar/';

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
  // 1.- Obtener historial de patrullaje
  // ===========================================================
  getHistorialByIdPatrullaje(id: number): Observable<ApiResponse<any>> {

    const headers = this.getAuthHeaders().headers;
    return this.http.get<ApiResponse<any>>(`${this.API_GET_HISTORIAL_PATRULLAJE}${id}`, { headers });
  }

  // ===========================================================
  // 2.- Obtener historial zonas
  // ===========================================================
  getHistorialDetalle(id: number) {

    const headers = this.getAuthHeaders().headers;
    return this.http.get<any>(`${this.API_GET_HISTORIAL_DETALLE}${id}`, { headers });
  }

  // // ===========================================================
  // // 3.- Obtener historial zonas resumen
  // // ===========================================================
  // getHistorialResumenZonas() {
  //   return this.http.get<any>(`${this.API_GET_HISTORIAL_ZONA}`);
  // }

  // // ===========================================================
  // // 4.- Obtener historial zonas resumen
  // // ===========================================================
  // updateHistorialPatrullaje(id: string, data: Partial<any>): Observable<any> {
  //   return this.http.put<any>(`${this.API_PUT_ARCHIVAR_HISTORIAL}${id}`, data);
  // }
}
