import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

// Service
import { ReportesService } from 'src/app/services/reportes.service';

// Interfaces
import {
  EstadoIncidenciaReporte,
  OrigenIncidenciaReporte,
  ReporteIncidenciaDetalle,
  ReporteIncidenciasData,
  ReporteIncidenciasFilters,
  TipoIncidenciaReporte,
} from 'src/app/interfaces/reportes/reporte-incidencias.interface';

// Subcomponentes ya implementados
import { IncidenciaDetalleComponent } from '../../incidentes-reportados/incidencia-detalle/incidencia-detalle.component';
import { IncidenciaMapaComponent } from '../../incidentes-reportados/incidencia-mapa/incidencia-mapa.component';
import { IncidenciaArchivosComponent } from '../../incidentes-reportados/incidencia-archivos/incidencia-archivos.component';

// =========================================================
// OPCIONES DE SELECT
// =========================================================

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

@Component({
  selector: 'reporte-incidencias',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,

    IncidenciaDetalleComponent,
    IncidenciaMapaComponent,
    IncidenciaArchivosComponent,
  ],
  templateUrl: './reporte-incidencias.component.html',
  styles: ``
})
export class ReporteIncidenciasComponent implements OnInit {

  // RESPUESTA
  reporte: ReporteIncidenciasData | null = null;
  incidencias: ReporteIncidenciaDetalle[] = [];


  // ESTADOS
  isLoading = false;

  requestErrorMessage = '';
  filterErrorMessage = '';

  mostrarFiltrosAvanzados = false;

  // FILTROS APLICADOS Y FORMULARIO
  filters: ReporteIncidenciasFilters = {
    page: 1,
    limit: 10,

    fecha_inicio: '',
    fecha_fin: '',

    usuario_id: null,
    patrullaje_id: null,
    zona_id: null,
    unidad_id: null,

    tipo: '',
    estado: '',
    origen: '',

    con_evidencias: null,

    search: '',
  };

  filtrosFormulario: ReporteIncidenciasFilters = {
    ...this.filters,
  };

  // PAGINACIÓN
  currentPage = 1;
  limit = 10;

  totalItems = 0;
  totalPages = 0;

  hasNextPage = false;
  hasPreviousPage = false;

  readonly pageSizeOptions = [5, 10, 20, 50,];

  // OPCIONES DE FILTROS
  readonly tipos:
    SelectOption<TipoIncidenciaReporte>[] = [
      {
        value: 'ROBO',
        label: 'Robo',
      },
      {
        value: 'ACCIDENTE',
        label: 'Accidente',
      },
      {
        value: 'INCENDIO',
        label: 'Incendio',
      },
      {
        value: 'VIOLENCIA',
        label: 'Violencia',
      },
      {
        value: 'SOSPECHOSO',
        label: 'Actividad sospechosa',
      },
      {
        value: 'OTRO',
        label: 'Otro',
      },
    ];

  readonly estados: SelectOption<EstadoIncidenciaReporte>[] = [
    {
      value: 'REPORTADO',
      label: 'Reportado',
    },
    {
      value: 'EN_PROCESO',
      label: 'En proceso',
    },
    {
      value: 'ATENDIDO',
      label: 'Atendido',
    },
    {
      value: 'CERRADO',
      label: 'Cerrado',
    },
    {
      value: 'ELIMINADO',
      label: 'Eliminado',
    },
  ];

  readonly origenes: SelectOption<OrigenIncidenciaReporte>[] = [
    {
      value: 'APP_MOVIL',
      label: 'Aplicación móvil',
    },
    {
      value: 'CENTRAL',
      label: 'Central',
    },
    {
      value: 'SISTEMA',
      label: 'Sistema',
    },
  ];

  // =========================================================
  // MODALES
  // =========================================================

  mostrarModalDetalle = false;
  mostrarModalMapa = false;
  mostrarModalArchivos = false;

  incidenciaSeleccionada:
    ReporteIncidenciaDetalle | null = null;

  incidenciaIdSeleccionada:
    number | null = null;

  constructor(
    private readonly reportesService: ReportesService,
  ) { }

  // =========================================================
  // CICLO DE VIDA
  // =========================================================

