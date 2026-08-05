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
  EstadoAsignacionActividad,
  EstadoPatrullajeActividad,
  ReporteActividadDetalle,
  ReporteActividadFilters,
  ReporteActividadOperativaData,
  ReporteActividadPorFecha,
  ReporteActividadPorSereno,
  ReporteActividadPorUnidad,
  ReporteActividadPorZona,
  ReporteActividadPersonal,
  TipoPersonalActividad,
} from 'src/app/interfaces/reportes/reporte-actividad-operativa.interface';

// =========================================================
// OPCIONES DE SELECT
// =========================================================

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

@Component({
  selector: 'reporte-actividad-operativa',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    DecimalPipe,
  ],
  templateUrl:
    './reporte-actividad-operativa.component.html',
  styles: ``,
})
export class ReporteActividadOperativaComponent
  implements OnInit {

  // =========================================================
  // REPORTE
  // =========================================================

  reporte:
    ReporteActividadOperativaData | null = null;

  patrullajes:
    ReporteActividadDetalle[] = [];

  // =========================================================
  // ESTADOS DE UI
  // =========================================================

  isLoading = false;

  requestErrorMessage = '';
  filterErrorMessage = '';

  mostrarFiltrosAvanzados = false;

  // =========================================================
  // FILTROS APLICADOS
  // =========================================================

  filters: ReporteActividadFilters = {
    page: 1,
    limit: 10,

    fecha_inicio: '',
    fecha_fin: '',

    patrullaje_id: null,
    zona_id: null,
    unidad_id: null,
    usuario_id: null,

    estado_patrullaje: '',
    estado_asignacion: '',

    solo_con_incidencias: null,
    solo_finalizados: null,

    search: '',
  };

  // =========================================================
  // FILTROS DEL FORMULARIO
  // =========================================================

  filtrosFormulario:
    ReporteActividadFilters = {
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
  // OPCIONES
  // =========================================================

  readonly estadosPatrullaje:
    SelectOption<EstadoPatrullajeActividad>[] = [
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

  readonly estadosAsignacion:
    SelectOption<EstadoAsignacionActividad>[] = [
      {
        value: 'ASIGNADO',
        label: 'Asignado',
      },
      {
        value: 'ACEPTADO',
        label: 'Aceptado',
      },
      {
        value: 'RECHAZADO',
        label: 'Rechazado',
      },
      {
        value: 'EN_SERVICIO',
        label: 'En servicio',
      },
      {
        value: 'FINALIZADO',
        label: 'Finalizado',
      },
    ];

  // =========================================================
  // MODAL
  // =========================================================

  mostrarModalDetalle = false;

  patrullajeSeleccionado:
    ReporteActividadDetalle | null = null;

  constructor(
    private readonly reportesService:
      ReportesService,
  ) { }

  // =========================================================
  // CICLO DE VIDA
  // =========================================================

  ngOnInit(): void {
    this.getReporteActividadOperativa();
  }

  // =========================================================
  // CONSULTA
  // =========================================================

  getReporteActividadOperativa(): void {

    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    this.requestErrorMessage = '';
    this.filterErrorMessage = '';

    const filtrosConsulta:
      ReporteActividadFilters = {
      ...this.filters,

      page:
        this.currentPage,

      limit:
        this.limit,
    };

    this.reportesService
      .getReporteActividadOperativa(
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
              'No fue posible obtener el reporte de actividad operativa.';

            return;
          }

          this.reporte =
            response.data;

          this.patrullajes =
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
            'Error al obtener actividad operativa:',
            error,
          );

          this.limpiarResultado();

          this.requestErrorMessage =
            error?.error?.message ||
            error?.message ||
            'Ocurrió un error al consultar el reporte de actividad operativa.';
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

      search:
        this.filtrosFormulario
          .search
          ?.trim() || '',
    };

    this.getReporteActividadOperativa();
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
      estado_asignacion: '',

      solo_con_incidencias: null,
      solo_finalizados: null,

      search: '',
    };

    this.filtrosFormulario = {
      ...this.filters,
    };

    this.filterErrorMessage = '';
    this.requestErrorMessage = '';

    this.mostrarFiltrosAvanzados = false;

    this.getReporteActividadOperativa();
  }

  toggleFiltrosAvanzados(): void {

    this.mostrarFiltrosAvanzados =
      !this.mostrarFiltrosAvanzados;
  }

  reintentar(): void {
    this.getReporteActividadOperativa();
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
            'El ID del sereno',
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

    this.getReporteActividadOperativa();
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

    this.getReporteActividadOperativa();
  }

  get paginasVisibles(): number[] {

    if (this.totalPages <= 0) {
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
  // MODAL
  // =========================================================

  abrirDetalle(
    patrullaje:
      ReporteActividadDetalle,
  ): void {

    this.patrullajeSeleccionado =
      patrullaje;

    this.mostrarModalDetalle = true;
  }

  cerrarDetalle(): void {

    this.mostrarModalDetalle = false;

    this.patrullajeSeleccionado =
      null;
  }

  // =========================================================
  // RESUMEN
  // =========================================================

  get totalPatrullajes(): number {

    return (
      this.reporte
        ?.resumen
        .total_patrullajes ?? 0
    );
  }

  get totalEnCurso(): number {

    return (
      this.reporte
        ?.resumen
        .en_curso ?? 0
    );
  }

  get totalFinalizados(): number {

    return (
      this.reporte
        ?.resumen
        .finalizados ?? 0
    );
  }

  get totalPuntosGps(): number {

    return (
      this.reporte
        ?.resumen
        .total_puntos_gps ?? 0
    );
  }

  get totalIncidencias(): number {

    return (
      this.reporte
        ?.resumen
        .incidencias_registradas ?? 0
    );
  }

  get totalHistoriales(): number {

    return (
      this.reporte
        ?.resumen
        .historiales_registrados ?? 0
    );
  }

  get totalAlertas(): number {

    return (
      this.reporte
        ?.resumen
        .alertas_generadas ?? 0
    );
  }

  get horasOperativas(): number {

    return (
      this.reporte
        ?.resumen
        .horas_operativas ?? 0
    );
  }

  get distanciaTotalKm(): number {

    return (
      this.reporte
        ?.resumen
        .distancia_total_km ?? 0
    );
  }

  get porcentajeFinalizados(): number {

    if (this.totalPatrullajes === 0) {
      return 0;
    }

    return Number(
      (
        (
          this.totalFinalizados /
          this.totalPatrullajes
        ) *
        100
      ).toFixed(1),
    );
  }

  get porcentajeEnCurso(): number {

    if (this.totalPatrullajes === 0) {
      return 0;
    }

    return Number(
      (
        (
          this.totalEnCurso /
          this.totalPatrullajes
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
      EstadoPatrullajeActividad,
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
      EstadoPatrullajeActividad,
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
      EstadoPatrullajeActividad,
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
  // ESTADO DE ASIGNACIÓN
  // =========================================================

  getEstadoAsignacionLabel(
    estado:
      EstadoAsignacionActividad,
  ): string {

    return (
      this.estadosAsignacion.find(
        item =>
          item.value === estado,
      )?.label ??
      estado
    );
  }

  getEstadoAsignacionBadgeClass(
    estado:
      EstadoAsignacionActividad,
  ): string {

    switch (estado) {
      case 'ASIGNADO':
        return 'badge-warning';

      case 'ACEPTADO':
        return 'badge-info';

      case 'RECHAZADO':
        return 'badge-error';

      case 'EN_SERVICIO':
        return 'badge-primary';

      case 'FINALIZADO':
        return 'badge-success';

      default:
        return 'badge-ghost';
    }
  }

  // =========================================================
  // DATOS RELACIONADOS
  // =========================================================

  getZonaLabel(
    patrullaje:
      ReporteActividadDetalle,
  ): string {

    return (
      patrullaje.zona?.nombre ||
      `Zona #${patrullaje.zona_id}`
    );
  }

  getUnidadLabel(
    patrullaje:
      ReporteActividadDetalle,
  ): string {

    const unidad =
      patrullaje.unidad;

    if (!unidad) {
      return 'Sin unidad';
    }

    const placa =
      unidad.placa
        ? ` · ${unidad.placa}`
        : '';

    return `${unidad.codigo}${placa}`;
  }

  getSerenos(
    patrullaje:
      ReporteActividadDetalle,
  ): ReporteActividadPersonal[] {

    return patrullaje.personal.filter(
      personal =>
        personal.tipo_personal ===
        'SERENO',
    );
  }

  getPolicias(
    patrullaje:
      ReporteActividadDetalle,
  ): ReporteActividadPersonal[] {

    return patrullaje.personal.filter(
      personal =>
        personal.tipo_personal ===
        'POLICIA',
    );
  }

  getNombrePersonal(
    personal:
      ReporteActividadPersonal,
  ): string {

    const persona =
      personal.usuario
        ?.persona;

    if (persona) {
      return `${persona.nombres} ${persona.apellidos}`
        .trim();
    }

    if (
      personal.usuario
        ?.username
    ) {
      return personal.usuario
        .username;
    }

    if (
      personal.tipo_personal ===
      'POLICIA' &&
      personal.policia_id
    ) {
      return `Policía #${personal.policia_id}`;
    }

    return 'Personal no identificado';
  }

  getDocumentoPersonal(
    personal:
      ReporteActividadPersonal,
  ): string {

    return (
      personal.usuario
        ?.persona
        ?.documento_identidad ||
      'Sin documento'
    );
  }

  getFotoPersonal(
    personal:
      ReporteActividadPersonal,
  ): string {

    return (
      personal.usuario
        ?.persona
        ?.foto_perfil ||
      'assets/img/default-avatar.png'
    );
  }

  getPersonalPrincipal(
    patrullaje:
      ReporteActividadDetalle,
  ): ReporteActividadPersonal | null {

    return (
      this.getSerenos(
        patrullaje,
      )[0] ??
      patrullaje.personal[0] ??
      null
    );
  }

  // =========================================================
  // FORMATOS
  // =========================================================

  formatearDuracion(
    segundos:
      number | null | undefined,
  ): string {

    const total =
      Math.max(
        Math.floor(
          Number(segundos ?? 0),
        ),
        0,
      );

    if (total === 0) {
      return '0 min';
    }

    const horas =
      Math.floor(
        total / 3600,
      );

    const minutos =
      Math.floor(
        (
          total % 3600
        ) / 60,
      );

    if (horas > 0) {
      return `${horas} h ${minutos} min`;
    }

    return `${minutos} min`;
  }

  formatearDistancia(
    metros:
      number | null | undefined,
  ): string {

    const value =
      Number(
        metros ?? 0,
      );

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return '0 m';
    }

    if (value < 1000) {
      return `${value.toFixed(0)} m`;
    }

    return `${(
      value / 1000
    ).toFixed(2)} km`;
  }

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

    return `${Number(
      velocidad,
    ).toFixed(2)} m/s`;
  }

  // =========================================================
  // AGRUPACIONES
  // =========================================================

  getMaximoPatrullajesSereno(): number {

    const valores =
      this.reporte
        ?.por_sereno
        .map(
          item => item.patrullajes,
        ) ?? [];

    return valores.length > 0
      ? Math.max(...valores)
      : 0;
  }

  getPorcentajeSereno(
    item:
      ReporteActividadPorSereno,
  ): number {

    const maximo =
      this.getMaximoPatrullajesSereno();

    if (maximo <= 0) {
      return 0;
    }

    return Number(
      (
        item.patrullajes /
        maximo *
        100
      ).toFixed(1),
    );
  }

  getMaximoPatrullajesUnidad(): number {

    const valores =
      this.reporte
        ?.por_unidad
        .map(
          item => item.patrullajes,
        ) ?? [];

    return valores.length > 0
      ? Math.max(...valores)
      : 0;
  }

  getPorcentajeUnidad(
    item:
      ReporteActividadPorUnidad,
  ): number {

    const maximo =
      this.getMaximoPatrullajesUnidad();

    if (maximo <= 0) {
      return 0;
    }

    return Number(
      (
        item.patrullajes /
        maximo *
        100
      ).toFixed(1),
    );
  }

  getMaximoEventosZona(): number {

    const valores =
      this.reporte
        ?.por_zona
        .map(
          item =>
            item.incidencias +
            item.historiales +
            item.alertas,
        ) ?? [];

    return valores.length > 0
      ? Math.max(...valores)
      : 0;
  }

  getPorcentajeZona(
    item:
      ReporteActividadPorZona,
  ): number {

    const maximo =
      this.getMaximoEventosZona();

    const total =
      item.incidencias +
      item.historiales +
      item.alertas;

    if (maximo <= 0) {
      return 0;
    }

    return Number(
      (
        total /
        maximo *
        100
      ).toFixed(1),
    );
  }

  getMaximoPatrullajesFecha(): number {

    const valores =
      this.reporte
        ?.por_fecha
        .map(
          item => item.patrullajes,
        ) ?? [];

    return valores.length > 0
      ? Math.max(...valores)
      : 0;
  }

  getPorcentajeFecha(
    item:
      ReporteActividadPorFecha,
  ): number {

    const maximo =
      this.getMaximoPatrullajesFecha();

    if (maximo <= 0) {
      return 0;
    }

    return Number(
      (
        item.patrullajes /
        maximo *
        100
      ).toFixed(1),
    );
  }

  // =========================================================
  // UTILIDADES
  // =========================================================

  getTipoPersonalIcon(
    tipo:
      TipoPersonalActividad,
  ): string {

    switch (tipo) {
      case 'SERENO':
        return 'fa-solid fa-user-shield';

      case 'POLICIA':
        return 'fa-solid fa-shield-halved';

      default:
        return 'fa-solid fa-user';
    }
  }

  private limpiarResultado(): void {

    this.reporte = null;
    this.patrullajes = [];

    this.totalItems = 0;
    this.totalPages = 0;

    this.hasNextPage = false;
    this.hasPreviousPage = false;
  }
}
