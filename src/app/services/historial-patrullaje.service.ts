import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

//Environment
import { environment } from '@environments/environment';

// Interface
import { ApiResponse } from '../pages/shared/interfaces/api-response';
import { HistorialPatrullaje, HistorialPatrullajeFilters, HistorialPatrullajePaginadoData, } from '../interfaces/historial/historial-patrullaje.interface';

@Injectable({ providedIn: 'root' })
export class HistorialPatrullajeService {
  // 1.- Enviroment
  envs = environment;

  // 2.- variables publicas
  API_BASE = this.envs.main_url + 'historial';

  API_GET_HISTORIAL_BY_PATRULLAJE: string = this.API_BASE + '/patrullaje/';
  API_GET_HISTORIAL_DETALLE: string = this.API_BASE + '/detalle/';
  API_GET_HISTORIAL_PAGINADO: string = this.API_BASE + '/paginado';

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

  // 5. SERVICES

  // ===========================================================
  // 1.- Obtener historial de patrullaje
  // ===========================================================
  getHistorialByPatrullaje(
    patrullajeId: number,
    filters:
      Omit<
        HistorialPatrullajeFilters,
        'patrullaje_id'
      > = {},
  ): Observable<
    ApiResponse<
      HistorialPatrullajePaginadoData
    >
  > {

    const filtrosCompletos:
      HistorialPatrullajeFilters = {
      ...filters,
      patrullaje_id: patrullajeId,
    };

    return this.getHistorialPaginado(
      filtrosCompletos,
    );
  }

  // ===========================================================
  // 2.- Obtener historial por ID
  // ===========================================================
  getHistorialById(
    historialId: number,
  ): Observable<
    ApiResponse<HistorialPatrullaje>
  > {

    const headers =
      this.getAuthHeaders().headers;

    return this.http.get<
      ApiResponse<HistorialPatrullaje>
    >(
      `${this.API_GET_HISTORIAL_DETALLE}${historialId}`,
      {
        headers,
      },
    );
  }

  // ===========================================================
  // 3.- Obtener historial paginado
  // ===========================================================
  getHistorialPaginado(
    filters:
      HistorialPatrullajeFilters = {},
  ): Observable<
    ApiResponse<
      HistorialPatrullajePaginadoData
    >
  > {

    const params =
      this.buildHttpParams(filters);

    const headers =
      this.getAuthHeaders().headers;

    return this.http.get<ApiResponse<HistorialPatrullajePaginadoData>>
      (
        this.API_GET_HISTORIAL_PAGINADO,
        {
          params,
          headers,
        },
      );
  }

  // =========================================================
  // 4. ENDPOINT ANTIGUO POR PATRULLAJE
  // =========================================================
  getHistorialByPatrullajeEndpoint(
    patrullajeId: number,
  ): Observable<
    ApiResponse<HistorialPatrullaje[]>
  > {
    const headers = this.getAuthHeaders().headers;
    return this.http.get<ApiResponse<HistorialPatrullaje[]>>
      (`${this.API_GET_HISTORIAL_BY_PATRULLAJE}${patrullajeId}`, { headers, },
      );
  }
}
