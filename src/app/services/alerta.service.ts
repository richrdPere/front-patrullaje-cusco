import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

//Environment
import { environment } from '@environments/environment';

// Interface
import { Alerta, AlertaDestinatario, AlertaDestinatariosDetalle, ApiResponse, CrearAlertaRequest } from '../interfaces/alertas.interface';
import { PaginadoResponse } from '../pages/shared/interfaces/paginado-response';


@Injectable({
  providedIn: 'root',
})
export class AlertaService {

  // 1.- Enviroment
  envs = environment;

  // 2.- variables publicas
  API_BASE = this.envs.main_url + 'alertas';

  API_CREATE_ALERTA = this.API_BASE + '/create';
  API_GET_ALERTAS_EMITIDAS = this.API_BASE + '/emitidas';
  API_GET_DESTINATARIOS = this.API_BASE;
  API_CANCEL_ALERTA = this.API_BASE;


  constructor(private http: HttpClient) { }

  // ======= HEADER CON TOKEN =======
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

  // ===========================================================
  // 1.- Crear Alerta
  // ===========================================================
  crearAlerta(
    request: CrearAlertaRequest,
  ): Observable<ApiResponse<Alerta>> {
    const headers = this.getAuthHeaders().headers;
    return this.http.post<ApiResponse<Alerta>>(`${this.API_CREATE_ALERTA}`, request, { headers });
  }

  // ===========================================================
  // 2.- Obtener alertas emitidas
  // ===========================================================
  getAlertasEmitidas(filters: {
    page?: number;
    limit?: number;
    estado?: string;
    tipo?: string;
    prioridad?: string;
  }): Observable<ApiResponse<PaginadoResponse<Alerta>>> {

    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    const headers = this.getAuthHeaders().headers;

    return this.http.get<ApiResponse<PaginadoResponse<Alerta>>>(
      `${this.API_GET_ALERTAS_EMITIDAS}`, { params, headers }
    );
  }

  // ===========================================================
  // 3.- Obtener destinatarios
  // ===========================================================
  getDestinatarios(
    alertaId: number,
  ): Observable<ApiResponse<AlertaDestinatariosDetalle>> {

    const headers = this.getAuthHeaders().headers;

    return this.http.get<ApiResponse<AlertaDestinatariosDetalle>>(
      `${this.API_GET_DESTINATARIOS}/${alertaId}/destinatarios`,
      { headers }
    );
  }

  // ===========================================================
  // 4.- Cancelar alerta
  // ===========================================================
  cancelarAlerta(
    alertaId: number,
    observacion?: string,
  ): Observable<ApiResponse<Alerta>> {

    const headers = this.getAuthHeaders().headers;

    return this.http.patch<ApiResponse<Alerta>>(
      `${this.API_CANCEL_ALERTA}/${alertaId}/cancelar`,
      {
        observacion: observacion?.trim() || null,
      },
      { headers }
    );
  }
}
