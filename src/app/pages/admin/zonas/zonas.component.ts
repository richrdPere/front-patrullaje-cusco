import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/pages/shared/directives/uppercase.directive';

// Components
import { ZonaFormComponent } from './zona-form/zona-form.component';

// Services
import { ZonaService } from 'src/app/services/zona/zona.service';

// Interfaces
import { RiesgoZona, ZonaData } from 'src/app/interfaces/zona/zona.model';
import { ZonaPaginatedItem } from 'src/app/interfaces/zona/get-zonas-paginated.model';
import { ApiErrorData } from 'src/app/pages/shared/interfaces/api-error-data.model';

interface RiesgoBadgeConfig {
  label: string;
  classes: string[];
}

@Component({
  selector: 'app-zonas',
  imports: [
    CommonModule,
    FormsModule,
    ZonaFormComponent,
    UppercaseDirective,
  ],
  templateUrl: './zonas.component.html',
  styles: ``,
})
export class ZonasComponent implements OnInit, OnDestroy {

  zonas: ZonaPaginatedItem[] = [];
  isLoading = false;

  // Búsqueda
  nombreBusqueda = '';
  private readonly searchSubject = new Subject<string>();

  // Paginación
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 0;

  pageSizeOptions = [5, 10, 20, 50];

  // Modal de formulario
  mostrarModal = false;
  modoEdicion = false;

  zonaSeleccionado: ZonaData | null = null;
  cargandoZonaId: number | null = null;

  // Eliminación
  eliminandoZonaId: number | null = null;

  // Subscripciones
  private zonasSubscription: Subscription | null = null;
  private detalleSubscription: Subscription | null = null;
  private readonly destroy$ = new Subject<void>();

  private readonly riesgoBadgeConfig: Record<RiesgoZona, RiesgoBadgeConfig> = {
    critico: {
      label: 'Crítico',
      classes: [
        'border-red-900', 'bg-red-900', 'text-white',
      ],
    },
    alto: {
      label: 'Alto',
      classes: [
        'border-red-600', 'bg-red-600', 'text-white',
      ],
    },
    medio: {
      label: 'Medio',
      classes: [
        'badge-warning',
      ],
    },
    bajo: {
      label: 'Bajo',
      classes: [
        'badge-success',
      ],
    },
  };

  constructor(
    private zonaService: ZonaService,
  ) { }

  // Ciclo de vida
  ngOnInit(): void {
    this.listenSearch();
    this.obtenerZonas();
  }

  ngOnDestroy(): void {
    this.zonasSubscription
      ?.unsubscribe();

    this.detalleSubscription
      ?.unsubscribe();

    this.destroy$.next();
    this.destroy$.complete();
  }

  /*
  |--------------------------------------------------------------------------
  | 1. Obtener zonas paginadas
  |--------------------------------------------------------------------------
  */
  obtenerZonas(resetPage = false): void {
    if (resetPage) {
      this.page = 1;
    }

    this.zonasSubscription?.unsubscribe();
    this.isLoading = true;

    this.zonasSubscription = this.zonaService.getZonasPaginated({
      page: this.page,
      limit: this.limit,
      search: this.nombreBusqueda.trim() || undefined,
      estado: true,
    })
      .pipe(
        finalize(() => {
          this.isLoading =
            false;
        }),
      )
      .subscribe({
        next: (response) => {
          const pagination = response.data;

          this.zonas = pagination.items;
          this.total = pagination.total;
          this.page = pagination.page;
          this.limit = pagination.limit;
          this.totalPages = pagination.totalPages;
        },

        error: (
          error: ApiErrorData,
        ) => {
          this.zonas = [];
          this.total = 0;
          this.totalPages = 0;

          void Swal.fire({
            icon: 'error',
            title: 'No se pudieron obtener las zonas',
            text: error.message || 'Ocurrió un error al cargar las zonas.',
          });
        },
      });
  }

