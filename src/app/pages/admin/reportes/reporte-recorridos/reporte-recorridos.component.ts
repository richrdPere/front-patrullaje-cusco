import {
  CommonModule,
  DatePipe,
  DecimalPipe,
} from '@angular/common';

import {
  Component,
  OnInit,
} from '@angular/core';

import {
  FormsModule,
} from '@angular/forms';

import {
  finalize,
} from 'rxjs';

// Service
import {
  ReportesService,
} from 'src/app/services/reportes.service';

// Interfaces
import {
  EstadoPatrullajeReporte,
  ReportePuntoGps,
  ReporteRecorridoDetalle,
  ReporteRecorridosData,
  ReporteRecorridosFilters,
  ReporteRecorridosPorFecha,
  ReporteRecorridosPorSereno,
  ReporteRecorridosPorUnidad,
  ReporteRecorridosPorZona,
  TipoGpsReporte,
} from 'src/app/interfaces/reportes/reporte-recorridos.interface';
import { ReporteRecorridoMapaComponent } from "./reporte-recorrido-mapa/reporte-recorrido-mapa.component";

// =========================================================
// OPCIONES
// =========================================================

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

@Component({
  selector: 'reporte-recorridos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    DecimalPipe,
    ReporteRecorridoMapaComponent
],
  templateUrl: './reporte-recorridos.component.html',
  styles: ``,
})
export class ReporteRecorridosComponent implements OnInit {

  // =========================================================
  // REPORTE
  // =========================================================

  reporte: ReporteRecorridosData | null = null;

  recorridos: ReporteRecorridoDetalle[] = [];

  // =========================================================
  // ESTADOS
  // =========================================================

  isLoading = false;

  requestErrorMessage = '';
  filterErrorMessage = '';

  mostrarFiltrosAvanzados = false;

  // =========================================================
  // FILTROS APLICADOS
  // =========================================================

  filters: ReporteRecorridosFilters = {
    page: 1,
    limit: 10,

    fecha_inicio: '',
    fecha_fin: '',

    patrullaje_id: null,
    zona_id: null,
    unidad_id: null,
    usuario_id: null,

    estado_patrullaje: '',
    tipo_gps: '',

    precision_maxima: null,

    con_recorrido: null,
  };

  // =========================================================
  // FILTROS DEL FORMULARIO
  // =========================================================

  filtrosFormulario: ReporteRecorridosFilters = {
    ...this.filters,
  };

  // =========================================================
  // PAGINACIÓN
  // =========================================================

  currentPage = 1;
  limit = 10;

  totalItems = 0;
  totalPages = 0;

  hasNextPage = false;
  hasPreviousPage = false;

  readonly pageSizeOptions: number[] = [
    5,
    10,
    20,
    50,
  ];

  // =========================================================
  // OPCIONES DE SELECT
  // =========================================================

  readonly estadosPatrullaje:
    SelectOption<EstadoPatrullajeReporte>[] = [
      {
        value: 'PROGRAMADO',
        label: 'Programado',
      },
      {
        value: 'ASIGNADO',
        label: 'Asignado',
      },
      {
        value: 'ACEPTADO',
        label: 'Aceptado',
      },
      {
        value: 'EN_CURSO',
        label: 'En curso',
      },
      {
        value: 'FINALIZADO',
        label: 'Finalizado',
      },
    ];

  readonly tiposGps:
    SelectOption<TipoGpsReporte>[] = [
      {
        value: 'TRACKING',
        label: 'Tracking automático',
      },
      {
        value: 'EMERGENCIA',
        label: 'Emergencia',
      },
      {
        value: 'MANUAL',
        label: 'Registro manual',
      },
    ];

  // =========================================================
  // MODAL DE MAPA
  // =========================================================

  mostrarModalMapa = false;

  recorridoSeleccionado:
    ReporteRecorridoDetalle | null = null;

  // =========================================================
  // MODAL DE DETALLE
  // =========================================================

  mostrarModalDetalle = false;

  constructor(
    private readonly reportesService:
      ReportesService,
  ) { }

  // =========================================================
  // CICLO DE VIDA
  // =========================================================

  ngOnInit(): void {
    this.getReporteRecorridos();
  }

  // =========================================================
  // CONSULTA PRINCIPAL
  // =========================================================

