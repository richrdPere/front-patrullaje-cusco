import { CommonModule, Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

// Interfaces
import { ApiErrorData } from 'src/app/pages/shared/interfaces/api-error-data.model';
import { EstadoIncidencia, IncidenciaPaginada, TipoIncidencia } from 'src/app/interfaces/incidencia/get-incidencias-paginated.interface';
import {
  IncidenciaByUsuario,
  IncidenciaUsuarioResumen
} from 'src/app/interfaces/incidencia/get_incidencia_by_usuario_id.interface';

// Services
import { IncidenciasService } from 'src/app/services/incidencia/incidencias.service';
import { IncidenciaMapaComponent } from '../../incidentes-reportados/incidencia-mapa/incidencia-mapa.component';
import { IncidenciaArchivosComponent } from '../../incidentes-reportados/incidencia-archivos/incidencia-archivos.component';

@Component({
  selector: 'incidencias-listado',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IncidenciaMapaComponent,
    IncidenciaArchivosComponent
  ],
  templateUrl: './incidencias-listado.component.html',
  styles: ``,
})

export class IncidenciasListadoComponent implements OnInit {

  // =========================================================
  // SERENO
  // =========================================================

  usuarioId!: number;

  sereno: IncidenciaUsuarioResumen | null = null;

  nombreSerenoNavegacion = '';
  documentoSereno = '';

  // - Archivos modal
  mostrarArchivos = false;
  incidenciaArchivoId: number | null = null;

  // - Mapa modal
  mostrarModalMapa = false;
  incidenciaSeleccionada: IncidenciaPaginada | null = null;

  // =========================================================
  // INCIDENCIAS
  // =========================================================

  incidencias: IncidenciaByUsuario[] = [];

  isLoading = false;

  // =========================================================
  // PAGINACIÓN
  // =========================================================

  page = 1;
  limit = 5;
  totalItems = 0;
  totalPages = 0;

  pageSizeOptions = [5, 10, 20, 50];

  // =========================================================
  // FILTROS
  // =========================================================

  tipoFiltro: TipoIncidencia | '' = '';
  estadoFiltro: EstadoIncidencia | '' = '';
  fechaInicio = '';
  fechaFin = '';

  readonly tipos: {
    value: TipoIncidencia;
    label: string;
  }[] = [
      { value: 'ROBO', label: 'Robo' },
      { value: 'ACCIDENTE', label: 'Accidente' },
      { value: 'INCENDIO', label: 'Incendio' },
      { value: 'VIOLENCIA', label: 'Violencia' },
      { value: 'SOSPECHOSO', label: 'Sospechoso' },
      { value: 'OTRO', label: 'Otro' },
    ];

  readonly estados: {
    value: EstadoIncidencia;
    label: string;
  }[] = [
      { value: 'REPORTADO', label: 'Reportado' },
      { value: 'EN_PROCESO', label: 'En proceso' },
      { value: 'ATENDIDO', label: 'Atendido' },
      { value: 'CERRADO', label: 'Cerrado' },
    ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly location: Location,
    private readonly incidenciaService: IncidenciasService,
  ) { }

  ngOnInit(): void {
    this.obtenerDatosNavegacion();

    const id = Number(
      this.route.snapshot.paramMap.get('usuarioId'),
    );

    if (!Number.isInteger(id) || id <= 0) {
      void Swal.fire({
        icon: 'error',
        title: 'Identificador inválido',
        text:
          'No se pudo identificar al sereno seleccionado.',
      }).then(() => {
        void this.router.navigate([
          '/incidencias/serenos',
        ]);
      });

      return;
    }

    this.usuarioId = id;
    this.cargarIncidencias();
  }

  // =========================================================
  // DATOS ENVIADOS DESDE LA CARD
  // =========================================================

  private obtenerDatosNavegacion(): void {
    const state = history.state as {
      nombreSereno?: string;
      documentoSereno?: string;
    };

    this.nombreSerenoNavegacion =
      state.nombreSereno ?? '';

    this.documentoSereno =
      state.documentoSereno ?? '';
  }

  // =========================================================
  // CARGAR INCIDENCIAS
  // =========================================================

  cargarIncidencias(): void {
    if (
      !this.usuarioId ||
      this.usuarioId <= 0 ||
      this.isLoading
    ) {
      return;
    }

    this.isLoading = true;

    this.incidenciaService
      .getIncidenciasByUsuario(this.usuarioId, {
        page: this.page,
        limit: this.limit,
        tipo: this.tipoFiltro || undefined,
        estado: this.estadoFiltro || undefined,

        // fecha_inicio: this.fechaInicio || undefined,
        // fecha_fin: this.fechaFin || undefined,

        incluirArchivos: true,
        mode: 'web',

        /*
         * No uses origen: 'CENTRAL'.
         * El JSON mostrado contiene APP_MOVIL.
         * Al omitirlo se recuperan todos los orígenes.
         */
      })
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          const paginacion = response.data;

          this.incidencias =
            paginacion.data ?? [];

          this.totalItems =
            paginacion.total;

          this.page =
            paginacion.page;

          this.limit =
            paginacion.limit;

          this.totalPages =
            paginacion.totalPages;

          /*
           * La respuesta proporciona los datos resumidos
           * del usuario dentro de cada incidencia.
           */
          if (this.incidencias.length > 0) {
            this.sereno =
              this.incidencias[0].usuario;
          }
        },

