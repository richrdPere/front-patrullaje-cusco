import { CommonModule, DatePipe, } from '@angular/common';
import { Component, OnDestroy, OnInit, } from '@angular/core';
import { FormsModule, } from '@angular/forms';
import { finalize, Subject, takeUntil, } from 'rxjs';

// Service
import { HistorialPatrullajeService, } from 'src/app/services/historial-patrullaje.service';

// Interfaces
import { EstadoHistorialPatrullaje, HistorialPatrullaje, HistorialPatrullajeFilters, PrioridadHistorialPatrullaje, TipoHistorialPatrullaje, } from 'src/app/interfaces/historial/historial-patrullaje.interface';

@Component({
  selector: 'app-historial-patrullaje',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
  ],
  templateUrl: './historial-patrullaje.component.html',
  styles: ``
})
export class HistorialPatrullajeComponent implements OnInit, OnDestroy {

  // DESTRUCCIÓN DE SUBSCRIPCIONES
  private readonly destroy$ = new Subject<void>();

  // LISTADO
  historiales: HistorialPatrullaje[] = [];
  historialSeleccionado: HistorialPatrullaje | null = null;

  // ESTADOS DE CARGA
  isLoading = false;
  errorMessage = '';

  // FILTROS
  mostrarFiltrosAvanzados = false;

  filters: HistorialPatrullajeFilters = {
    page: 1,
    limit: 10,

    fecha_inicio: '',
    fecha_fin: '',

    unidad_id: null,
    zona_id: null,
    usuario_id: null,
    patrullaje_id: null,
    incidencia_id: null,

    tipo: '',
    prioridad: '',
    estado: '',

    visible_para_siguiente_turno: null,

    search: '',
  };

  /**
   * Copia usada para evitar consultar el backend
   * con cada tecla escrita en los filtros.
   */
  filtrosFormulario: HistorialPatrullajeFilters = { ...this.filters, };

  // PAGINACIÓN
  currentPage = 1;
  limit = 10;

  totalItems = 0;
  totalPages = 0;

  hasNextPage = false;
  hasPreviousPage = false;

  readonly pageSizeOptions = [5, 10, 20, 50,];

  // MODALES
  mostrarModalDetalle = false;
  mostrarModalMapa = false;


  // OPCIONES DE FILTRO
  // =========================================================
  readonly tipos:
    Array<{
      value: TipoHistorialPatrullaje;
      label: string;
    }> = [
      {
        value: 'OBSERVACION',
        label: 'Observación',
      },
      {
        value: 'NOVEDAD',
        label: 'Novedad',
      },
      {
        value: 'ALERTA',
        label: 'Alerta',
      },
      {
        value: 'RECOMENDACION',
        label: 'Recomendación',
      },
      {
        value: 'PUNTO_CRITICO',
        label: 'Punto crítico',
      },
      {
        value: 'CAMBIO_TURNO',
        label: 'Cambio de turno',
      },
    ];

  readonly prioridades:
    Array<{
      value: PrioridadHistorialPatrullaje;
      label: string;
    }> = [
      {
        value: 'BAJA',
        label: 'Baja',
      },
      {
        value: 'MEDIA',
        label: 'Media',
      },
      {
        value: 'ALTA',
        label: 'Alta',
      },
      {
        value: 'CRITICA',
        label: 'Crítica',
      },
    ];

  readonly estados:
    Array<{
      value: EstadoHistorialPatrullaje;
      label: string;
    }> = [
      {
        value: 'ACTIVO',
        label: 'Activo',
      },
      {
        value: 'ARCHIVADO',
        label: 'Archivado',
      },
    ];

  readonly opcionesVisibilidad = [
    {
      value: null,
      label: 'Todos',
    },
    {
      value: true,
      label: 'Visible para siguiente turno',
    },
    {
      value: false,
      label: 'No visible para siguiente turno',
    },
  ];

  constructor(
    private historialService:
      HistorialPatrullajeService,
  ) { }

  // =========================================================
  // CICLO DE VIDA
  // =========================================================

