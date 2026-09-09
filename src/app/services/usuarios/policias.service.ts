import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';

// Environment
import { environment } from 'src/environments/environment';

// Helpers
import { HttpServiceHelper } from 'src/app/pages/shared/services/http-service.helper';

// Services
import { AuthStorageService } from 'src/app/pages/shared/services/auth-storage.service';

// Interfaces
import { GetPoliciaByIdResponse } from 'src/app/interfaces/policia/detail-policia.model';
import { PoliciasPaginadoParams, PoliciasPaginadoResponse } from 'src/app/interfaces/policia/get-policia-paginated.model';
import { PoliciasSelectResponse } from 'src/app/interfaces/policia/selected-policia.model';
import { EliminarPoliciaSuccessResponse } from 'src/app/interfaces/policia/delete-policia.model';
import { CambiarEstadoPoliciaRequest, CambiarEstadoPoliciaResponse } from 'src/app/interfaces/policia/change-policia.model';
import { CreartePoliciaRequest, CreatePoliciaResponse } from 'src/app/interfaces/policia/create-policia.model';
import { UpdatePoliciaRequest, UpdatePoliciaResponse } from 'src/app/interfaces/policia/update-policia.model';

@Injectable({
  providedIn: 'root'
})
export class PoliciasService {

  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE = environment.main_url + 'policias';

  private readonly API_NEW_POLICIA: string = this.API_BASE + '/crear';
  private readonly API_GET_POLICIAS_SELECT: string = this.API_BASE + '/select';
  private readonly API_GET_POLICIAS_PAGINATED: string = this.API_BASE + '/paginado';
  private readonly API_GET_POLICIA_BY_ID: string = this.API_BASE + '/detalle';
  private readonly API_UPDATE_POLICIA: string = this.API_BASE + '/editar';
  private readonly API_DELETE_POLICIA: string = this.API_BASE + '/eliminar';
  private readonly API_CHANGE_STATE_POLICIA: string = `${this.API_BASE}/estado`;

  constructor(
    private readonly http: HttpClient,
    private readonly authStorage: AuthStorageService,
  ) { }


  // *********************************************************
  // 1. CREAR POLICÍA
  // *********************************************************
  newPolicia(data: CreartePoliciaRequest): Observable<CreatePoliciaResponse> {
    return this.http
      .post<CreatePoliciaResponse>(
        this.API_NEW_POLICIA,
        data,
        {
          headers: this.getJsonHeaders(),
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo registrar el policía.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. OBTENER POLICÍAS PARA SELECTOR
  // *********************************************************
  getPoliciasSelect(): Observable<PoliciasSelectResponse> {
    return this.http
      .get<PoliciasSelectResponse>(
        this.API_GET_POLICIAS_SELECT,
        {
          headers: this.getJsonHeaders(),
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener la lista de policías.',
          ),
        ),
      );
  }

  // *********************************************************
  // 3. OBTENER POLICÍAS PAGINADOS
  // *********************************************************
  getPoliciasPaginated(filters: PoliciasPaginadoParams = {}): Observable<PoliciasPaginadoResponse> {
    const params = HttpServiceHelper.buildParams({
      page: filters.page,
      limit: filters.limit,
      nombres: filters.nombres,
      dni: filters.dni,
    });

    return this.http
      .get<PoliciasPaginadoResponse>(
        this.API_GET_POLICIAS_PAGINATED,
        {
          headers: this.getJsonHeaders(),
          params,
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener la lista de policías.',
          ),
        ),
      );
  }

  // *********************************************************
  // 4. OBTENER POLICÍA POR ID
  // *********************************************************
  getPoliciaById(id: number): Observable<GetPoliciaByIdResponse> {
    return this.http
      .get<GetPoliciaByIdResponse>(
        `${this.API_GET_POLICIA_BY_ID}/${id}`,
        {
          headers: this.getJsonHeaders(),
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener la información del policía.',
          ),
        ),
      );
  }

  // *********************************************************
  // 5. ACTUALIZAR POLICÍA
  // *********************************************************
  updatePolicia(id: number, data: UpdatePoliciaRequest): Observable<UpdatePoliciaResponse> {
    return this.http
      .put<UpdatePoliciaResponse>(
        `${this.API_UPDATE_POLICIA}/${id}`,
        data,
        {
          headers: this.getJsonHeaders(),
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo actualizar el policía.',
          ),
        ),
      );
  }

  // *********************************************************
  // 6. ELIMINAR POLICÍA
  // *********************************************************
  deletePolicia(id: number): Observable<EliminarPoliciaSuccessResponse> {
    return this.http
      .delete<EliminarPoliciaSuccessResponse>(
        `${this.API_DELETE_POLICIA}/${id}`,
        {
          headers: this.getJsonHeaders(),
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo eliminar el policía.',
          ),
        ),
      );
  }

  // *********************************************************
  // 7. CAMBIAR ESTADO DEL POLICÍA
  // *********************************************************
  changePoliciaEstado(
    id: number,
    data: CambiarEstadoPoliciaRequest,
  ): Observable<CambiarEstadoPoliciaResponse> {
    return this.http
      .patch<CambiarEstadoPoliciaResponse>(
        `${this.API_CHANGE_STATE_POLICIA}/${id}`,
        data,
        {
          headers: this.getJsonHeaders(),
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo cambiar el estado del policía.',
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
