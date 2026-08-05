import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

//Environment
import { environment } from '@environments/environment';

// Interfaces
import { ApiResponse } from '../pages/shared/interfaces/api-response';
import { ReporteIncidenciasData, ReporteIncidenciasFilters } from '../interfaces/reportes/reporte-incidencias.interface';
import { ReporteRecorridosData, ReporteRecorridosFilters } from '../interfaces/reportes/reporte-recorridos.interface';
import { ReporteActividadFilters, ReporteActividadOperativaData } from '../interfaces/reportes/reporte-actividad-operativa.interface';
import { ReporteZonasCriticasData, ReporteZonasCriticasFilters } from '../interfaces/reportes/reporte-zonas-crititcas.interface';


@Injectable({ providedIn: 'root' })
export class ReportesService {

  // 1.- Enviroment
  envs = environment;

  // 2.- variables publicas
  API_BASE = this.envs.main_url + 'reportes';

  API_GET_REPORTE_INCIDENCIAS: string = this.API_BASE + '/incidencias';
  API_GET_REPORTE_ACTIVIDAD_OPERATIVA: string = this.API_BASE + '/actividad-operativa';
  API_GET_REPORTE_RECORRIDOS: string = this.API_BASE + '/recorridos';
  API_GET_REPORTE_ZONAS_CRITICAS: string = this.API_BASE + '/zonas-criticas';

  constructor(private http: HttpClient) { }

  // 3. HEADERS DE AUTENTICACIÓN
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

  // 4. CONSTRUIR PARAMS
  private buildHttpParams<T extends object>(filters: T): HttpParams {

    let params = new HttpParams();

    Object.entries(filters)
      .forEach(([key, value]) => {

        if (
          value === null ||
          value === undefined ||
          value === ''
        ) {
          return;
        }

        params = params.set(
          key,
          String(value)
        );
      });

    return params;
  }

  // SERVICES

  // =========================================================
  // 1. REPORTE DE INCIDENCIAS
  // =========================================================
  getReporteIncidencias(filters: ReporteIncidenciasFilters = {}): Observable<ApiResponse<ReporteIncidenciasData>> {

    const params = this.buildHttpParams(filters);
    const headers = this.getAuthHeaders().headers;

    return this.http.get<ApiResponse<ReporteIncidenciasData>>(
      this.API_GET_REPORTE_INCIDENCIAS,
      {
        params,
        headers,
      },
    );
  }

  // =========================================================
  // 2. REPORTE DE RECORRIDOS
  // =========================================================
  getReporteRecorridos(filters: ReporteRecorridosFilters = {}): Observable<ApiResponse<ReporteRecorridosData>> {

    const params = this.buildHttpParams(filters);
    const headers = this.getAuthHeaders().headers;

    return this.http.get<ApiResponse<ReporteRecorridosData>>(
      this.API_GET_REPORTE_RECORRIDOS,
      {
        params,
        headers,
      },
    );
  }

  // =========================================================
  // 3. REPORTE DE ACTIVIDAD OPERATIVA
  // =========================================================
  getReporteActividadOperativa(filters: ReporteActividadFilters = {}): Observable<ApiResponse<ReporteActividadOperativaData>> {

    const params = this.buildHttpParams(filters);
    const headers = this.getAuthHeaders().headers;

    return this.http.get<ApiResponse<ReporteActividadOperativaData>>(
      this.API_GET_REPORTE_ACTIVIDAD_OPERATIVA,
      {
        params,
        headers,
      },
    );
  }

  // =========================================================
  // 4. REPORTE DE ZONAS CRÍTICAS
  // =========================================================
  getReporteZonasCriticas(filters: ReporteZonasCriticasFilters = {},): Observable<ApiResponse<ReporteZonasCriticasData>> {

    const params = this.buildHttpParams(filters);
    const headers = this.getAuthHeaders().headers;

    return this.http.get<ApiResponse<ReporteZonasCriticasData>>(
      this.API_GET_REPORTE_ZONAS_CRITICAS,
      {
        params,
        headers,
      },
    );
  }

}