  getReporteRecorridos(): void {

    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    this.requestErrorMessage = '';
    this.filterErrorMessage = '';

    const filtrosConsulta:
      ReporteRecorridosFilters = {
      ...this.filters,

      page:
        this.currentPage,

      limit:
        this.limit,
    };

    this.reportesService
      .getReporteRecorridos(
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
              'No fue posible obtener el reporte de recorridos.';

            return;
          }

          this.reporte =
            response.data;

          this.recorridos =
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
            'Error al obtener el reporte de recorridos:',
            error,
          );

          this.limpiarResultado();

          this.requestErrorMessage =
            error?.error?.message ||
            error?.message ||
            'Ocurrió un error al consultar el reporte de recorridos.';
        },
      });
  }

  // =========================================================
  // FILTROS
  // =========================================================

  aplicarFiltros(): void {

    this.filterErrorMessage = '';
    this.requestErrorMessage = '';

    if (!this.validarFiltros()) {
      return;
    }

    this.currentPage = 1;

    this.filters = {
      ...this.filtrosFormulario,

      page: 1,
      limit: this.limit,
    };

    this.getReporteRecorridos();
  }

  limpiarFiltros(): void {

    this.currentPage = 1;
    this.limit = 10;

    this.filters = {
      page: 1,
      limit: 10,

      fecha_inicio: '',
      fecha_fin: '',

      patrullaje_id: null,
      zona_id: null,
      unidad_id: null,
      usuario_id: null,

      estado_patrullaje: '',
      tipo_gps: '',

      precision_maxima: null,

      con_recorrido: null,
    };

    this.filtrosFormulario = {
      ...this.filters,
    };

    this.filterErrorMessage = '';
    this.requestErrorMessage = '';

    this.mostrarFiltrosAvanzados = false;

    this.getReporteRecorridos();
  }

  toggleFiltrosAvanzados(): void {
    this.mostrarFiltrosAvanzados =
      !this.mostrarFiltrosAvanzados;
  }

  reintentar(): void {
    this.getReporteRecorridos();
  }

  private validarFiltros(): boolean {

    const fechaInicio =
      this.filtrosFormulario.fecha_inicio;

    const fechaFin =
      this.filtrosFormulario.fecha_fin;

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
        {
          value:
            this.filtrosFormulario
              .usuario_id,
          label:
            'El ID del usuario',
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

    const precision =
      this.filtrosFormulario
        .precision_maxima;

    if (
      precision !== null &&
      precision !== undefined &&
      Number(precision) < 0
    ) {
      this.filterErrorMessage =
        'La precisión máxima no puede ser negativa.';

      return false;
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

    this.getReporteRecorridos();
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

    this.getReporteRecorridos();
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
  // MODAL DE MAPA
  // =========================================================

  abrirMapa(
    recorrido:
      ReporteRecorridoDetalle,
  ): void {

    if (
      !this.tieneRecorridoValido(
        recorrido,
      )
    ) {
      return;
    }

    this.recorridoSeleccionado =
      recorrido;

    this.mostrarModalMapa = true;
  }

  cerrarMapa(): void {

    this.mostrarModalMapa = false;

    this.limpiarSeleccion();
  }

  // =========================================================
  // MODAL DE DETALLE
  // =========================================================

  abrirDetalle(
    recorrido:
      ReporteRecorridoDetalle,
  ): void {

    this.recorridoSeleccionado =
      recorrido;

    this.mostrarModalDetalle = true;
  }

  cerrarDetalle(): void {

    this.mostrarModalDetalle = false;

    this.limpiarSeleccion();
  }

  private limpiarSeleccion(): void {

    if (
      this.mostrarModalMapa ||
      this.mostrarModalDetalle
    ) {
      return;
    }

    this.recorridoSeleccionado =
      null;
  }

  // =========================================================
  // INDICADORES
  // =========================================================

  get totalRecorridos(): number {

    return (
      this.reporte
        ?.resumen
        .total_recorridos ?? 0
    );
  }

  get recorridosFinalizados(): number {

    return (
      this.reporte
        ?.resumen
        .recorridos_finalizados ?? 0
    );
  }

  get recorridosEnCurso(): number {

    return (
      this.reporte
        ?.resumen
        .recorridos_en_curso ?? 0
    );
  }

  get recorridosConGps(): number {

    return (
      this.reporte
        ?.resumen
        .recorridos_con_gps ?? 0
    );
  }

  get recorridosSinGps(): number {

    return (
      this.reporte
        ?.resumen
        .recorridos_sin_gps ?? 0
    );
  }

  get totalPuntosGps(): number {

    return (
      this.reporte
        ?.resumen
        .total_puntos_gps ?? 0
    );
  }

  get distanciaTotalKm(): number {

    return (
      this.reporte
        ?.resumen
        .distancia_total_km ?? 0
    );
  }

  get horasTotales(): number {

    return (
      this.reporte
        ?.resumen
        .horas_totales ?? 0
    );
  }

  get velocidadMaxima(): number | null {

    return (
      this.reporte
        ?.resumen
        .velocidad_maxima ?? null
    );
  }

  get porcentajeConGps(): number {

    if (
      this.totalRecorridos === 0
    ) {
      return 0;
    }

    return Number(
      (
        (
          this.recorridosConGps /
          this.totalRecorridos
        ) *
        100
      ).toFixed(1),
    );
  }

  get porcentajeFinalizados(): number {

    if (
      this.totalRecorridos === 0
    ) {
      return 0;
    }

    return Number(
      (
        (
          this.recorridosFinalizados /
          this.totalRecorridos
        ) *
        100
      ).toFixed(1),
    );
  }

  // =========================================================
  // ESTADO DEL PATRULLAJE
  // =========================================================

  getEstadoPatrullajeLabel(
    estado:
      EstadoPatrullajeReporte,
  ): string {

    return (
      this.estadosPatrullaje.find(
        item =>
          item.value === estado,
      )?.label ??
      estado
    );
  }

  getEstadoPatrullajeBadgeClass(
    estado:
      EstadoPatrullajeReporte,
  ): string {

    switch (estado) {
      case 'PROGRAMADO':
        return 'badge-ghost';

      case 'ASIGNADO':
        return 'badge-warning';

      case 'ACEPTADO':
        return 'badge-info';

      case 'EN_CURSO':
        return 'badge-primary';

      case 'FINALIZADO':
        return 'badge-success';

      default:
        return 'badge-ghost';
    }
  }

  getEstadoPatrullajeIcon(
    estado:
      EstadoPatrullajeReporte,
  ): string {

    switch (estado) {
      case 'PROGRAMADO':
        return 'fa-solid fa-calendar';

      case 'ASIGNADO':
        return 'fa-solid fa-user-check';

      case 'ACEPTADO':
        return 'fa-solid fa-circle-check';

      case 'EN_CURSO':
        return 'fa-solid fa-route';

      case 'FINALIZADO':
        return 'fa-solid fa-flag-checkered';

      default:
        return 'fa-solid fa-circle';
    }
  }

  // =========================================================
  // DATOS DEL PATRULLAJE
  // =========================================================

  getPatrullajeLabel(
    recorrido:
      ReporteRecorridoDetalle,
  ): string {

    return `Patrullaje #${recorrido.patrullaje_id}`;
  }

  getZonaLabel(
    recorrido:
      ReporteRecorridoDetalle,
  ): string {

    return (
      recorrido.zona?.nombre ||
      'Sin zona'
    );
  }

  getUnidadLabel(
    recorrido:
      ReporteRecorridoDetalle,
  ): string {

    const unidad =
      recorrido.unidad;

    if (!unidad) {
      return 'Sin unidad';
    }

    const placa =
      unidad.placa
        ? ` · ${unidad.placa}`
        : '';

    return `${unidad.codigo}${placa}`;
  }

  getSerenosLabel(
    recorrido:
      ReporteRecorridoDetalle,
  ): string {

    if (
      recorrido.serenos.length === 0
    ) {
      return 'Sin sereno asignado';
    }

    if (
      recorrido.serenos.length === 1
    ) {
      return recorrido.serenos[0].nombre;
    }

    return `${recorrido.serenos[0].nombre} y ${recorrido.serenos.length - 1} más`;
  }

  getSerenoPrincipal(
    recorrido:
      ReporteRecorridoDetalle,
  ): string {

    return (
      recorrido.serenos[0]?.nombre ||
      'Sin sereno asignado'
    );
  }

  getFotoSerenoPrincipal(
    recorrido:
      ReporteRecorridoDetalle,
  ): string {

    return (
      recorrido.serenos[0]
        ?.foto_perfil ||
      'assets/img/default-avatar.png'
    );
  }

  // =========================================================
  // RECORRIDO Y COORDENADAS
  // =========================================================

  tieneRecorridoValido(
    recorrido:
      ReporteRecorridoDetalle,
  ): boolean {

    return recorrido.recorrido.some(
      punto =>
        this.tieneCoordenadasValidas(
          punto,
        ),
    );
  }

  tieneCoordenadasValidas(
    punto: ReportePuntoGps,
  ): boolean {

    const latitud =
      Number(punto.latitud);

    const longitud =
      Number(punto.longitud);

    return (
      Number.isFinite(latitud) &&
      Number.isFinite(longitud) &&
      latitud >= -90 &&
      latitud <= 90 &&
      longitud >= -180 &&
      longitud <= 180
    );
  }

  getPolylinePath(
    recorrido:
      ReporteRecorridoDetalle,
  ): google.maps.LatLngLiteral[] {

    return recorrido.recorrido
      .filter(
        punto =>
          this.tieneCoordenadasValidas(
            punto,
          ),
      )
      .map(
        punto => ({
          lat:
            Number(
              punto.latitud,
            ),

          lng:
            Number(
              punto.longitud,
            ),
        }),
      );
  }

  getPuntosValidos(
    recorrido:
      ReporteRecorridoDetalle,
  ): ReportePuntoGps[] {

    return recorrido.recorrido.filter(
      punto =>
        this.tieneCoordenadasValidas(
          punto,
        ),
    );
  }

  // =========================================================
  // FORMATEO DE DISTANCIA
  // =========================================================

  formatearDistancia(
    distanciaMetros:
      number | null | undefined,
  ): string {

    const metros =
      Number(
        distanciaMetros ?? 0,
      );

    if (
      !Number.isFinite(metros) ||
      metros <= 0
    ) {
      return '0 m';
    }

    if (metros < 1000) {
      return `${metros.toFixed(0)} m`;
    }

    return `${(
      metros / 1000
    ).toFixed(2)} km`;
  }

  // =========================================================
  // FORMATEO DE DURACIÓN
  // =========================================================

  formatearDuracion(
    segundos:
      number | null | undefined,
  ): string {

    const totalSegundos =
      Math.max(
        Math.floor(
          Number(segundos ?? 0),
        ),
        0,
      );

    if (totalSegundos === 0) {
      return '0 min';
    }

    const horas =
      Math.floor(
        totalSegundos / 3600,
      );

    const minutos =
      Math.floor(
        (
          totalSegundos % 3600
        ) / 60,
      );

    const segundosRestantes =
      totalSegundos % 60;

    if (horas > 0) {
      return `${horas} h ${minutos} min`;
    }

    if (minutos > 0) {
      return `${minutos} min ${segundosRestantes} s`;
    }

    return `${segundosRestantes} s`;
  }

  // =========================================================
  // FORMATEO DE VELOCIDAD
  // =========================================================

  formatearVelocidad(
    velocidad:
      number | null | undefined,
  ): string {

    if (
      velocidad === null ||
      velocidad === undefined ||
      !Number.isFinite(
        Number(velocidad),
      )
    ) {
      return 'No disponible';
    }

    /*
     * El backend actualmente devuelve el valor almacenado.
     * Confirma si corresponde a m/s o km/h.
     */
    return `${Number(velocidad).toFixed(2)} m/s`;
  }

  convertirVelocidadAKmh(
    velocidad:
      number | null | undefined,
  ): number | null {

    if (
      velocidad === null ||
      velocidad === undefined ||
      !Number.isFinite(
        Number(velocidad),
      )
    ) {
      return null;
    }

    return Number(
      (
        Number(velocidad) *
        3.6
      ).toFixed(2),
    );
  }

  // =========================================================
  // PRECISIÓN
  // =========================================================

  formatearPrecision(
    precision:
      number | null | undefined,
  ): string {

    if (
      precision === null ||
      precision === undefined ||
      !Number.isFinite(
        Number(precision),
      )
    ) {
      return 'No disponible';
    }

    return `${Number(precision).toFixed(1)} m`;
  }

  getPrecisionBadgeClass(
    precision:
      number | null | undefined,
  ): string {

    if (
      precision === null ||
      precision === undefined
    ) {
      return 'badge-ghost';
    }

    const value =
      Number(precision);

    if (value <= 10) {
      return 'badge-success';
    }

    if (value <= 30) {
      return 'badge-warning';
    }

    return 'badge-error';
  }

  // =========================================================
  // TIPOS DE GPS
  // =========================================================

  getTipoGpsLabel(
    tipo: TipoGpsReporte,
  ): string {

    return (
      this.tiposGps.find(
        item =>
          item.value === tipo,
      )?.label ??
      tipo
    );
  }

  getTipoGpsIcon(
    tipo: TipoGpsReporte,
  ): string {

    switch (tipo) {
      case 'TRACKING':
        return 'fa-solid fa-location-dot';

      case 'EMERGENCIA':
        return 'fa-solid fa-triangle-exclamation';

      case 'MANUAL':
        return 'fa-solid fa-location-crosshairs';

      default:
        return 'fa-solid fa-location-dot';
    }
  }

  getTipoGpsBadgeClass(
    tipo: TipoGpsReporte,
  ): string {

    switch (tipo) {
      case 'TRACKING':
        return 'badge-info';

      case 'EMERGENCIA':
        return 'badge-error';

      case 'MANUAL':
        return 'badge-warning';

      default:
        return 'badge-ghost';
    }
  }

  // =========================================================
  // AGRUPACIONES
  // =========================================================

  getMaximoDistanciaUnidad(): number {

    const valores =
      this.reporte
        ?.por_unidad
        .map(
          item =>
            item.distancia_metros,
        ) ?? [];

    return valores.length > 0
      ? Math.max(...valores)
      : 0;
  }

  getPorcentajeUnidad(
    item:
      ReporteRecorridosPorUnidad,
  ): number {

    const maximo =
      this.getMaximoDistanciaUnidad();

    if (maximo <= 0) {
      return 0;
    }

    return Number(
      (
        item.distancia_metros /
        maximo *
        100
      ).toFixed(1),
    );
  }

  getMaximoDistanciaZona(): number {

    const valores =
      this.reporte
        ?.por_zona
        .map(
          item =>
            item.distancia_metros,
        ) ?? [];

    return valores.length > 0
      ? Math.max(...valores)
      : 0;
  }

  getPorcentajeZona(
    item:
      ReporteRecorridosPorZona,
  ): number {

    const maximo =
      this.getMaximoDistanciaZona();

    if (maximo <= 0) {
      return 0;
    }

    return Number(
      (
        item.distancia_metros /
        maximo *
        100
      ).toFixed(1),
    );
  }

  getMaximoDistanciaSereno(): number {

    const valores =
      this.reporte
        ?.por_sereno
        .map(
          item =>
            item.distancia_metros,
        ) ?? [];

    return valores.length > 0
      ? Math.max(...valores)
      : 0;
  }

  getPorcentajeSereno(
    item:
      ReporteRecorridosPorSereno,
  ): number {

    const maximo =
      this.getMaximoDistanciaSereno();

    if (maximo <= 0) {
      return 0;
    }

    return Number(
      (
        item.distancia_metros /
        maximo *
        100
      ).toFixed(1),
    );
  }

  getMaximoDistanciaFecha(): number {

    const valores =
      this.reporte
        ?.por_fecha
        .map(
          item =>
            item.distancia_metros,
        ) ?? [];

    return valores.length > 0
      ? Math.max(...valores)
      : 0;
  }

  getPorcentajeFecha(
    item:
      ReporteRecorridosPorFecha,
  ): number {

    const maximo =
      this.getMaximoDistanciaFecha();

    if (maximo <= 0) {
      return 0;
    }

    return Number(
      (
        item.distancia_metros /
        maximo *
        100
      ).toFixed(1),
    );
  }

  // =========================================================
  // TRACK BY
  // =========================================================

  trackByRecorrido(
    index: number,
    recorrido:
      ReporteRecorridoDetalle,
  ): number {

    return recorrido.patrullaje_id;
  }

  trackByPuntoGps(
    index: number,
    punto:
      ReportePuntoGps,
  ): number {

    return punto.id;
  }

  // =========================================================
  // LIMPIAR RESULTADOS
  // =========================================================

  private limpiarResultado(): void {

    this.reporte = null;
    this.recorridos = [];

    this.totalItems = 0;
    this.totalPages = 0;

    this.hasNextPage = false;
    this.hasPreviousPage = false;
  }
}