  ngOnInit(): void {
    this.getHistorial();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =========================================================
  // CONSULTA PRINCIPAL
  // =========================================================
  getHistorial(): void {

    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const filtrosConsulta:
      HistorialPatrullajeFilters = {
      ...this.filters,
      page: this.currentPage,
      limit: this.limit,
    };

    this.historialService.getHistorialPaginado(filtrosConsulta).pipe(
      takeUntil(this.destroy$),

      finalize(() => {
        this.isLoading = false;
      }),
    )
      .subscribe({
        next: response => {

          if (!response.success || !response.data) {
            this.historiales = [];

            this.errorMessage = response.message || 'No fue posible obtener el historial de patrullajes.';

            this.resetPagination();

            return;
          }
          this.historiales = response.data.data ?? [];
          const pagination = response.data.pagination;
          this.currentPage = pagination.page;
          this.limit = pagination.limit;
          this.totalItems = pagination.totalItems;
          this.totalPages = pagination.totalPages;
          this.hasNextPage = pagination.hasNextPage;
          this.hasPreviousPage = pagination.hasPreviousPage;
        },

        error: error => {

          console.error(
            'Error al obtener historial de patrullajes:',
            error,
          );

          this.historiales = [];

          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Ocurrió un error al consultar el historial de patrullajes.';

          this.resetPagination();
        },
      });
  }

  // =========================================================
  // FILTROS
  // =========================================================

  aplicarFiltros(): void {

    if (
      !this.validarRangoFechas()
    ) {
      return;
    }

    this.filters = {
      ...this.filtrosFormulario,
      page: 1,
      limit: this.limit,
    };

    this.currentPage = 1;

    this.getHistorial();
  }

  limpiarFiltros(): void {

    this.currentPage = 1;
    this.limit = 10;

    this.filters = {
      page: 1,
      limit: 10,

      fecha_inicio: '',
      fecha_fin: '',

      unidad_id: null,
      zona_id: null,
      usuario_id: null,
      patrullaje_id: null,
      incidencia_id: null,

      tipo: '',
      prioridad: '',
      estado: '',

      visible_para_siguiente_turno: null,

      search: '',
    };

    this.filtrosFormulario = {
      ...this.filters,
    };

    this.errorMessage = '';
    this.mostrarFiltrosAvanzados = false;

    this.getHistorial();
  }

  reintentar(): void {
    this.getHistorial();
  }

  private validarRangoFechas(): boolean {

    const fechaInicio =
      this.filtrosFormulario.fecha_inicio;

    const fechaFin =
      this.filtrosFormulario.fecha_fin;

    if (
      !fechaInicio ||
      !fechaFin
    ) {
      return true;
    }

    const inicio =
      new Date(`${fechaInicio}T00:00:00`);

    const fin =
      new Date(`${fechaFin}T23:59:59`);

    if (inicio <= fin) {
      this.errorMessage = '';
      return true;
    }

    this.errorMessage =
      'La fecha inicial no puede ser posterior a la fecha final.';

    return false;
  }

  // =========================================================
  // FILTRO RÁPIDO POR PATRULLAJE
  // =========================================================
  toggleFiltrosAvanzados(): void {
    this.mostrarFiltrosAvanzados =
      !this.mostrarFiltrosAvanzados;
  }

  consultarPorPatrullaje(
    patrullajeId: number,
  ): void {

    if (
      !Number.isFinite(patrullajeId) ||
      patrullajeId <= 0
    ) {
      return;
    }

    this.filtrosFormulario = {
      ...this.filtrosFormulario,
      patrullaje_id: patrullajeId,
    };

    this.aplicarFiltros();
  }

  // =========================================================
  // PAGINACIÓN
  // =========================================================
  cambiarPagina(
    page: number,
  ): void {

    if (
      this.isLoading ||
      page < 1 ||
      page > this.totalPages ||
      page === this.currentPage
    ) {
      return;
    }

    this.currentPage = page;

    this.filters = {
      ...this.filters,
      page,
      limit: this.limit,
    };

    this.getHistorial();
  }

  paginaAnterior(): void {

    if (!this.hasPreviousPage) {
      return;
    }

    this.cambiarPagina(
      this.currentPage - 1,
    );
  }

  paginaSiguiente(): void {

    if (!this.hasNextPage) {
      return;
    }

    this.cambiarPagina(
      this.currentPage + 1,
    );
  }

  cambiarLimite(
    value: number | string,
  ): void {

    const nuevoLimite =
      Number(value);

    if (
      !Number.isFinite(nuevoLimite) ||
      nuevoLimite <= 0
    ) {
      return;
    }

    this.limit = nuevoLimite;
    this.currentPage = 1;

    this.filters = {
      ...this.filters,
      page: 1,
      limit: nuevoLimite,
    };

    this.filtrosFormulario = {
      ...this.filtrosFormulario,
      page: 1,
      limit: nuevoLimite,
    };

    this.getHistorial();
  }

  get paginasVisibles(): number[] {

    if (this.totalPages <= 0) {
      return [];
    }

    const maxVisible = 5;

    let inicio = Math.max(
      1,
      this.currentPage - 2,
    );

    let fin = Math.min(
      this.totalPages,
      inicio + maxVisible - 1,
    );

    inicio = Math.max(
      1,
      fin - maxVisible + 1,
    );

    return Array.from(
      {
        length: fin - inicio + 1,
      },
      (_, index) => inicio + index,
    );
  }

  private resetPagination(): void {

    this.currentPage = 1;
    this.totalItems = 0;
    this.totalPages = 0;

    this.hasNextPage = false;
    this.hasPreviousPage = false;
  }

  // =========================================================
  // DETALLE
  // =========================================================
  abrirDetalle(
    historial: HistorialPatrullaje,
  ): void {

    this.historialSeleccionado =
      historial;

    this.mostrarModalDetalle = true;
  }

  cerrarDetalle(): void {
    this.mostrarModalDetalle = false;
    this.historialSeleccionado = null;
  }

  // =========================================================
  // MAPA
  // =========================================================

  abrirMapa(
    historial: HistorialPatrullaje,
  ): void {

    if (
      !this.tieneCoordenadas(historial)
    ) {
      return;
    }

    this.historialSeleccionado =
      historial;

    this.mostrarModalMapa = true;
  }

  cerrarMapa(): void {

    this.mostrarModalMapa = false;

    this.historialSeleccionado = null;
  }

  tieneCoordenadas(
    historial: HistorialPatrullaje,
  ): boolean {

    const latitud =
      Number(historial.latitud);

    const longitud =
      Number(historial.longitud);

    return (
      historial.latitud !== null &&
      historial.latitud !== undefined &&
      historial.longitud !== null &&
      historial.longitud !== undefined &&
      Number.isFinite(latitud) &&
      Number.isFinite(longitud) &&
      latitud >= -90 &&
      latitud <= 90 &&
      longitud >= -180 &&
      longitud <= 180
    );
  }

  // =========================================================
  // DATOS RELACIONADOS
  // =========================================================
  getNombreSereno(historial: HistorialPatrullaje,): string {
    const usuario = historial.usuario;
    const persona = usuario?.persona;

    if (persona) {

      return [
        persona.nombres,
        persona.apellido_paterno,
        persona.apellido_materno,
      ]
        .filter(Boolean)
        .join(' ');
    }

    if (usuario?.username) {
      return usuario.username;
    }

    return historial.usuario_id
      ? `Usuario #${historial.usuario_id}`
      : 'Sin sereno asociado';
  }

  getNombreZona(
    historial: HistorialPatrullaje,
  ): string {

    return (
      historial.zona?.nombre ||
      `Zona #${historial.zona_id}`
    );
  }

  getUnidadLabel(
    historial: HistorialPatrullaje,
  ): string {

    const unidad =
      historial
        .patrullaje_programado
        ?.unidad;

    if (!unidad) {
      return 'Sin unidad';
    }

    const partes = [
      unidad.codigo,
      unidad.placa,
    ].filter(Boolean);

    return partes.join(' · ');
  }

  getPatrullajeLabel(
    historial: HistorialPatrullaje,
  ): string {

    return `Patrullaje #${historial.patrullaje_id}`;
  }

  getIncidenciaLabel(
    historial: HistorialPatrullaje,
  ): string {

    if (!historial.incidencia_id) {
      return 'Sin incidencia';
    }

    if (historial.incidencia) {
      return `#${historial.incidencia.id} · ${historial.incidencia.tipo}`;
    }

    return `Incidencia #${historial.incidencia_id}`;
  }

  // =========================================================
  // PRESENTACIÓN
  // =========================================================

  getTipoLabel(
    tipo: TipoHistorialPatrullaje,
  ): string {

    switch (tipo) {
      case 'OBSERVACION':
        return 'Observación';

      case 'NOVEDAD':
        return 'Novedad';

      case 'ALERTA':
        return 'Alerta';

      case 'RECOMENDACION':
        return 'Recomendación';

      case 'PUNTO_CRITICO':
        return 'Punto crítico';

      case 'CAMBIO_TURNO':
        return 'Cambio de turno';

      default:
        return tipo;
    }
  }

  getTipoIcon(
    tipo: TipoHistorialPatrullaje,
  ): string {

    switch (tipo) {
      case 'OBSERVACION':
        return 'fa-solid fa-eye';

      case 'NOVEDAD':
        return 'fa-solid fa-circle-info';

      case 'ALERTA':
        return 'fa-solid fa-triangle-exclamation';

      case 'RECOMENDACION':
        return 'fa-solid fa-lightbulb';

      case 'PUNTO_CRITICO':
        return 'fa-solid fa-location-crosshairs';

      case 'CAMBIO_TURNO':
        return 'fa-solid fa-right-left';

      default:
        return 'fa-solid fa-file-lines';
    }
  }

  getTipoBadgeClass(
    tipo: TipoHistorialPatrullaje,
  ): string {

    switch (tipo) {
      case 'OBSERVACION':
        return 'badge-info';

      case 'NOVEDAD':
        return 'badge-primary';

      case 'ALERTA':
        return 'badge-warning';

      case 'RECOMENDACION':
        return 'badge-secondary';

      case 'PUNTO_CRITICO':
        return 'badge-error';

      case 'CAMBIO_TURNO':
        return 'badge-accent';

      default:
        return 'badge-ghost';
    }
  }

  getPrioridadLabel(
    prioridad:
      PrioridadHistorialPatrullaje,
  ): string {

    switch (prioridad) {
      case 'BAJA':
        return 'Baja';

      case 'MEDIA':
        return 'Media';

      case 'ALTA':
        return 'Alta';

      case 'CRITICA':
        return 'Crítica';

      default:
        return prioridad;
    }
  }

  getPrioridadBadgeClass(
    prioridad:
      PrioridadHistorialPatrullaje,
  ): string {

    switch (prioridad) {
      case 'BAJA':
        return 'badge-ghost';

      case 'MEDIA':
        return 'badge-info';

      case 'ALTA':
        return 'badge-warning';

      case 'CRITICA':
        return 'badge-error';

      default:
        return 'badge-ghost';
    }
  }

  getEstadoLabel(
    estado: EstadoHistorialPatrullaje,
  ): string {

    switch (estado) {
      case 'ACTIVO':
        return 'Activo';

      case 'ARCHIVADO':
        return 'Archivado';

      default:
        return estado;
    }
  }

  getEstadoBadgeClass(
    estado: EstadoHistorialPatrullaje,
  ): string {

    switch (estado) {
      case 'ACTIVO':
        return 'badge-success';

      case 'ARCHIVADO':
        return 'badge-neutral';

      default:
        return 'badge-ghost';
    }
  }

  getVisibilidadLabel(
    visible: boolean,
  ): string {

    return visible
      ? 'Visible para siguiente turno'
      : 'Solo turno actual';
  }

  // =========================================================
  // TRACK BY
  // =========================================================

  trackByHistorialId(
    index: number,
    historial: HistorialPatrullaje,
  ): number {

    return historial.id;
  }

}
