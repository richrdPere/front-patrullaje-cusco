import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

//Environment
import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class IncidenciasService {

  // 1.- Enviroment
  envs = environment;

  // 2.- variables publicas
  API_BASE = this.envs.main_url + 'incidencias';

  API_GET_INCIDENTES_PAGINATED: string = this.API_BASE + '/paginado';
  API_GET_INCIDENTES_BY_ID: string = this.API_BASE + '/detalle/';

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
  // 1.- Obtener todos los Incidentes (paginado)
  // ===========================================================
  getIncidentesPaginated(filters: {
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
    return this.http.get<any>(this.API_GET_INCIDENTES_PAGINATED, { params, headers });
  }

  // ===========================================================
  // 2.- Obtener Patrullaje por ID
  // ===========================================================
  getIncidentesById(id: number): Observable<any> {
    return this.http.get(this.API_GET_INCIDENTES_BY_ID + `${id}`);
  }

}
