import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

//Environment
import { environment } from '@environments/environment';

// Interfaces
import { ApiResponse } from '../interfaces/alertas.interface';
import { EstadoIncidencia, IncidenciasPaginadasData, IncidenciasPaginadasFilters } from '../interfaces/incidencia/incidencias.interface';
import { IncidenciaDetalle, IncidenciaDetalleResponse } from '../interfaces/incidencia/incidencia_detalle.interface';
import { ActualizarEstadoIncidenciaRequest } from '../interfaces/incidencia/update_individual_incidencia.interface';
import { UpdateEstadoMasivoData, UpdateEstadoMasivoRequest } from '../interfaces/incidencia/update_estado_masivo_incidencia.interface';
import { IncidenciasByFechaData, IncidenciasByFechaFilters } from '../interfaces/incidencia/get_incidencia_by_fecha.interface';
import { IncidenciasByUsuarioData, IncidenciasByUsuarioFilters } from '../interfaces/incidencia/get_incidencia_by_usuario_id.interface';
import { IncidenciasByPatrullajeData, IncidenciasByPatrullajeFilters } from '../interfaces/incidencia/get_incidencia_by_patrullaje_id.interface';
import { IncidenciasByZonaData, IncidenciasByZonaFilters } from '../interfaces/incidencia/get_incidencia_by_zona_id.interface';
import { ArchivosIncidenciaData } from '../interfaces/incidencia/archivos_incidencia.interface';

@Injectable({ providedIn: 'root' })
export class IncidenciasService {

  // 1.- Enviroment
  envs = environment;

  // 2.- variables publicas
  API_BASE = this.envs.main_url + 'incidencias';

  API_GET_INCIDENTES_PAGINATED: string = this.API_BASE + '/paginado';
  API_GET_INCIDENTES_BY_ID: string = this.API_BASE + '/detalle/';
  API_CREATE_INCIDENTE: string = this.API_BASE + '/crear';
  API_GET_RESUMEN_INCIDENCIA: string = this.API_BASE + '/resumen';
  API_UPDATE_ESTADO_MASIVO: string = this.API_BASE + '/estado-masivo';
  API_UPDATE_ESTADO_INDIVIDUAL: string = this.API_BASE + '/editar/';
  API_GET_INCIDENCIAS_BY_FECHA: string = this.API_BASE + '/fecha';
  API_GET_INCIDENCIAS_BY_USUARIO_ID: string = this.API_BASE + '/usuario/';
  API_GET_INCIDENCIAS_BY_PATRULLAJE_ID: string = this.API_BASE + '/patrullaje/';
  API_GET_INCIDENCIAS_BY_ZONA_ID: string = this.API_BASE + '/zona/';
  API_GET_ARCHIVOS_INCIDENCIA: string = this.API_BASE + '/';


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
  // 1.- Obtener todos los Incidentes (paginado)
  // ===========================================================
  getIncidentesPaginated(filters: IncidenciasPaginadasFilters = {}): Observable<ApiResponse<IncidenciasPaginadasData>> {
    const params = this.buildHttpParams(filters);
    const headers = this.getAuthHeaders().headers;
    return this.http.get<ApiResponse<IncidenciasPaginadasData>>(this.API_GET_INCIDENTES_PAGINATED, { params, headers });
  }

  // ===========================================================
  // 2.- Obtener Patrullaje por ID
  // ===========================================================
  getIncidenteById(id: number): Observable<ApiResponse<IncidenciaDetalle>> {
    const headers = this.getAuthHeaders().headers;
    return this.http.get<ApiResponse<IncidenciaDetalle>>(`${this.API_GET_INCIDENTES_BY_ID}${id}`, { headers });
  }

  // ===========================================================
  // 3.- Actualizar estado individual
  // ===========================================================
  updateEstadoIncidencia(id: number, estado: EstadoIncidencia): Observable<ApiResponse<IncidenciaDetalle>> {
    const headers = this.getAuthHeaders().headers;
    const body: ActualizarEstadoIncidenciaRequest = {
      estado,
    };

    return this.http.patch<ApiResponse<IncidenciaDetalle>>(`${this.API_UPDATE_ESTADO_INDIVIDUAL}${id}/estado`, body, { headers });
  }

  // ===========================================================
  // 4.- Actualizar estado masivo
  // ===========================================================
  updateEstadoMasivo(
    ids: number[],
    estado: EstadoIncidencia
  ): Observable<
    ApiResponse<UpdateEstadoMasivoData>
  > {

    const body: UpdateEstadoMasivoRequest = {
      ids,
      estado,
    };
    const headers = this.getAuthHeaders().headers;

    return this.http.put<ApiResponse<UpdateEstadoMasivoData>>(this.API_UPDATE_ESTADO_MASIVO, body, { headers });
  }

  // ===========================================================
  // 5.- Consultar por fecha
  // ===========================================================
  getIncidenciasByFecha(
    filters: IncidenciasByFechaFilters
  ): Observable<
    ApiResponse<IncidenciasByFechaData>
  > {

    const params = this.buildHttpParams(filters);
    const headers = this.getAuthHeaders().headers;

    return this.http.get<ApiResponse<IncidenciasByFechaData>>(this.API_GET_INCIDENCIAS_BY_FECHA, { params, headers });
  }

  // ===========================================================
  // 6. CONSULTAR POR USUARIO ID
  // =========================================================== f
  getIncidenciasByUsuario(
    usuarioId: number,
    filters: IncidenciasByUsuarioFilters = {}
  ): Observable<
    ApiResponse<IncidenciasByUsuarioData>
  > {

    const params = this.buildHttpParams(filters);
    const headers = this.getAuthHeaders().headers;
    return this.http.get<ApiResponse<IncidenciasByUsuarioData>>(`${this.API_GET_INCIDENCIAS_BY_USUARIO_ID}${usuarioId}`, { params, headers });
  }

  // ===========================================================
  // 7. CONSULTAR POR PATRULLAJE ID
  // ===========================================================
  getIncidenciasByPatrullaje(
    patrullajeId: number,
    filters: IncidenciasByPatrullajeFilters = {}
  ): Observable<
    ApiResponse<IncidenciasByPatrullajeData>
  > {
    const params = this.buildHttpParams(filters);
    const headers = this.getAuthHeaders().headers;

    return this.http.get<ApiResponse<IncidenciasByPatrullajeData>>(`${this.API_GET_INCIDENCIAS_BY_PATRULLAJE_ID}${patrullajeId}`, { params, headers });
  }

  // ===========================================================
  // 8. CONSULTAR POR ZONA
  // ===========================================================
  getIncidenciasByZona(
    zonaId: number,
    filters: IncidenciasByZonaFilters = {}
  ): Observable<
    ApiResponse<IncidenciasByZonaData>
  > {
    const params = this.buildHttpParams(filters);
    const headers = this.getAuthHeaders().headers;
    return this.http.get<ApiResponse<IncidenciasByZonaData>>(`${this.API_GET_INCIDENCIAS_BY_ZONA_ID}${zonaId}`, { params, headers });
  }

  // ===========================================================
  // 9. OBTENER ARCHIVOS DE INCIDENCIA
  // ===========================================================
  getArchivosIncidencia(
    incidenciaId: number
  ): Observable<
    ApiResponse<ArchivosIncidenciaData>
  > {
    const headers = this.getAuthHeaders().headers;
    return this.http.get<ApiResponse<ArchivosIncidenciaData>>(`${this.API_GET_ARCHIVOS_INCIDENCIA}${incidenciaId}/archivos`, { headers });
  }
}