  ngOnInit(): void {
    this.getReporteIncidencias();
  }

  // =========================================================
  // CONSULTA PRINCIPAL
  // =========================================================

  getReporteIncidencias(): void {

    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    this.requestErrorMessage = '';
    this.filterErrorMessage = '';

    const filtrosConsulta:
      ReporteIncidenciasFilters = {
      ...this.filters,

      page:
        this.currentPage,

      limit:
        this.limit,
    };

    this.reportesService
      .getReporteIncidencias(
        filtrosConsulta,
      )
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: response => {

          if (
            !response.success ||
            !response.data
          ) {
            this.limpiarResultado();

            this.requestErrorMessage =
              response.message ||
              'No fue posible obtener el reporte de incidencias.';

            return;
          }

          this.reporte =
            response.data;

          this.incidencias =
            response.data.detalle.data;

          const pagination =
            response.data
              .detalle
              .pagination;

          this.currentPage =
            pagination.page;

          this.limit =
            pagination.limit;

          this.totalItems =
            pagination.totalItems;

          this.totalPages =
            pagination.totalPages;

          this.hasNextPage =
            pagination.hasNextPage;

          this.hasPreviousPage =
            pagination.hasPreviousPage;
        },

        error: error => {

          console.error(
            'Error al obtener reporte de incidencias:',
            error,
          );

          this.limpiarResultado();

          this.requestErrorMessage =
            error?.error?.message ||
            error?.message ||
            'Ocurrió un error al consultar el reporte de incidencias.';
        },
      });
  }

  // =========================================================
  // FILTROS
  // =========================================================

  aplicarFiltros(): void {

    this.filterErrorMessage = '';
    this.requestErrorMessage = '';

    if (
      !this.validarFiltros()
    ) {
      return;
    }

    this.currentPage = 1;

    this.filters = {
      ...this.filtrosFormulario,

      page: 1,
      limit: this.limit,

      search:
        this.filtrosFormulario
          .search
          ?.trim() || '',
    };

    this.getReporteIncidencias();
  }

  limpiarFiltros(): void {

    this.currentPage = 1;
    this.limit = 10;

    this.filters = {
      page: 1,
      limit: 10,

      fecha_inicio: '',
      fecha_fin: '',

      usuario_id: null,
      patrullaje_id: null,
      zona_id: null,
      unidad_id: null,

      tipo: '',
      estado: '',
      origen: '',

      con_evidencias: null,

      search: '',
    };

    this.filtrosFormulario = {
      ...this.filters,
    };

    this.filterErrorMessage = '';
    this.requestErrorMessage = '';

    this.mostrarFiltrosAvanzados = false;

    this.getReporteIncidencias();
  }

  reintentar(): void {
    this.getReporteIncidencias();
  }

  toggleFiltrosAvanzados(): void {
    this.mostrarFiltrosAvanzados =
      !this.mostrarFiltrosAvanzados;
  }

  private validarFiltros(): boolean {

    const fechaInicio =
      this.filtrosFormulario
        .fecha_inicio;

    const fechaFin =
      this.filtrosFormulario
        .fecha_fin;

    if (
      fechaInicio &&
      fechaFin &&
      fechaInicio > fechaFin
    ) {
      this.filterErrorMessage =
        'La fecha inicial no puede ser posterior a la fecha final.';

      return false;
    }

    const numericFields: Array<{
      value: number | null | undefined;
      label: string;
    }> = [
        {
          value:
            this.filtrosFormulario
              .usuario_id,
          label:
            'El ID del usuario',
        },
        {
          value:
            this.filtrosFormulario
              .patrullaje_id,
          label:
            'El ID del patrullaje',
        },
        {
          value:
            this.filtrosFormulario
              .zona_id,
          label:
            'El ID de la zona',
        },
        {
          value:
            this.filtrosFormulario
              .unidad_id,
          label:
            'El ID de la unidad',
        },
      ];

    for (
      const field of numericFields
    ) {
      if (
        field.value !== null &&
        field.value !== undefined &&
        Number(field.value) <= 0
      ) {
        this.filterErrorMessage =
          `${field.label} debe ser mayor que cero.`;

        return false;
      }
    }

    return true;
  }

  // =========================================================
  // PAGINACIÓN
  // =========================================================

  cambiarPagina(
    page: number,
  ): void {

    if (
      page < 1 ||
      page > this.totalPages ||
      page === this.currentPage ||
      this.isLoading
    ) {
      return;
    }

    this.currentPage = page;

    this.getReporteIncidencias();
  }

  paginaAnterior(): void {

    if (
      !this.hasPreviousPage ||
      this.isLoading
    ) {
      return;
    }

    this.cambiarPagina(
      this.currentPage - 1,
    );
  }

  paginaSiguiente(): void {

    if (
      !this.hasNextPage ||
      this.isLoading
    ) {
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
      !Number.isFinite(
        nuevoLimite,
      ) ||
      nuevoLimite <= 0 ||
      nuevoLimite === this.limit
    ) {
      return;
    }

    this.limit =
      nuevoLimite;

    this.currentPage = 1;

    this.filters = {
      ...this.filters,

      page: 1,
      limit:
        nuevoLimite,
    };

    this.filtrosFormulario = {
      ...this.filtrosFormulario,

      page: 1,
      limit:
        nuevoLimite,
    };

    this.getReporteIncidencias();
  }

  get paginasVisibles(): number[] {

    if (
      this.totalPages <= 0
    ) {
      return [];
    }

    const maxVisible = 5;

    let startPage =
      Math.max(
        this.currentPage - 2,
        1,
      );

    let endPage =
      Math.min(
        startPage +
        maxVisible -
        1,
        this.totalPages,
      );

    if (
      endPage -
      startPage +
      1 <
      maxVisible
    ) {
      startPage =
        Math.max(
          endPage -
          maxVisible +
          1,
          1,
        );
    }

    return Array.from(
      {
        length:
          endPage -
          startPage +
          1,
      },
      (
        _,
        index,
      ) =>
        startPage +
        index,
    );
  }

  // =========================================================
  // MODAL DE DETALLE
  // =========================================================

  abrirDetalle(
    incidencia:
      ReporteIncidenciaDetalle,
  ): void {

    this.incidenciaSeleccionada =
      incidencia;

    this.incidenciaIdSeleccionada =
      incidencia.id;

    this.mostrarModalDetalle = true;
  }

  cerrarDetalle(): void {

    this.mostrarModalDetalle = false;

    this.limpiarSeleccionDespuesDeCerrar();
  }

  // =========================================================
  // MODAL DE MAPA
  // =========================================================

  abrirMapa(
    incidencia:
      ReporteIncidenciaDetalle,
  ): void {

    if (
      !this.tieneCoordenadasValidas(
        incidencia,
      )
    ) {
      return;
    }

    this.incidenciaSeleccionada =
      incidencia;

    this.incidenciaIdSeleccionada =
      incidencia.id;

    this.mostrarModalMapa = true;
  }

  cerrarMapa(): void {

    this.mostrarModalMapa = false;

    this.limpiarSeleccionDespuesDeCerrar();
  }

  // =========================================================
  // MODAL DE ARCHIVOS
  // =========================================================

  abrirArchivos(
    incidencia:
      ReporteIncidenciaDetalle,
  ): void {

    this.incidenciaSeleccionada =
      incidencia;

    this.incidenciaIdSeleccionada =
      incidencia.id;

    this.mostrarModalArchivos = true;
  }

  cerrarArchivos(): void {

    this.mostrarModalArchivos = false;

    this.limpiarSeleccionDespuesDeCerrar();
  }

  private limpiarSeleccionDespuesDeCerrar(): void {

    if (
      this.mostrarModalDetalle ||
      this.mostrarModalMapa ||
      this.mostrarModalArchivos
    ) {
      return;
    }

    this.incidenciaSeleccionada =
      null;

    this.incidenciaIdSeleccionada =
      null;
  }

  // =========================================================
  // INDICADORES
  // =========================================================

  get totalIncidencias(): number {
    return (
      this.reporte
        ?.resumen
        .total ?? 0
    );
  }

  get totalReportadas(): number {
    return (
      this.reporte
        ?.resumen
        .reportadas ?? 0
    );
  }

  get totalEnProceso(): number {
    return (
      this.reporte
        ?.resumen
        .en_proceso ?? 0
    );
  }

  get totalAtendidas(): number {
    return (
      this.reporte
        ?.resumen
        .atendidas ?? 0
    );
  }

  get totalCerradas(): number {
    return (
      this.reporte
        ?.resumen
        .cerradas ?? 0
    );
  }

  get totalConEvidencias(): number {
    return (
      this.reporte
        ?.resumen
        .con_evidencias ?? 0
    );
  }

  get porcentajeAtendidas(): number {

    if (
      this.totalIncidencias === 0
    ) {
      return 0;
    }

    return Number(
      (
        (
          this.totalAtendidas /
          this.totalIncidencias
        ) *
        100
      ).toFixed(1),
    );
  }

  get porcentajeConEvidencias(): number {

    if (
      this.totalIncidencias === 0
    ) {
      return 0;
    }

    return Number(
      (
        (
          this.totalConEvidencias /
          this.totalIncidencias
        ) *
        100
      ).toFixed(1),
    );
  }

  // =========================================================
  // DATOS DEL SERENO
  // =========================================================

  getNombreSereno(
    incidencia:
      ReporteIncidenciaDetalle,
  ): string {

    const persona =
      incidencia.usuario
        ?.persona;

    if (persona) {
      return `${persona.nombres} ${persona.apellidos}`
        .trim();
    }

    if (
      incidencia.usuario
        ?.username
    ) {
      return incidencia.usuario
        .username;
    }

    return `Usuario #${incidencia.usuario_id}`;
  }

  getDocumentoSereno(
    incidencia:
      ReporteIncidenciaDetalle,
  ): string {

    return (
      incidencia.usuario
        ?.persona
        ?.documento_identidad ||
      'Sin documento'
    );
  }

  getFotoSereno(
    incidencia:
      ReporteIncidenciaDetalle,
  ): string {

    return (
      incidencia.usuario
        ?.persona
        ?.foto_perfil ||
      'assets/img/default-avatar.png'
    );
  }

  // =========================================================
  // DATOS RELACIONADOS
  // =========================================================

  getZonaLabel(
    incidencia:
      ReporteIncidenciaDetalle,
  ): string {

    return (
      incidencia.zona?.nombre ||
      `Zona #${incidencia.zona_id}`
    );
  }

  getPatrullajeLabel(
    incidencia:
      ReporteIncidenciaDetalle,
  ): string {

    if (
      !incidencia.patrullaje_id
    ) {
      return 'Sin patrullaje';
    }

    return `Patrullaje #${incidencia.patrullaje_id}`;
  }

  getUnidadLabel(
    incidencia:
      ReporteIncidenciaDetalle,
  ): string {

    const unidad =
      incidencia
        .patrullaje
        ?.unidad;

    if (!unidad) {
      return 'Sin unidad';
    }

    const placa =
      unidad.placa
        ? ` · ${unidad.placa}`
        : '';

    return `${unidad.codigo}${placa}`;
  }

  // =========================================================
  // TIPOS
  // =========================================================

  getTipoLabel(
    tipo: TipoIncidenciaReporte,
  ): string {

    return (
      this.tipos.find(
        item =>
          item.value === tipo,
      )?.label ??
      tipo
    );
  }

  getTipoIcon(
    tipo: TipoIncidenciaReporte,
  ): string {

    switch (tipo) {
      case 'ROBO':
        return 'fa-solid fa-user-secret';

      case 'ACCIDENTE':
        return 'fa-solid fa-car-burst';

      case 'INCENDIO':
        return 'fa-solid fa-fire-flame-curved';

      case 'VIOLENCIA':
        return 'fa-solid fa-hand-fist';

      case 'SOSPECHOSO':
        return 'fa-solid fa-user-shield';

      case 'OTRO':
      default:
        return 'fa-solid fa-triangle-exclamation';
    }
  }

  getTipoBadgeClass(
    tipo: TipoIncidenciaReporte,
  ): string {

    switch (tipo) {
      case 'ROBO':
        return 'badge-secondary';

      case 'ACCIDENTE':
        return 'badge-warning';

      case 'INCENDIO':
        return 'badge-error';

      case 'VIOLENCIA':
        return 'badge-error';

      case 'SOSPECHOSO':
        return 'badge-info';

      case 'OTRO':
      default:
        return 'badge-ghost';
    }
  }

  // =========================================================
  // ESTADOS
  // =========================================================

  getEstadoLabel(
    estado:
      EstadoIncidenciaReporte,
  ): string {

    return (
      this.estados.find(
        item =>
          item.value === estado,
      )?.label ??
      estado
    );
  }

  getEstadoBadgeClass(
    estado:
      EstadoIncidenciaReporte,
  ): string {

    switch (estado) {
      case 'REPORTADO':
        return 'badge-warning';

      case 'EN_PROCESO':
        return 'badge-info';

      case 'ATENDIDO':
        return 'badge-success';

      case 'CERRADO':
        return 'badge-neutral';

      case 'ELIMINADO':
        return 'badge-error';

      default:
        return 'badge-ghost';
    }
  }

  // =========================================================
  // ORIGEN
  // =========================================================

  getOrigenLabel(
    origen:
      OrigenIncidenciaReporte,
  ): string {

    return (
      this.origenes.find(
        item =>
          item.value === origen,
      )?.label ??
      origen
    );
  }

  getOrigenIcon(
    origen:
      OrigenIncidenciaReporte,
  ): string {

    switch (origen) {
      case 'APP_MOVIL':
        return 'fa-solid fa-mobile-screen-button';

      case 'CENTRAL':
        return 'fa-solid fa-building-shield';

      case 'SISTEMA':
      default:
        return 'fa-solid fa-server';
    }
  }

  // =========================================================
  // COORDENADAS
  // =========================================================

  tieneCoordenadasValidas(
    incidencia:
      ReporteIncidenciaDetalle,
  ): boolean {

    const latitud =
      Number(
        incidencia.latitud,
      );

    const longitud =
      Number(
        incidencia.longitud,
      );

    return (
      Number.isFinite(latitud) &&
      Number.isFinite(longitud) &&
      latitud >= -90 &&
      latitud <= 90 &&
      longitud >= -180 &&
      longitud <= 180
    );
  }

  getLatitud(
    incidencia:
      ReporteIncidenciaDetalle,
  ): number | null {

    if (
      !this.tieneCoordenadasValidas(
        incidencia,
      )
    ) {
      return null;
    }

    return Number(
      incidencia.latitud,
    );
  }

  getLongitud(
    incidencia:
      ReporteIncidenciaDetalle,
  ): number | null {

    if (
      !this.tieneCoordenadasValidas(
        incidencia,
      )
    ) {
      return null;
    }

    return Number(
      incidencia.longitud,
    );
  }

  // =========================================================
  // AGRUPACIONES
  // =========================================================

  getMaximoPorTipo(): number {

    const valores =
      this.reporte
        ?.por_tipo
        .map(
          item => item.total,
        ) ?? [];

    return valores.length > 0
      ? Math.max(...valores)
      : 0;
  }

  getPorcentajeTipo(
    total: number,
  ): number {

    const max =
      this.getMaximoPorTipo();

    if (max === 0) {
      return 0;
    }

    return Number(
      (
        total /
        max *
        100
      ).toFixed(1),
    );
  }

  getMaximoPorZona(): number {
    const valores = this.reporte?.por_zona
      .map(
        item => item.total,
      ) ?? [];

    return valores.length > 0
      ? Math.max(...valores)
      : 0;
  }

  getPorcentajeZona(
    total: number,
  ): number {

    const max =
      this.getMaximoPorZona();

    if (max === 0) {
      return 0;
    }

    return Number(
      (
        total /
        max *
        100
      ).toFixed(1),
    );
  }

  // =========================================================
  // UTILIDADES
  // =========================================================

  trackByIncidencia(
    index: number,
    incidencia:
      ReporteIncidenciaDetalle,
  ): number {

    return incidencia.id;
  }

  private limpiarResultado(): void {

    this.reporte = null;
    this.incidencias = [];

    this.totalItems = 0;
    this.totalPages = 0;

    this.hasNextPage = false;
    this.hasPreviousPage = false;
  }
}
