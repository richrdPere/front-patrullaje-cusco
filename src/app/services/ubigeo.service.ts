import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// Interfaces
import { Departamento, Distrito, Provincia } from '../interfaces/ubigeo';
import { catchError, tap } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class UbigeoService {

  private data: Departamento[] = [];

  constructor(private http: HttpClient) { }

  // CARGAR DATA
  loadData() {
    return this.http.get<Departamento[]>('assets/data/ubigeo.json')
      .pipe(
        tap(res => {
          this.data = res;
          console.log('Ubigeo cargado', this.data);
        }),
        catchError(err => {
          console.error('Error cargando ubigeo', err);
          throw err;
        })
      );
  }

  // DEPARTAMENTOS
  getDepartamentos(): Departamento[] {
    return this.data;
  }

  // PROVINCIAS POR DEPARTAMENTO
  getProvincias(departamentoId: string): Provincia[] {
    const dep = this.data.find(d => d.departamento_id === departamentoId);
    return dep ? dep.provincias : [];
  }

  // DISTRITOS POR PROVINCIA
  getDistritos(departamentoId: string, provinciaId: string): Distrito[] {
    const dep = this.data.find(d => d.departamento_id === departamentoId);
    const prov = dep?.provincias.find(p => p.provincia_id === provinciaId);
    return prov ? prov.distritos : [];
  }

  // BUSCAR POR UBIGEO
  findByUbigeo(ubigeo: string): {
    departamento?: Departamento;
    provincia?: Provincia;
    distrito?: Distrito;
  } {

    for (const dep of this.data) {

      if (dep.departamento_id === ubigeo) {
        return { departamento: dep };
      }

      for (const prov of dep.provincias) {

        if (prov.provincia_id === ubigeo) {
          return { departamento: dep, provincia: prov };
        }

        for (const dist of prov.distritos) {

          if (dist.id === ubigeo) {  // ✅ corregido
            return {
              departamento: dep,
              provincia: prov,
              distrito: dist
            };
          }
        }
      }
    }

    return {};
  }
}
