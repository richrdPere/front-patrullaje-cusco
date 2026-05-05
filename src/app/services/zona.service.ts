import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

//Environment
import { environment } from '@environments/environment';
import { ZonaPatrullaje } from './../interfaces/zonaPatrullaje';

@Injectable({ providedIn: 'root' })
export class ZonaService {

  // 1.- Enviroment
  envs = environment;

  // 2.- variables publicas
  private url: string = this.envs.main_url;
  // private api = 'https://ba-sistemapatrullaje-backend.onrender.com/api/';


  API_BASE = this.envs.main_url + 'zonas';

  API_LISTAR_ZONAS: string = this.API_BASE + '/todos';
  API_CREAR_ZONA: string = this.API_BASE + '/crear';
  API_ACTUALIZAR_ZONA: string = this.API_BASE + '/editar/';
  API_OBTENER_ZONA_POR_ID: string = this.API_BASE + '/detalle/';
  API_ELIMINAR_ZONA: string = this.API_BASE + '/eliminar/';

  constructor(private http: HttpClient) { }

  // 3.- Headers

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
  // 1.- Crear Zona
  // ===========================================================
  crearZona(zona: ZonaPatrullaje): Observable<any> {
    return this.http.post(this.API_CREAR_ZONA, zona);
  }

  // ===========================================================
  // 2.- Obtener zonas
  // ===========================================================
  obtenerZonas(): Observable<any[]> {
    const headers = this.getAuthHeaders().headers;
    return this.http.get<any[]>(this.API_LISTAR_ZONAS, { headers });
  }

  // ===========================================================
  // 3.- Obtener zona por ID
  // ===========================================================
  getZonaById(id: string): Observable<any> {
    return this.http.get(this.API_OBTENER_ZONA_POR_ID + `${id}`);
  }


  // ===========================================================
  // 4.- Eliminar zona por ID
  // ===========================================================
  deleteZonaById(id: number): Observable<any> {
    return this.http.delete(this.API_ELIMINAR_ZONA + `${id}`);
  }
}
