import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

//Environment
import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class HistorialPatrullajeService {
  // 1.- Enviroment
  envs = environment;

  // 2.- variables publicas
  API_BASE = this.envs.main_url + 'historial';

  API_GET_HISTORIAL_PATRULLAJE: string = this.API_BASE + '/patrullaje';
  API_GET_HISTORIAL_ZONA: string = this.API_BASE + '/zona/';
  API_GET_HISTORIAL_ZONA_RESUMEN: string = this.API_BASE + '/zona/';
  API_PUT_ARCHIVAR_HISTORIAL: string = this.API_BASE + '/archivar/';

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
  getHistorialPatrullajePaginated(filters: {
    page?: number;
    limit?: number;
    fecha?: string,
    descripcion?: string
  }): Observable<any> {

    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params = params.set(key, value.toString());
      }
    });

    const headers = this.getAuthHeaders().headers;
    return this.http.get<any>(this.API_GET_HISTORIAL_PATRULLAJE, { params, headers });
  }

  // ===========================================================
  // 2.- Obtener historial zonas
  // ===========================================================
  getHistorialZonas() {
    return this.http.get<any>(`${this.API_GET_HISTORIAL_ZONA}`);
  }

  // ===========================================================
  // 3.- Obtener historial zonas resumen
  // ===========================================================
  getHistorialResumenZonas() {
    return this.http.get<any>(`${this.API_GET_HISTORIAL_ZONA}`);
  }

  // ===========================================================
  // 4.- Obtener historial zonas resumen
  // ===========================================================
  updateHistorialPatrullaje(id: string, data: Partial<any>): Observable<any> {
    return this.http.put<any>(`${this.API_PUT_ARCHIVAR_HISTORIAL}${id}`, data);
  }
}
