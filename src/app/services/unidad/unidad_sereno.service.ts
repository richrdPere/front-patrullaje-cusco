import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// Environment
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class UnidadSerenoService {

  // 1. Environment
  envs = environment;

  // 2. Variables globales

  API_BASE = this.envs.main_url + 'unidad-sereno';

  API_ASIGNAR_SERENOS: string = this.API_BASE + '/asignar-serenos';
  API_OBTENER_SERENOS: string = this.API_BASE + '/unidad/';
  API_ELIMINAR_ASIGNACION_SERENO: string = this.API_BASE + 'unidad/';


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
  // 1. Asignar serenos a una unidad
  // ===========================================================
  asignarSerenos(data: any): Observable<any> {
    return this.http.post(this.API_ASIGNAR_SERENOS, data);
  }

  // ===========================================================
  // 2. Obtener serenos asignados a una unidad
  // ===========================================================
  obtenerSerenosUnidad(unidad_id: number): Observable<any> {
    return this.http.get(this.API_OBTENER_SERENOS + `${unidad_id}`);
  }

  // ===========================================================
  // 3. Eliminar asignación de un sereno
  // ===========================================================
  eliminarAsignacion(unidad_id: number, usuario_id: number): Observable<any> {
    return this.http.delete(this.API_ELIMINAR_ASIGNACION_SERENO + `${unidad_id}/usuario/${usuario_id}`);
  }

}
