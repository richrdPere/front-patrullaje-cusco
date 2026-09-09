import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';

// Environment
import { environment } from 'src/environments/environment';

// Helpers
import { HttpServiceHelper } from 'src/app/pages/shared/services/http-service.helper';

// Services
import { AuthStorageService } from 'src/app/pages/shared/services/auth-storage.service';

// Interfaces
import { GetUnidadesPaginatedParams, GetUnidadesPaginatedResponse, UltimoCodigoResponse } from 'src/app/interfaces/unidad-patrullaje/get-unidades-paginated.model';
import { GetUnidadByIdResponse } from 'src/app/interfaces/unidad-patrullaje/get-unidad-by-id.model';
import { CreateUnidadPatrullajeRequest, CreateUnidadPatrullajeResponse } from 'src/app/interfaces/unidad-patrullaje/create-unidad-patrullaje.model';
import { UpdateUnidadPatrullajeRequest, UpdateUnidadPatrullajeResponse } from 'src/app/interfaces/unidad-patrullaje/update-unidad-patrullaje.model';
import { DeleteUnidadPatrullajeResponse } from 'src/app/interfaces/unidad-patrullaje/delete-unidad-patrullaje.model';
import { GetUnidadesSelectResponse } from 'src/app/interfaces/unidad-patrullaje/get-unidades-select.model';


@Injectable({
  providedIn: 'root'
})
export class UnidadPatrullajeService {

  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE = environment.main_url + 'unidad-patrullaje';

  private readonly API_CREATE_UNIDAD: string = this.API_BASE + '/crear';
  private readonly API_GET_ULTIMO_CODIGO: string = this.API_BASE + '/codigo';
  private readonly API_GET_UNIDADES_PAGINATED: string = this.API_BASE + '/paginado';
  private readonly API_GET_UNIDAD_BY_ID: string = this.API_BASE + '/detalle/';
  private readonly API_UPDATE_UNIDAD: string = this.API_BASE + '/editar/';
  private readonly API_DELETE_UNIDAD: string = this.API_BASE + '/eliminar/';
  private readonly API_GET_UNIDADES_SELECT: string = this.API_BASE + '/select';

  constructor(
    private readonly http: HttpClient,
    private readonly authStorage: AuthStorageService,
  ) { }


  // *********************************************************
  // 1. OBTENER UNIDADES PAGINADAS
  // *********************************************************
  getUnidadesPaginated(filters: GetUnidadesPaginatedParams = {}): Observable<GetUnidadesPaginatedResponse> {
    const params = HttpServiceHelper.buildParams({
      page: filters.page,
      limit: filters.limit,
      search: filters.search,
      codigo: filters.codigo,
      tipo: filters.tipo,
      placa: filters.placa,
      estado: filters.estado,
      descripcion: filters.descripcion,
    });

    return this.http.get<GetUnidadesPaginatedResponse>(
      this.API_GET_UNIDADES_PAGINATED,
      {
        headers: this.getJsonHeaders(),
        params,
      },
    )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener las unidades de patrullaje.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. OBTENER UNIDAD POR ID
  // *********************************************************
  getUnidadById(id: number): Observable<GetUnidadByIdResponse> {
    return this.http.get<GetUnidadByIdResponse>(
      `${this.API_GET_UNIDAD_BY_ID}${id}`,
      {
        headers: this.getJsonHeaders(),
      },
    )
      .pipe(
        catchError((error) => HttpServiceHelper
          .handleError(
            error,
            'No se pudo obtener la unidad de patrullaje.',
          ),
        ),
      );
  }

  // *********************************************************
  // 3. CREAR UNIDAD DE PATRULLAJE
  // *********************************************************
  newUnidadPatrullaje(data: CreateUnidadPatrullajeRequest): Observable<CreateUnidadPatrullajeResponse> {
    return this.http
      .post<CreateUnidadPatrullajeResponse>(
        this.API_CREATE_UNIDAD,
        data,
        {
          headers: this.getJsonHeaders(),
        },
      )
      .pipe(
        catchError((error) => HttpServiceHelper
          .handleError(
            error,
            'No se pudo registrar la unidad de patrullaje.',
          ),
        ),
      );
  }

  // *********************************************************
  // 4. ACTUALIZAR UNIDAD DE PATRULLAJE
  // *********************************************************
  updateUnidadPatrullaje(
    id: number,
    data: UpdateUnidadPatrullajeRequest,
  ): Observable<UpdateUnidadPatrullajeResponse> {
    return this.http
      .put<UpdateUnidadPatrullajeResponse>(
        `${this.API_UPDATE_UNIDAD}${id}`,
        data,
        {
          headers: this.getJsonHeaders(),
        },
      )
      .pipe(
        catchError((error) => HttpServiceHelper
          .handleError(
            error,
            'No se pudo actualizar la unidad de patrullaje.',
          ),
        ),
      );
  }

  // *********************************************************
  // 5. ELIMINAR UNIDAD DE PATRULLAJE
  // *********************************************************
  deleteUnidadPatrullaje(id: number): Observable<DeleteUnidadPatrullajeResponse> {
    return this.http
      .delete<DeleteUnidadPatrullajeResponse>(
        `${this.API_DELETE_UNIDAD}${id}`,
        {
          headers: this.getJsonHeaders(),
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo eliminar la unidad de patrullaje.',
          ),
        ),
      );
  }

  // *********************************************************
  // 6. OBTENER ULTIMO CODIGO
  // *********************************************************
  getUltimoCodigo(): Observable<UltimoCodigoResponse> {
    return this.http
      .get<UltimoCodigoResponse>(
        this.API_GET_ULTIMO_CODIGO,
        {
          headers: this.getJsonHeaders(),
        },
      ).pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el codigo.',
          ),
        ),
      );
  }

  // *********************************************************
  // 7. OBTENER UNIDADES PARA SELECT
  // *********************************************************
  getUnidadesSelect(): Observable<GetUnidadesSelectResponse> {
    return this.http
      .get<GetUnidadesSelectResponse>(
        this.API_GET_UNIDADES_SELECT,
        {
          headers: this.getJsonHeaders(),
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener las unidades disponibles.',
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
