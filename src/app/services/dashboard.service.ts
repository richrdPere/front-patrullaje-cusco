import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

//Environment
import { environment } from '@environments/environment';

// Interface
import { DashboardSummary } from '../interfaces/dashboardSummary';
import { ApiResponse } from '../pages/shared/interfaces/api-response';


@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  // 1.- Enviroment
  envs = environment;

  // 2.- variables publicas
  API_BASE = this.envs.main_url + 'dashboard';

  API_GET_RESUMEN: string = this.API_BASE + '/resumen';



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
  getResumen(): Observable<ApiResponse<DashboardSummary>> {
    const headers = this.getAuthHeaders().headers;
    return this.http.get<ApiResponse<DashboardSummary>>(`${this.API_GET_RESUMEN}`, { headers });
  }
}
