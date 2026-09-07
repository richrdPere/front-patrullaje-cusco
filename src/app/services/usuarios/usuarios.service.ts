import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable } from 'rxjs';

// Environment
import { environment } from '@environments/environment';

// Helpers
import { HttpServiceHelper } from 'src/app/pages/shared/services/http-service.helper';

// Services
import { AuthStorageService } from 'src/app/pages/shared/services/auth-storage.service';

// Interfaces
import { CrearUsuarioRequest, CrearUsuarioResponse } from 'src/app/interfaces/usuarios/create-usuario.model';
import { updateUsuarioRequest, UpdateUsuarioResponse } from 'src/app/interfaces/usuarios/update-usuario.model';
import { UsuariosPaginatedQueryParams, UsuariosPaginatedResponse } from 'src/app/interfaces/usuarios/get-usuarios-paginated.model';
import { UsuarioDetailResponse } from 'src/app/interfaces/usuarios/usuario-detalle.model';
import { EstadoUsuarioResponse } from 'src/app/interfaces/usuarios/usuario-estado.model';
import { SerenosConductoresResponse } from 'src/app/interfaces/usuarios/usuario-serenos-conductores.model';
import { ResetPasswordUsuarioResponse } from 'src/app/interfaces/usuarios/usuario-reset-password.model';


@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE: string = `${environment.main_url}usuarios`;

  private readonly API_NEW_USUARIO: string = `${this.API_BASE}/crear`;
  private readonly API_GET_ALL_USUARIOS: string = `${this.API_BASE}/serenos`;
  private readonly API_GET_USUARIOS_PAGINATED: string = `${this.API_BASE}/paginado`;
  private readonly API_GET_USUARIO_BY_ID: string = `${this.API_BASE}/detalle`;
  private readonly API_UPDATE_USUARIO: string = `${this.API_BASE}/editar`;
  private readonly API_DELETE_USUARIO: string = `${this.API_BASE}/eliminar`;
  private readonly API_CHANGE_STATE_USUARIO: string = `${this.API_BASE}/estado`;
  private readonly API_RESET_PASSWORD_USUARIO: string = `${this.API_BASE}/reset-password`;

  constructor(
    private readonly http: HttpClient,
    private readonly authStorage: AuthStorageService,
  ) { }

  // *********************************************************
  // 1. CREAR USUARIO
  // *********************************************************
  newUsuario(
    data: CrearUsuarioRequest,
  ): Observable<CrearUsuarioResponse> {
    return this.http
      .post<CrearUsuarioResponse>(
        this.API_NEW_USUARIO,
        data,
        {
          headers: this.getJsonHeaders(),
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo registrar el usuario.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. OBTENER SERENOS Y CONDUCTORES
  // *********************************************************
  getSerenosAndConductores():
    Observable<SerenosConductoresResponse> {
    return this.http
      .get<SerenosConductoresResponse>(
        this.API_GET_ALL_USUARIOS,
        {
          headers: this.getJsonHeaders(),
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener los serenos y conductores.',
          ),
        ),
      );
  }

  // *********************************************************
  // 3. LISTAR USUARIOS PAGINADOS
  // *********************************************************
  getUsuariosPaginados(
    filters: UsuariosPaginatedQueryParams,
  ): Observable<UsuariosPaginatedResponse> {
    const params = HttpServiceHelper.buildParams({
      page: filters.page,
      limit: filters.limit,
      nombres: filters.nombres,
      dni: filters.dni,
      rol: filters.rol,
    });

    return this.http.get<UsuariosPaginatedResponse>(
      this.API_GET_USUARIOS_PAGINATED,
      {
        headers: this.getJsonHeaders(),
        params,
      },
    )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudieron obtener los usuarios.',
          ),
        ),
      );
  }

  // *********************************************************
  // 4. OBTENER USUARIO POR ID
  // *********************************************************
  getUsuarioById(
    id: number,
  ): Observable<UsuarioDetailResponse> {
    return this.http
      .get<UsuarioDetailResponse>(
        `${this.API_GET_USUARIO_BY_ID}/${id}`,
        {
          headers: this.getJsonHeaders(),
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el usuario solicitado.',
          ),
        ),
      );
  }

  // *********************************************************
  // 5. ACTUALIZAR USUARIO
  // *********************************************************
  updateUsuario(
    id: number,
    data: updateUsuarioRequest,
  ): Observable<UpdateUsuarioResponse> {
    return this.http
      .put<UpdateUsuarioResponse>(
        `${this.API_UPDATE_USUARIO}/${id}`,
        data,
        {
          headers: this.getJsonHeaders(),
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo actualizar el usuario.',
          ),
        ),
      );
  }

  // *********************************************************
  // 6. ELIMINAR USUARIO
  // *********************************************************
  deleteUsuario(
    id: number,
  ): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(
        `${this.API_DELETE_USUARIO}/${id}`,
        {
          headers: this.getJsonHeaders(),
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo eliminar el usuario.',
          ),
        ),
      );
  }

  // *********************************************************
  // 7. CAMBIAR ESTADO DEL USUARIO
  // *********************************************************
  changeStateUsuario(
    id: number,
    estado: boolean,
  ): Observable<EstadoUsuarioResponse> {
    return this.http
      .patch<EstadoUsuarioResponse>(
        `${this.API_CHANGE_STATE_USUARIO}/${id}`,
        {
          estado,
        },
        {
          headers: this.getJsonHeaders(),
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo cambiar el estado del usuario.',
          ),
        ),
      );
  }


  // *********************************************************
  // 8. RESETEAR PASSWORD DEL USUARIO
  // *********************************************************
  resetPasswordUsuario(
    id: number,
  ): Observable<ResetPasswordUsuarioResponse> {
    return this.http
      .patch<ResetPasswordUsuarioResponse>(
        `${this.API_RESET_PASSWORD_USUARIO}/${id}`,
        null,
        {
          headers: this.getJsonHeaders(),
        },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo cambiar el estado del usuario.',
          ),
        ),
      );
  }

  // *********************************************************
  // HEADERS PRIVADOS
  // *********************************************************
  private getJsonHeaders(): HttpHeaders {
    return HttpServiceHelper.getHeaders({
      token: this.authStorage.getAccessToken(),
    });
  }
}

