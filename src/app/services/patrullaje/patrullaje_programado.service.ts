import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable } from 'rxjs';

//Environment
import { environment } from '@environments/environment';

// Helpers
import { HttpServiceHelper } from 'src/app/pages/shared/services/http-service.helper';

// Services
import { AuthStorageService } from 'src/app/pages/shared/services/auth-storage.service';

// Interface
import { CreatePatrullajeProgramadoRequest, CreatePatrullajeProgramadoResponse } from 'src/app/interfaces/patrullaje_programado/create-patrullaje-programado.model';
import { GetPatrullajesAllParams, GetPatrullajesAllResponse } from 'src/app/interfaces/patrullaje_programado/get-patrullajes-all.model';
import { GetPatrullajesPaginatedParams, GetPatrullajesPaginatedResponse } from 'src/app/interfaces/patrullaje_programado/get-patrullajes-paginated.model';
import { GetPatrullajeByIdResponse } from 'src/app/interfaces/patrullaje_programado/get-patrullaje-by-id.model';
import { UpdatePatrullajeProgramadoRequest, UpdatePatrullajeProgramadoResponse } from 'src/app/interfaces/patrullaje_programado/update-patrullaje-programado.model';
import { DeletePatrullajeProgramadoResponse } from 'src/app/interfaces/patrullaje_programado/delete-patrullaje-programado.model';
import { GetRecorridoPatrullajeResponse } from 'src/app/interfaces/patrullaje_programado/get-recorrido-patrullaje.model';
import { FinishPatrullajeProgramadoResponse } from 'src/app/interfaces/patrullaje_programado/finish-patrullaje-programado.model';

@Injectable({ providedIn: 'root' })
export class PatrullajeProgramadoService {

  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE = environment.main_url + 'patrullaje-programado';

  private readonly API_NEW_PATRULLAJE: string = this.API_BASE + '/crear';
  private readonly API_GET_PATRULLAJES_ALL: string = this.API_BASE + '/todos';
  private readonly API_GET_PATRULLAJES_PAGINATED: string = this.API_BASE + '/paginado';
  private readonly API_GET_PATRULLAJE_BY_ID: string = this.API_BASE + '/detalle/';
  private readonly API_UPDATE_PATRULLAJE: string = this.API_BASE + '/editar/';
  private readonly API_DELETE_PATRULLAJE: string = this.API_BASE + '/eliminar/';
  private readonly API_GET_PATRULLAJE_RECORRIDO: string = this.API_BASE + '/recorrido/';
  private readonly API_PATCH_FINALIZAR_PATRULLAJE: string = this.API_BASE + '/finalizar/';

  constructor(
    private readonly http: HttpClient,
    private readonly authStorage: AuthStorageService
  ) { }


  // *********************************************************
  // 1. CREAR PATRULLAJE PROGRAMADO
  // *********************************************************
  newPatrullajeProgramado(data: CreatePatrullajeProgramadoRequest): Observable<CreatePatrullajeProgramadoResponse> {
    return this.http
      .post<CreatePatrullajeProgramadoResponse>(
        this.API_NEW_PATRULLAJE,
        data,
        {
          headers: this.getJsonHeaders(),
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo programar el patrullaje.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. OBTENER TODOS LOS PATRULLAJES
  // *********************************************************
  getPatrullajesAll(filters: GetPatrullajesAllParams = {}): Observable<GetPatrullajesAllResponse> {
    const params = HttpServiceHelper.buildParams({
      fecha: filters.fecha,
      fecha_desde: filters.fecha_desde,
      fecha_hasta: filters.fecha_hasta,
      estado: filters.estado,
      zona_id: filters.zona_id,
      unidad_id: filters.unidad_id,
    });

    return this.http.get<GetPatrullajesAllResponse>(
      this.API_GET_PATRULLAJES_ALL,
      {
        headers: this.getJsonHeaders(),
        params,
      },
    )
      .pipe(
        catchError(
          (error) =>
            HttpServiceHelper.handleError(
              error,
              'No se pudieron obtener los patrullajes.',
            ),
        ),
      );
  }

  // *********************************************************
  // 3. OBTENER PATRULLAJES PAGINADOS
  // *********************************************************
  getPatrullajesPaginated(filters: GetPatrullajesPaginatedParams = {}): Observable<GetPatrullajesPaginatedResponse> {
    const params = HttpServiceHelper.buildParams({
      page: filters.page,
      limit: filters.limit,
      fecha: filters.fecha,
      descripcion: filters.descripcion,
      estado: filters.estado,
      tipo_patrullaje: filters.tipo_patrullaje,
      modalidad_patrullaje: filters.modalidad_patrullaje,
      zona_id: filters.zona_id,
      unidad_id: filters.unidad_id,
    });

    return this.http.get<GetPatrullajesPaginatedResponse>(
      this.API_GET_PATRULLAJES_PAGINATED,
      {
        headers:
          this.getJsonHeaders(),

        params,
      },
    )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener los patrullajes.',
          ),
        ),
      );
  }

  // *********************************************************
  // 4. OBTENER PATRULLAJE POR ID
  // *********************************************************
  getPatrullajeProgramadoById(id: number): Observable<GetPatrullajeByIdResponse> {
    return this.http
      .get<GetPatrullajeByIdResponse>(
        `${this.API_GET_PATRULLAJE_BY_ID}${id}`,
        {
          headers:
            this.getJsonHeaders(),
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el patrullaje.',
          ),
        ),
      );
  }

  // *********************************************************
  // 5. ACTUALIZAR PATRULLAJE PROGRAMADO
  // *********************************************************
  updatePatrullajeProgramado(
    id: number,
    data: UpdatePatrullajeProgramadoRequest,
  ): Observable<UpdatePatrullajeProgramadoResponse> {
    return this.http
      .put<UpdatePatrullajeProgramadoResponse>(
        `${this.API_UPDATE_PATRULLAJE}${id}`,
        data,
        {
          headers: this.getJsonHeaders(),
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo actualizar el patrullaje.',
          ),
        ),
      );
  }

  // *********************************************************
  // 6. ELIMINAR PATRULLAJE PROGRAMADO
  // *********************************************************
  deletePatrullajeProgramado(id: number): Observable<DeletePatrullajeProgramadoResponse> {
    return this.http
      .delete<DeletePatrullajeProgramadoResponse>(
        `${this.API_DELETE_PATRULLAJE}${id}`,
        {
          headers: this.getJsonHeaders(),
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo eliminar el patrullaje.',
          ),
        ),
      );
  }

  // *********************************************************
  // 7. OBTENER RECORRIDO DEL PATRULLAJE
  // *********************************************************
  getRecorridoPatrullajeProgramado(
    patrullajeId: number,
  ): Observable<GetRecorridoPatrullajeResponse> {
    return this.http
      .get<GetRecorridoPatrullajeResponse>(
        `${this.API_GET_PATRULLAJE_RECORRIDO}${patrullajeId}`,
        {
          headers: this.getJsonHeaders(),
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el recorrido del patrullaje.',
          ),
        ),
      );
  }

  // *********************************************************
  // 8. FINALIZAR PATRULLAJE PROGRAMADO
  // *********************************************************
  finishPatrullajeProgramado(id: number): Observable<FinishPatrullajeProgramadoResponse> {
    return this.http
      .patch<FinishPatrullajeProgramadoResponse>(
        `${this.API_PATCH_FINALIZAR_PATRULLAJE}${id}`,
        {},
        {
          headers: this.getJsonHeaders(),
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo finalizar el patrullaje.',
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