        error: (error: ApiErrorData) => {
          this.limpiarResultados();

          void Swal.fire({
            icon: 'error',
            title:
              'No se pudo cargar el expediente',
            text:
              error.message ||
              'Ocurrió un error al obtener las incidencias.',
          });
        },
      });
  }

  // =========================================================
  // FILTROS
  // =========================================================

  aplicarFiltros(): void {
    if (
      this.fechaInicio &&
      this.fechaFin &&
      this.fechaInicio > this.fechaFin
    ) {
      void Swal.fire({
        icon: 'warning',
        title: 'Rango de fechas inválido',
        text:
          'La fecha inicial no puede superar la fecha final.',
      });

      return;
    }

    this.page = 1;
    this.cargarIncidencias();
  }

  limpiarFiltros(): void {
    this.tipoFiltro = '';
    this.estadoFiltro = '';
    this.fechaInicio = '';
    this.fechaFin = '';
    this.page = 1;

    this.cargarIncidencias();
  }

  // =========================================================
  // PAGINACIÓN
  // =========================================================

  cambiarPagina(nuevaPagina: number): void {
    if (
      nuevaPagina < 1 ||
      nuevaPagina > this.totalPages ||
      nuevaPagina === this.page ||
      this.isLoading
    ) {
      return;
    }

    this.page = nuevaPagina;
    this.cargarIncidencias();

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  cambiarLimite(): void {
    this.limit = Number(this.limit);
    this.page = 1;

    this.cargarIncidencias();
  }

  // =========================================================
  // NAVEGACIÓN
  // =========================================================

  volverAlListado(): void {
    /*
     * Regresa al listado anterior y conserva la navegación
     * natural del navegador.
     */
    this.location.back();
  }

  verIncidencia(
    incidencia: IncidenciaByUsuario,
  ): void {
    void this.router.navigate([
      '/incidencias',
      incidencia.id,
    ]);
  }

  abrirUbicacion(
    incidencia: IncidenciaByUsuario,
  ): void {
    const latitud = Number(
      incidencia.latitud,
    );

    const longitud = Number(
      incidencia.longitud,
    );

    if (
      !Number.isFinite(latitud) ||
      !Number.isFinite(longitud)
    ) {
      void Swal.fire({
        icon: 'warning',
        title: 'Ubicación no disponible',
        text:
          'La incidencia no tiene coordenadas válidas.',
      });

      return;
    }

    window.open(
      `https://www.google.com/maps?q=${latitud},${longitud}`,
      '_blank',
      'noopener,noreferrer',
    );
  }

  // =========================================================
  // MODALES METHOD
  // =========================================================

  // - Modal de mapa
  abrirMapaIncidencia(incidencia: any): void {
    this.incidenciaSeleccionada = incidencia;
    this.mostrarModalMapa = true;
  }

  cerrarMapaIncidencia(): void {

    this.mostrarModalMapa = false;
    this.incidenciaSeleccionada = null;
  }

  // - Modal de archivos
  abrirArchivos(incidenciaId: number): void {
    this.incidenciaArchivoId = incidenciaId;
    this.mostrarArchivos = true;
  }

  cerrarArchivos(): void {
    this.mostrarArchivos = false;
  }

  // =========================================================
  // HELPERS
  // =========================================================

  private limpiarResultados(): void {
    this.incidencias = [];
    this.totalItems = 0;
    this.totalPages = 0;
  }

  getEstadoLabel(
    estado: EstadoIncidencia,
  ): string {
    const labels: Record<
      EstadoIncidencia,
      string
    > = {
      REPORTADO: 'Reportado',
      EN_PROCESO: 'En proceso',
      ATENDIDO: 'Atendido',
      CERRADO: 'Cerrado',
      ELIMINADO: 'Eliminado',
    };

    return labels[estado] ?? estado;
  }

  getEstadoBadge(
    estado: EstadoIncidencia,
  ): string {
    const clases: Record<
      EstadoIncidencia,
      string
    > = {
      REPORTADO: 'badge-warning',
      EN_PROCESO: 'badge-info',
      ATENDIDO: 'badge-success',
      CERRADO: 'badge-neutral',
      ELIMINADO: 'badge-error',
    };

    return clases[estado] ?? 'badge-ghost';
  }

  getTipoIcon(
    tipo: TipoIncidencia,
  ): string {
    const iconos: Record<
      TipoIncidencia,
      string
    > = {
      ROBO: 'fa-mask-face',
      ACCIDENTE: 'fa-car-burst',
      INCENDIO: 'fa-fire',
      VIOLENCIA:
        'fa-person-circle-exclamation',
      SOSPECHOSO: 'fa-user-secret',
      OTRO: 'fa-triangle-exclamation',
    };

    return iconos[tipo] ??
      'fa-triangle-exclamation';
  }

  get nombreCompletoSereno(): string {
    if (this.sereno?.persona) {
      return [
        this.sereno.persona.nombres,
        this.sereno.persona.apellidos,
      ]
        .filter(Boolean)
        .join(' ');
    }

    if (this.nombreSerenoNavegacion) {
      return this.nombreSerenoNavegacion;
    }

    return `Sereno #${this.usuarioId}`;
  }

  get desde(): number {
    if (this.totalItems === 0) {
      return 0;
    }

    return (
      (this.page - 1) *
      this.limit
    ) + 1;
  }

  get hasta(): number {
    return Math.min(
      this.page * this.limit,
      this.totalItems,
    );
  }
}