// import { Injectable } from '@angular/core';
// import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
// import { Observable } from 'rxjs';

// // Environment
// import { environment } from '@environments/environment';

// // Interfaces
// import { ApiResponse } from '../../pages/shared/interfaces/api-response';
// import { PaginadoResponse } from '../../pages/shared/interfaces/paginado-response';

// import {
//   Usuario,
//   UsuarioListResponse,
//   UsuarioDetalleResponse,
//   CrearUsuarioResponse,
//   UpdateUsuarioResponse,
//   EstadoUsuarioResponse,
//   SerenosConductoresResponse
// } from '../../interfaces/login/usuarioResponse';

// @Injectable({
//   providedIn: 'root'
// })
// export class UsuarioService {

//   // 1. Environment
//   envs = environment;

//   // 2. Variables globales
//   API_BASE = this.envs.main_url + 'usuarios';

//   API_NEW_USUARIO: string = this.API_BASE + '/crear';
//   API_GET_ALL_USUARIOS: string = this.API_BASE + '/serenos';
//   API_GET_USUARIOS_PAGINATED: string = this.API_BASE + '/paginado';
//   API_GET_USUARIO_BY_ID: string = this.API_BASE + '/detalle/';
//   API_UPDATE_USUARIO: string = this.API_BASE + '/editar/';
//   API_DELETE_USUARIO: string = this.API_BASE + '/eliminar/';
//   API_CHANGE_STATE_USUARIO: string = this.API_BASE + '/estado/';

//   constructor(private http: HttpClient) { }

//   // ======= HEADER CON TOKEN =======
//   private getAuthHeaders(): { headers: HttpHeaders } {
//     const token = localStorage.getItem('token'); // o sessionStorage según tu login
//     let headers = new HttpHeaders({
//       'Content-Type': 'application/json',
//     });

//     if (token) {
//       headers = headers.set('Authorization', `Bearer ${token}`);
//     }

//     return { headers };
//   }

//   // =========================================================
//   // 1. Crear usuario
//   // =========================================================
//   newUsuario(data: any): Observable<CrearUsuarioResponse> {
//     return this.http.post<CrearUsuarioResponse>(this.API_NEW_USUARIO, data, this.getAuthHeaders());
//   }

//   // =========================================================
//   // 2. Obtener todos los serenos y conductores
//   // =========================================================
//   getSerenosAndConductores(): Observable<SerenosConductoresResponse> {
//     return this.http.get<SerenosConductoresResponse>(`${this.API_GET_ALL_USUARIOS}`, this.getAuthHeaders());
//   }

//   // =========================================================
//   // 3. Listar usuarios (paginado + buscador)
//   // =========================================================
//   getUsuariosPaginados(
//     filters: {
//       page?: number;
//       limit?: number;
//       nombres?: string;
//       dni?: string;
//       rol?: string;
//     }
//   ): Observable<ApiResponse<PaginadoResponse<Usuario>>> {

//     let params = new HttpParams()
//     Object.entries(filters).forEach(([key, value]) => {
//       if (value !== null && value !== undefined && value !== '') {
//         params = params.set(key, value.toString());
//       }
//     });

//     return this.http.get<ApiResponse<PaginadoResponse<Usuario>>>(this.API_GET_USUARIOS_PAGINATED, { params, ...this.getAuthHeaders() });
//   }

//   // =========================================================
//   // 4. Obtener usuario por ID
//   // =========================================================
//   getUsuarioById(id: number): Observable<ApiResponse<UsuarioDetalleResponse>> {
//     return this.http.get<ApiResponse<UsuarioDetalleResponse>>(`${this.API_GET_USUARIO_BY_ID}${id}`, this.getAuthHeaders());
//   }

//   // =========================================================
//   // 5. Actualizar usuario
//   // =========================================================
//   updateUsuario(id: number, data: any): Observable<UpdateUsuarioResponse> {
//     return this.http.put<UpdateUsuarioResponse>(`${this.API_UPDATE_USUARIO}${id}`, data, this.getAuthHeaders());
//   }

//   // =========================================================
//   // 6. Eliminar usuario
//   // =========================================================
//   deleteUsuario(id: number): Observable<{ message: string }> {
//     return this.http.delete<{ message: string }>(`${this.API_DELETE_USUARIO}${id}`, this.getAuthHeaders());
//   }

//   // =========================================================
//   // 7. Cambiar estado usuario
//   // =========================================================
//   changeStateUsuario(id: number, estado: boolean): Observable<EstadoUsuarioResponse> {
//     return this.http.patch<EstadoUsuarioResponse>(
//       `${this.API_CHANGE_STATE_USUARIO}${id}`,
//       { estado },
//       this.getAuthHeaders()
//     );
//   }



// }
