import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable } from 'rxjs';

//Environment
import { environment } from '@environments/environment';

// Helpers
import { HttpServiceHelper } from 'src/app/pages/shared/services/http-service.helper';

// Services
import { AuthStorageService } from 'src/app/pages/shared/services/auth-storage.service';

// Interfaces
import { CreateZonaRequest, CreateZonaResponse } from 'src/app/interfaces/zona/create-zona.model';
import { GetZonasPaginatedParams, GetZonasPaginatedResponse } from 'src/app/interfaces/zona/get-zonas-paginated.model';
import { GetZonasSelectParams, GetZonasSelectResponse } from 'src/app/interfaces/zona/get-zonas-select.model';
import { GetZonaByIdResponse } from 'src/app/interfaces/zona/get-zona-by-id.model';
import { UpdateZonaRequest, UpdateZonaResponse } from 'src/app/interfaces/zona/update-zona.model';
import { DeleteZonaResponse } from 'src/app/interfaces/zona/delete-zona.model';

@Injectable({ providedIn: 'root' })
export class ZonaService {
  obtenerZonas() {
    throw new Error('Method not implemented.');
  }

  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE: string = environment.main_url + 'zonas';

  private readonly API_GET_ZONAS_PAGINATED: string = this.API_BASE + '/paginado';
  private readonly API_GET_ZONAS_SELECT: string = this.API_BASE + '/select';
  private readonly API_CREATE_ZONA: string = this.API_BASE + '/crear';
  private readonly API_UPDATE_ZONA: string = this.API_BASE + '/editar/';
  private readonly API_GET_ZONA_POR_ID: string = this.API_BASE + '/detalle/';
  private readonly API_DELETE_ZONA: string = this.API_BASE + '/eliminar/';

  constructor(
    private readonly http: HttpClient,
    private readonly authStorageService: AuthStorageService,
  ) { }

  // *********************************************************
  // 1.- CREAR ZONA
  // *********************************************************
  createZona(data: CreateZonaRequest): Observable<CreateZonaResponse> {
    return this.http
      .post<CreateZonaResponse>(
        this.API_CREATE_ZONA,
        data,
        {
          headers: this.getJsonHeaders(),
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo registrar la zona.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. OBTENER ZONAS PAGINADAS
  // *********************************************************
  getZonasPaginated(filters: GetZonasPaginatedParams): Observable<GetZonasPaginatedResponse> {
    const params = HttpServiceHelper.buildParams({
      page: filters.page,
      limit: filters.limit,
      search: filters.search,
      nombre: filters.nombre,
      descripcion: filters.descripcion,
      riesgo: filters.riesgo,
      estado: filters.estado,
    });

    return this.http
      .get<GetZonasPaginatedResponse>(
        this.API_GET_ZONAS_PAGINATED,
        {
          headers: this.getJsonHeaders(),
          params,
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener las zonas.',
          ),
        ),
      );
  }

  // *********************************************************
  // 3. OBTENER ZONAS PARA SELECT
  // *********************************************************
  getZonasSelect(filters: GetZonasSelectParams): Observable<GetZonasSelectResponse> {
    const params = HttpServiceHelper.buildParams({
      search: filters.search,
      riesgo: filters.riesgo,
    });

    return this.http
      .get<GetZonasSelectResponse>(
        this.API_GET_ZONAS_SELECT,
        {
          headers: this.getJsonHeaders(),
          params,
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener las zonas disponibles.',
          ),
        ),
      );
  }

  // *********************************************************
  // 4. OBTENER ZONA POR ID
  // *********************************************************
  getZonaById(id: number): Observable<GetZonaByIdResponse> {
    return this.http
      .get<GetZonaByIdResponse>(
        `${this.API_GET_ZONA_POR_ID}${id}`,
        {
          headers: this.getJsonHeaders(),
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener la zona.',
          ),
        ),
      );
  }

  // *********************************************************
  // 5. ACTUALIZAR ZONA
  // *********************************************************
  updateZona(id: number, data: UpdateZonaRequest): Observable<UpdateZonaResponse> {
    return this.http
      .put<UpdateZonaResponse>(
        `${this.API_UPDATE_ZONA}${id}`,
        data,
        {
          headers: this.getJsonHeaders(),
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo actualizar la zona.',
          ),
        ),
      );
  }

  // *********************************************************
  // 6. ELIMINAR ZONA LOGICAMENTE
  // *********************************************************
  deleteZona(id: number): Observable<DeleteZonaResponse> {
    return this.http
      .delete<DeleteZonaResponse>(
        `${this.API_DELETE_ZONA}${id}`,
        {
          headers: this.getJsonHeaders(),
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo eliminar la zona.',
          ),
        ),
      );
  }

  // *********************************************************
  // HEADERS PRIVADOS
  // *********************************************************
  private getJsonHeaders(): HttpHeaders {
    return HttpServiceHelper.getHeaders({
      token: this.authStorageService.getAccessToken(),
    });
  }
}
