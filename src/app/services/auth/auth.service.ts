import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { BehaviorSubject, Observable, finalize, tap } from 'rxjs';

import { JwtHelperService } from '@auth0/angular-jwt';

// Services
import { SocketService } from '../socket.service';
import { MapaTrackingService } from '../mapa-tracking/mapa-tracking.service';

// Environment
import { environment } from '@environments/environment';

// Interfaces
import { LoginRequest, } from '../../interfaces/login/login-request';
import { LogoutResponse } from '../../interfaces/login/logout-response';
import { Usuario } from 'src/app/interfaces/login/usuarioResponse';
import { LoginResponse } from 'src/app/interfaces/login/loginResponse';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  // =========================================================
  // API
  // =========================================================
  API_BASE = `${environment.main_url}auth`;

  API_LOGIN = `${this.API_BASE}/login`;
  API_LOGOUT = `${this.API_BASE}/logout`;
  API_REFRESH = `${this.API_BASE}/refresh`;
  API_CONFIRMAR = `${this.API_BASE}/confirmar`;
  API_RECUPERAR = `${this.API_BASE}/recuperar`;
  API_RESET_PASSWORD = `${this.API_BASE}/reset-password`;

  // =========================================================
  // STORAGE KEYS
  // =========================================================
  private readonly ACCESS_TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly USER_KEY = 'usuario';
  private readonly ROLES_KEY = 'roles';
  private readonly SESSION_KEY = 'sesion';
  private readonly EXPIRES_IN_KEY = 'expiresIn';

  private readonly jwtHelper = new JwtHelperService();

  // =========================================================
  // ESTADO DEL USUARIO
  // =========================================================
  private readonly currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly socketService: SocketService,
    private readonly mapaTrackingService:
      MapaTrackingService,
  ) {
    this.restoreSession();
  }

  // =========================================================
  // LOGIN
  // =========================================================

  login(request: LoginRequest): Observable<LoginResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    return this.http.post<LoginResponse>(this.API_LOGIN, request, { headers },
    ).pipe(
      tap((response) => {
        const {
          accessToken,
          refreshToken,
          expiresIn,
          sesion,
          roles,
          usuario,
        } = response.data;

        const usuarioCompleto: Usuario = {
          ...usuario,
          roles,
        };

        this.saveSession({
          accessToken,
          refreshToken,
          usuario: usuarioCompleto,
          sesion,
          expiresIn,
        });

        this.currentUserSubject.next(usuarioCompleto);

        // El socket utilizará el nuevo access token.
        this.socketService.reconnect();
      }),
    );
  }

  // =========================================================
  // LOGOUT
  // =========================================================
  logout(): Observable<LogoutResponse> {
    const refreshToken = this.getRefreshToken();

    return this.http.post<LogoutResponse>(
      this.API_LOGOUT,
      {
        refreshToken,
      },
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
        }),
      },
    ).pipe(
      /*
       * Se ejecuta tanto si el backend responde correctamente
       * como si ocurre un error de red.
       */
      finalize(() => {
        this.closeLocalSession();
      }),
    );
  }

  // =========================================================
  // CONFIRMAR CUENTA
  // =========================================================
  confirmarCuenta(token: string): Observable<unknown> {
    return this.http.get(
      `${this.API_CONFIRMAR}/${encodeURIComponent(token)}`,
    );
  }

  // =========================================================
  // RECUPERAR CUENTA
  // =========================================================
  recuperarCuenta(username: string): Observable<unknown> {
    return this.http.post(this.API_RECUPERAR, {
      username,
    });
  }

  // =========================================================
  // RESTABLECER CONTRASEÑA
  // =========================================================
  resetPassword(token: string, nuevaPassword: string): Observable<unknown> {
    return this.http.put(
      `${this.API_RESET_PASSWORD}/${encodeURIComponent(token)}`,
      {
        nuevaPassword,
      },
    );
  }

  // =========================================================
  // RESTAURAR SESIÓN
  // =========================================================
  private restoreSession(): void {
    const accessToken = this.getAccessToken();
    const savedUser = localStorage.getItem(this.USER_KEY);

    if (!accessToken || !savedUser) {
      this.clearStorage();
      return;
    }

    /*
     * Mientras no esté implementado el endpoint /refresh,
     * una sesión con access token vencido se elimina.
     */
    if (this.jwtHelper.isTokenExpired(accessToken)) {
      this.clearStorage();
      return;
    }

    try {
      const usuario =
        JSON.parse(savedUser) as Usuario;

      this.currentUserSubject.next(usuario);

      this.socketService.connect();
    } catch (error) {
      console.error(
        'No se pudo restaurar la sesión:',
        error,
      );

      this.clearStorage();
    }
  }

  // =========================================================
  // GUARDAR SESIÓN
  // =========================================================
  private saveSession(data: {
    accessToken: string;
    refreshToken: string;
    usuario: Usuario;
    sesion: LoginResponse['data']['sesion'];
    expiresIn: LoginResponse['data']['expiresIn'];
  }): void {
    localStorage.setItem(
      this.ACCESS_TOKEN_KEY,
      data.accessToken,
    );

    localStorage.setItem(
      this.REFRESH_TOKEN_KEY,
      data.refreshToken,
    );

    localStorage.setItem(
      this.USER_KEY,
      JSON.stringify(data.usuario),
    );

    localStorage.setItem(
      this.ROLES_KEY,
      JSON.stringify(data.usuario.roles),
    );

    localStorage.setItem(
      this.SESSION_KEY,
      JSON.stringify(data.sesion),
    );

    localStorage.setItem(
      this.EXPIRES_IN_KEY,
      JSON.stringify(data.expiresIn),
    );
  }

  // =========================================================
  // CERRAR SESIÓN LOCAL
  // =========================================================
  private closeLocalSession(): void {
    this.socketService.disconnect();

    this.mapaTrackingService.limpiarTodo();

    this.clearStorage();
  }

  private clearStorage(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.ROLES_KEY);
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.EXPIRES_IN_KEY);

    /*
     * Se elimina la clave antigua por compatibilidad
     * con la versión anterior de AuthService.
     */
    localStorage.removeItem('token');

    this.currentUserSubject.next(null);
  }

  // =========================================================
  // GETTERS
  // =========================================================
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Alias para mantener compatibilidad con interceptores
   * o guards que todavía utilizan getToken().
   */
  getToken(): string | null {
    return this.getAccessToken();
  }

  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  // =========================================================
  // VALIDACIONES
  // =========================================================
  isAuthenticated(): boolean {
    const accessToken = this.getAccessToken();

    return Boolean(
      accessToken &&
      !this.jwtHelper.isTokenExpired(accessToken),
    );
  }

  hasRole(role: string): boolean {
    const roles =
      this.currentUserSubject.value?.roles ?? [];

    return roles.includes(role as never);
  }

  hasAnyRole(requiredRoles: string[]): boolean {
    const currentRoles =
      this.currentUserSubject.value?.roles ?? [];

    return requiredRoles.some((role) =>
      currentRoles.includes(role as never),
    );
  }
}
