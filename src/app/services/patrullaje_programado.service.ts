import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

//Environment
import { environment } from '@environments/environment';
import { ZonaPatrullaje } from './../interfaces/zonaPatrullaje';

@Injectable({ providedIn: 'root' })
export class PatrullajeProgramadoService {

  // 1.- Enviroment
  envs = environment;

  // 2.- variables publicas
  private url: string = this.envs.main_url;

  API_BASE = this.envs.main_url + 'patrullaje-programado';

  API_LISTAR_PATRULLAJE: string = this.API_BASE + '/todos';
  API_CREAR_PATRULLAJE: string = this.API_BASE + '/crear';
  API_ACTUALIZAR_PATRULLAJE: string = this.API_BASE + '/editar/';
  API_OBTENER_PATRULLAJE_POR_ID: string = this.API_BASE + '/detalle/';
  // API_ELIMINAR_PATRULLAJE: string = this.API_BASE + '/eliminar/';

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
  // 1.- Crear Patrullaje
  // ===========================================================
  crearPatrullajeProgramado(patrullaje: any): Observable<any> {
    return this.http.post(this.API_CREAR_PATRULLAJE, patrullaje);
  }

  // ===========================================================
  // 2.- Obtener Patrullaje
  // ===========================================================
  getPatrullajesPaginado(filters: {
    page?: number;
    limit?: number;
  }): Observable<any> {

    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params = params.set(key, value.toString());
      }
    });

    const headers = this.getAuthHeaders().headers;
    return this.http.get<any[]>(this.API_LISTAR_PATRULLAJE, { headers });
  }

  // ===========================================================
  // 3.- Obtener Patrullaje por ID
  // ===========================================================
  getPatrullajeById(id: string): Observable<any> {
    return this.http.get(this.API_OBTENER_PATRULLAJE_POR_ID + `${id}`);
  }

  // ===========================================================
  // 4.- Actualizar Patrullaje por ID
  // ===========================================================
  updatePatrullaje(id: string, data: Partial<any>): Observable<any> {
    return this.http.put<any>(`${this.API_ACTUALIZAR_PATRULLAJE}${id}`, data);
  }

}
