import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable } from 'rxjs';

//Environment
import { environment } from '@environments/environment';

// Helpers
import { HttpServiceHelper } from 'src/app/pages/shared/services/http-service.helper';

// Services
import { AuthStorageService } from 'src/app/pages/shared/services/auth-storage.service';

// Interfaces
import { EstadoIncidencia, GetIncidentesPaginatedResponse, IncidenciasPaginadasFilters } from '../../interfaces/incidencia/get-incidencias-paginated.interface';
import { GetIncidenciaByIdResponse } from '../../interfaces/incidencia/get-incidencia_by_id.interface';
import { ActualizarEstadoIncidenciaRequest } from '../../interfaces/incidencia/update_individual_incidencia.interface';
import { UpdateEstadoMasivoRequest, UpdateIncidentesResponse } from '../../interfaces/incidencia/update_estado_masivo_incidencia.interface';
import { GetIncidentesByFechaResponse, IncidenciasByFechaFilters } from '../../interfaces/incidencia/get_incidencia_by_fecha.interface';
import { GetIncidenciasByUsuarioIdResponse, IncidenciasByUsuarioFilters } from '../../interfaces/incidencia/get_incidencia_by_usuario_id.interface';
import { GetIncidenciasByPatrullajeIdResponse, IncidenciasByPatrullajeFilters } from '../../interfaces/incidencia/get_incidencia_by_patrullaje_id.interface';
import { GetIncidenciasByZonasIdResponse, IncidenciasByZonaFilters } from '../../interfaces/incidencia/get_incidencia_by_zona_id.interface';
import { GetArchivosIncidenciaResponse } from '../../interfaces/incidencia/archivos_incidencia.interface';
import { SerenosIncidenciasPaginatedQueryParams, SerenosIncidenciasPaginatedResponse } from 'src/app/interfaces/incidencia/get-serenos-incidencias-paginated.interface';

@Injectable({ providedIn: 'root' })
export class IncidenciasService {

  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE = environment.main_url + 'incidencias';

  private readonly API_GET_INCIDENTES_PAGINATED: string = this.API_BASE + '/paginado';
  private readonly API_GET_INCIDENTES_BY_ID: string = this.API_BASE + '/detalle/';
  private readonly API_CREATE_INCIDENTE: string = this.API_BASE + '/crear';
  private readonly API_GET_RESUMEN_INCIDENCIA: string = this.API_BASE + '/resumen';
  private readonly API_UPDATE_ESTADO_MASIVO: string = this.API_BASE + '/estado-masivo';
  private readonly API_UPDATE_ESTADO_INDIVIDUAL: string = this.API_BASE + '/editar/';
  private readonly API_GET_INCIDENCIAS_BY_FECHA: string = this.API_BASE + '/fecha';
  private readonly API_GET_INCIDENCIAS_BY_USUARIO_ID: string = this.API_BASE + '/usuario/';
  private readonly API_GET_INCIDENCIAS_BY_PATRULLAJE_ID: string = this.API_BASE + '/patrullaje/';
  private readonly API_GET_INCIDENCIAS_BY_ZONA_ID: string = this.API_BASE + '/zona/';
  private readonly API_GET_ARCHIVOS_INCIDENCIA: string = this.API_BASE + '/';
  private readonly API_GET_SERENOS_INCIDENCIAS_PAGINATED: string = this.API_BASE + '/serenos/paginado';

  constructor(
    private readonly http: HttpClient,
    private readonly authStorage: AuthStorageService
  ) { }