  /*
  |--------------------------------------------------------------------------
  | 2. Búsqueda
  |--------------------------------------------------------------------------
  */
  private listenSearch(): void {
    this.searchSubject
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntil(
          this.destroy$,
        ),
      )
      .subscribe(() => {
        this.obtenerZonas(true);
      });
  }

  onSearchChange(): void {
    this.searchSubject.next(
      this.nombreBusqueda.trim(),
    );
  }

  limpiarBusqueda(): void {
    if (!this.nombreBusqueda) {
      return;
    }

    this.nombreBusqueda = '';
    this.obtenerZonas(true);
  }

  /*
  |--------------------------------------------------------------------------
  | 3. Cambiar página
  |--------------------------------------------------------------------------
  */
  cambiarPagina(nuevaPagina: number): void {
    if (
      nuevaPagina < 1 ||
      nuevaPagina >
      this.totalPages ||
      nuevaPagina === this.page ||
      this.isLoading
    ) {
      return;
    }

    this.page =
      nuevaPagina;

    this.obtenerZonas();
  }

  /*
  |--------------------------------------------------------------------------
  | 4. Cambiar cantidad por página
  |--------------------------------------------------------------------------
  */
  cambiarLimite() {
    this.limit = Number(this.limit);
    this.page = 1;
    this.obtenerZonas(true);
  }
  // cambiarLimite(nuevoLimite: number | string): void {
  //   const limit = Number(nuevoLimite);

  //   if (!Number.isInteger(limit) ||
  //     limit <= 0 ||
  //     limit === this.limit
  //   ) {
  //     return;
  //   }

  //   this.limit = limit;
  //   this.obtenerZonas(true);
  // }

  /*
  |--------------------------------------------------------------------------
  | 5. Abrir modal de creación
  |--------------------------------------------------------------------------
  */
  abrirCrearZona(): void {
    this.modoEdicion = false;
    this.zonaSeleccionado = null;
    this.mostrarModal = true;
  }

  /*
  |--------------------------------------------------------------------------
  | 6. Abrir modal de edición
  |--------------------------------------------------------------------------
  |
  | El listado paginado no devuelve coordenadas. Por eso primero
  | consultamos el detalle completo de la zona.
  |
  */

  editarZona(zona: ZonaPaginatedItem): void {
    if (
      this.cargandoZonaId !==
      null
    ) {
      return;
    }

    this.detalleSubscription?.unsubscribe();

    this.cargandoZonaId = zona.id;

    this.detalleSubscription = this.zonaService
      .getZonaById(
        zona.id,
      )
      .pipe(
        finalize(() => {
          this.cargandoZonaId =
            null;
        }),
      )
      .subscribe({
        next: (response) => {
          this.zonaSeleccionado = response.data;

          this.modoEdicion = true;
          this.mostrarModal = true;
        },
        error: (error: ApiErrorData,) => {
          void Swal.fire({
            icon: 'error',
            title: 'No se pudo cargar la zona',
            text: error.message || 'Ocurrió un error al obtener el detalle de la zona.',
          });
        },
      });
  }

  /*
  |--------------------------------------------------------------------------
  | 7. Cerrar formulario
  |--------------------------------------------------------------------------
  */
  cerrarFormularioZona(): void {
    this.mostrarModal = false;
    this.modoEdicion = false;
    this.zonaSeleccionado = null;
  }

  /*
  |--------------------------------------------------------------------------
  | 8. Zona creada o actualizada
  |--------------------------------------------------------------------------
  */
  onZonaGuardada(): void {
    this.cerrarFormularioZona();
    this.obtenerZonas();
  }

  /*
  |--------------------------------------------------------------------------
  | 9. Eliminar zona
  |--------------------------------------------------------------------------
  */
  async eliminarZona(zona: ZonaPaginatedItem): Promise<void> {
    if (
      this.eliminandoZonaId !==
      null
    ) {
      return;
    }

    const confirmation = await Swal.fire({
      title: '¿Eliminar zona?',
      html:
        `La zona <strong>${zona.nombre}</strong> ` +
        'dejará de estar disponible para nuevos patrullajes.',

      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    this.eliminandoZonaId = zona.id;

    this.zonaService.deleteZona(zona.id)
      .pipe(
        finalize(() => {
          this.eliminandoZonaId =
            null;
        }),
      )
      .subscribe({
        next: (response) => {
          void Swal.fire({
            icon: 'success',
            title: 'Zona eliminada',
            text: response.message,
            timer: 1800,
            showConfirmButton: false,
          });

          /*
           * Si eliminamos el único registro de una página
           * posterior a la primera, retrocedemos una página.
           */
          if (this.zonas.length === 1 && this.page > 1) {
            this.page -= 1;
          }

          this.obtenerZonas();
        },

        error: (
          error: ApiErrorData,
        ) => {
          void Swal.fire({
            icon: 'error',
            title: 'No se pudo eliminar la zona',
            text: error.message || 'Ocurrió un error al eliminar la zona.',
          });
        },
      });
  }



  getRiesgoBadge(
    riesgo: RiesgoZona,
  ): RiesgoBadgeConfig {
    return (
      this.riesgoBadgeConfig[
      riesgo
      ] ?? {
        label: 'Sin definir',

        classes: [
          'badge-neutral',
        ],
      }
    );
  }
}