  // *********************************************************
  // 1.- OBTENER INCIDENTES PAGINADAS
  // *********************************************************
  getIncidentesPaginated(filters: IncidenciasPaginadasFilters = {}): Observable<GetIncidentesPaginatedResponse> {
    const params = HttpServiceHelper.buildHttpParams(filters);
    const headers = this.getJsonHeaders();

    return this.http.get<GetIncidentesPaginatedResponse>(
      this.API_GET_INCIDENTES_PAGINATED,
      { params, headers }
    )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener los incidentes.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. OBTENER INCIDENTES POR ID
  // *********************************************************
  getIncidenteById(id: number): Observable<GetIncidenciaByIdResponse> {
    const headers = this.getJsonHeaders();

    return this.http.get<GetIncidenciaByIdResponse>(
      `${this.API_GET_INCIDENTES_BY_ID}${id}`,
      { headers },
    ).pipe(
      catchError((error) => HttpServiceHelper
        .handleError(
          error,
          'No se pudo obtener el incidente.',
        ),
      ),
    );
  }

  // *********************************************************
  // 3. CAMBIAR ESTADO DEL INCIDENTE
  // *********************************************************
  updateEstadoIncidencia(id: number, estado: EstadoIncidencia): Observable<GetIncidenciaByIdResponse> {
    const headers = this.getJsonHeaders();
    const body: ActualizarEstadoIncidenciaRequest = {
      estado,
    };

    return this.http.patch<GetIncidenciaByIdResponse>(
      `${this.API_UPDATE_ESTADO_INDIVIDUAL}${id}/estado`,
      body, { headers }
    ).pipe(
      catchError((error) =>
        HttpServiceHelper.handleError(
          error,
          'No se pudo cambiar el estado del incidente.',
        ),
      ),
    );
  }

  // *********************************************************
  // 4. ACTUALIZAR ESTADO MASIVO DE INCIDENTES
  // *********************************************************
  updateEstadoMasivo(ids: number[], estado: EstadoIncidencia): Observable<UpdateIncidentesResponse> {
    const headers = this.getJsonHeaders();
    const body: UpdateEstadoMasivoRequest = {
      ids,
      estado,
    };

    return this.http.put<UpdateIncidentesResponse>(
      this.API_UPDATE_ESTADO_MASIVO,
      body,
      { headers }
    ).pipe(
      catchError((error) =>
        HttpServiceHelper.handleError(
          error,
          'No se pudo actualizar los incidentes.',
        ),
      ),
    );
  }

  // *********************************************************
  // 5. CONSULTAR INCIDENTES POR FECHA
  // *********************************************************
  getIncidenciasByFecha(filters: IncidenciasByFechaFilters): Observable<GetIncidentesByFechaResponse> {

    const params = HttpServiceHelper.buildHttpParams(filters);
    const headers = this.getJsonHeaders();

    return this.http.get<GetIncidentesByFechaResponse>(
      this.API_GET_INCIDENCIAS_BY_FECHA,
      { params, headers }
    ).pipe(
      catchError((error) => HttpServiceHelper
        .handleError(
          error,
          'No se pudo obtener los incidentes por fecha.',
        ),
      ),
    );
  }

  // *********************************************************
  // 6. CONSULTAR POR USUARIO ID
  // *********************************************************
  getIncidenciasByUsuario(
    usuarioId: number,
    filters: IncidenciasByUsuarioFilters = {}): Observable<GetIncidenciasByUsuarioIdResponse> {
    const params = HttpServiceHelper.buildHttpParams(filters);
    const headers = this.getJsonHeaders();
    return this.http.get<GetIncidenciasByUsuarioIdResponse>(
      `${this.API_GET_INCIDENCIAS_BY_USUARIO_ID}${usuarioId}`,
      { params, headers }
    ).pipe(
      catchError((error) => HttpServiceHelper
        .handleError(
          error,
          'No se pudo obtener los incidentes por usuario.',
        ),
      ),
    );
  }

  // *********************************************************
  // 7. CONSULTAR POR PATRULLAJE ID
  // *********************************************************
  getIncidenciasByPatrullaje(
    patrullajeId: number,
    filters: IncidenciasByPatrullajeFilters = {}
  ): Observable<GetIncidenciasByPatrullajeIdResponse> {
    const params = HttpServiceHelper.buildHttpParams(filters);
    const headers = this.getJsonHeaders();

    return this.http.get<GetIncidenciasByPatrullajeIdResponse>(
      `${this.API_GET_INCIDENCIAS_BY_PATRULLAJE_ID}${patrullajeId}`,
      { params, headers }
    ).pipe(
      catchError((error) =>
        HttpServiceHelper.handleError(
          error,
          'No se pudo obtener los incidentes por patrullaje.',
        ),
      ),
    );
  }

  // *********************************************************
  // 8. CONSULTAR POR ZONA ID
  // *********************************************************
  getIncidenciasByZona(
    zonaId: number,
    filters: IncidenciasByZonaFilters = {}
  ): Observable<GetIncidenciasByZonasIdResponse> {
    const params = HttpServiceHelper.buildHttpParams(filters);
    const headers = this.getJsonHeaders();

    return this.http.get<GetIncidenciasByZonasIdResponse>(
      `${this.API_GET_INCIDENCIAS_BY_ZONA_ID}${zonaId}`,
      { params, headers }
    ).pipe(
      catchError((error) =>
        HttpServiceHelper.handleError(
          error,
          'No se pudo obtener los incidentes por zona.',
        ),
      ),
    );
  }

  // *********************************************************
  // 9. OBTENER ARCHIVOS DE INCIDENCIA
  // *********************************************************
  getArchivosIncidencia(
    incidenciaId: number
  ): Observable<GetArchivosIncidenciaResponse> {
    const headers = this.getJsonHeaders();

    return this.http.get<GetArchivosIncidenciaResponse>(
      `${this.API_GET_ARCHIVOS_INCIDENCIA}${incidenciaId}/archivos`,
      { headers }
    ).pipe(
      catchError((error) =>
        HttpServiceHelper.handleError(
          error,
          'No se pudo obtener los archivos del incidente.',
        ),
      ),
    );
  }

  // *********************************************************
  // 10. SERENOS PAGINADOS CON TOTAL DE INCIDENCIAS
  // *********************************************************
  getSerenosIncidenciasPaginated(
    filtros: SerenosIncidenciasPaginatedQueryParams = {},
  ): Observable<SerenosIncidenciasPaginatedResponse> {
    const params = HttpServiceHelper.buildHttpParams(filtros);

    return this.http
      .get<SerenosIncidenciasPaginatedResponse>(
        this.API_GET_SERENOS_INCIDENCIAS_PAGINATED,
        {
          headers: this.getJsonHeaders(),
          params,
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener los serenos con incidencias.',
          ),
        ),
      );
  }

  // *********************************************************
  // HEADERS JSON
  // *********************************************************
  private getJsonHeaders(): HttpHeaders {
    return HttpServiceHelper.getHeaders({
      token: this.authStorage.getAccessToken(),
    });
  }
}
