import {
  CommonModule,
  DatePipe,
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
  EstadoAlertaZonaCritica,
  EstadoIncidenciaZonaCritica,
  FuentePuntoGeografico,
  NivelCriticidad,
  PrioridadZonaCritica,
  ReportePuntoGeografico,
  ReporteZonaCriticaRanking,
  ReporteZonasCriticasData,
  ReporteZonasCriticasFilters,
  TipoAlertaZonaCritica,
  TipoHistorialZonaCritica,
  TipoIncidenciaZonaCritica,
} from 'src/app/interfaces/reportes/reporte-zonas-crititcas.interface';

// =========================================================
// INTERFACES AUXILIARES
// =========================================================

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface DistribucionItem<T extends string> {
  key: T;
  total: number;
}

@Component({
  selector: 'reporte-zonas-criticas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
  ],
  templateUrl:
    './reporte-zonas-criticas.component.html',
  styles: ``,
})
export class ReporteZonasCriticasComponent implements OnInit {

  // =========================================================
  // REPORTE
  // =========================================================

  reporte: ReporteZonasCriticasData | null = null;

  zonas: ReporteZonaCriticaRanking[] = [];

  // =========================================================
  // ESTADO DE UI
  // =========================================================

  isLoading = false;

  requestErrorMessage = '';
  filterErrorMessage = '';

  mostrarFiltrosAvanzados = false;
  mostrarCriterio = false;

  // =========================================================
  // FILTROS APLICADOS
  // =========================================================

  filters: ReporteZonasCriticasFilters = {
    fecha_inicio: '',
    fecha_fin: '',

    zona_id: null,
    unidad_id: null,
    patrullaje_id: null,
    usuario_id: null,

    tipo_incidencia: '',
    estado_incidencia: '',

    prioridad: '',

    tipo_alerta: '',
    estado_alerta: '',

    nivel_criticidad: '',

    incluir_sin_eventos: false,
    incluir_puntos: true,

    limite: 20,
  };

  // =========================================================
  // FILTROS DEL FORMULARIO
  // =========================================================

  filtrosFormulario: ReporteZonasCriticasFilters = {
    ...this.filters,
  };

  // =========================================================
  // OPCIONES
  // =========================================================

  readonly nivelesCriticidad:
    SelectOption<NivelCriticidad>[] = [
      {
        value: 'BAJO',
        label: 'Bajo',
      },
      {
        value: 'MEDIO',
        label: 'Medio',
      },
      {
        value: 'ALTO',
        label: 'Alto',
      },
      {
        value: 'CRITICO',
        label: 'Crítico',
      },
    ];

  readonly tiposIncidencia:
    SelectOption<TipoIncidenciaZonaCritica>[] = [
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

  readonly estadosIncidencia:
    SelectOption<EstadoIncidenciaZonaCritica>[] = [
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

  readonly prioridades:
    SelectOption<PrioridadZonaCritica>[] = [
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

  readonly tiposAlerta:
    SelectOption<TipoAlertaZonaCritica>[] = [
      {
        value: 'PANICO',
        label: 'Pánico',
      },
      {
        value: 'INCIDENCIA',
        label: 'Incidencia',
      },
      {
        value: 'EMERGENCIA',
        label: 'Emergencia',
      },
      {
        value: 'SOS',
        label: 'SOS',
      },
      {
        value: 'INFORMATIVA',
        label: 'Informativa',
      },
      {
        value: 'PREVENTIVA',
        label: 'Preventiva',
      },
      {
        value: 'CAMBIO_RUTA',
        label: 'Cambio de ruta',
      },
      {
        value: 'APOYO_REQUERIDO',
        label: 'Apoyo requerido',
      },
      {
        value: 'MENSAJE_CENTRAL',
        label: 'Mensaje de central',
      },
    ];

  readonly estadosAlerta:
    SelectOption<EstadoAlertaZonaCritica>[] = [
      {
        value: 'PENDIENTE',
        label: 'Pendiente',
      },
      {
        value: 'EN_ATENCION',
        label: 'En atención',
      },
      {
        value: 'ATENDIDA',
        label: 'Atendida',
      },
      {
        value: 'CANCELADA',
        label: 'Cancelada',
      },
      {
        value: 'EXPIRADA',
        label: 'Expirada',
      },
    ];

  readonly limitesDisponibles: number[] = [
    5,
    10,
    20,
    50,
    100,
  ];

  // =========================================================
  // MODAL DE DETALLE
  // =========================================================

  mostrarModalDetalle = false;

  zonaSeleccionada:
    ReporteZonaCriticaRanking | null = null;

  constructor(
    private readonly reportesService:
      ReportesService,
  ) { }

  // =========================================================
  // CICLO DE VIDA
  // =========================================================

  ngOnInit(): void {
    this.getReporteZonasCriticas();
  }

  // =========================================================
  // CONSULTA
  // =========================================================

  getReporteZonasCriticas(): void {

    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    this.requestErrorMessage = '';
    this.filterErrorMessage = '';

    this.reportesService
      .getReporteZonasCriticas(
        this.filters,
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
              'No fue posible obtener el reporte de zonas críticas.';

            return;
          }

          this.reporte =
            response.data;

          this.zonas =
            response.data.ranking;
        },

        error: error => {

          console.error(
            'Error al obtener reporte de zonas críticas:',
            error,
          );

          this.limpiarResultado();

          this.requestErrorMessage =
            error?.error?.message ||
            error?.message ||
            'Ocurrió un error al consultar el reporte de zonas críticas.';
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

    this.filters = {
      ...this.filtrosFormulario,
    };

    this.getReporteZonasCriticas();
  }

  limpiarFiltros(): void {

    this.filters = {
      fecha_inicio: '',
      fecha_fin: '',

      zona_id: null,
      unidad_id: null,
      patrullaje_id: null,
      usuario_id: null,

      tipo_incidencia: '',
      estado_incidencia: '',

      prioridad: '',

      tipo_alerta: '',
      estado_alerta: '',

      nivel_criticidad: '',

      incluir_sin_eventos: false,
      incluir_puntos: true,

      limite: 20,
    };

    this.filtrosFormulario = {
      ...this.filters,
    };

    this.filterErrorMessage = '';
    this.requestErrorMessage = '';

    this.mostrarFiltrosAvanzados = false;

    this.getReporteZonasCriticas();
  }

  reintentar(): void {
    this.getReporteZonasCriticas();
  }

  toggleFiltrosAvanzados(): void {

    this.mostrarFiltrosAvanzados =
      !this.mostrarFiltrosAvanzados;
  }

  toggleCriterio(): void {

    this.mostrarCriterio =
      !this.mostrarCriterio;
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
            this.filtrosFormulario.zona_id,
          label:
            'El ID de la zona',
        },
        {
          value:
            this.filtrosFormulario.unidad_id,
          label:
            'El ID de la unidad',
        },
        {
          value:
            this.filtrosFormulario.patrullaje_id,
          label:
            'El ID del patrullaje',
        },
        {
          value:
            this.filtrosFormulario.usuario_id,
          label:
            'El ID del usuario',
        },
      ];

    for (const field of numericFields) {

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

    const limite =
      Number(
        this.filtrosFormulario.limite,
      );

    if (
      !Number.isFinite(limite) ||
      limite <= 0 ||
      limite > 100
    ) {
      this.filterErrorMessage =
        'El límite debe encontrarse entre 1 y 100.';

      return false;
    }

    return true;
  }

  // =========================================================
  // MODAL
  // =========================================================

  abrirDetalle(
    zona: ReporteZonaCriticaRanking,
  ): void {

    this.zonaSeleccionada = zona;
    this.mostrarModalDetalle = true;
  }

  cerrarDetalle(): void {

    this.mostrarModalDetalle = false;
    this.zonaSeleccionada = null;
  }

  // =========================================================
  // INDICADORES
  // =========================================================

  get zonasAnalizadas(): number {

    return (
      this.reporte
        ?.resumen
        .zonas_analizadas ?? 0
    );
  }

  get zonasBajas(): number {

    return (
      this.reporte
        ?.resumen
        .zonas_bajas ?? 0
    );
  }

  get zonasMedias(): number {

    return (
      this.reporte
        ?.resumen
        .zonas_medias ?? 0
    );
  }

  get zonasAltas(): number {

    return (
      this.reporte
        ?.resumen
        .zonas_altas ?? 0
    );
  }

  get zonasCriticas(): number {

    return (
      this.reporte
        ?.resumen
        .zonas_criticas ?? 0
    );
  }

  get totalEventos(): number {

    return (
      this.reporte
        ?.resumen
        .total_eventos ?? 0
    );
  }

  get totalIncidencias(): number {

    return (
      this.reporte
        ?.resumen
        .total_incidencias ?? 0
    );
  }

  get totalHistoriales(): number {

    return (
      this.reporte
        ?.resumen
        .total_historiales ?? 0
    );
  }

  get totalAlertas(): number {

    return (
      this.reporte
        ?.resumen
        .total_alertas ?? 0
    );
  }

  get puntajeTotal(): number {

    return (
      this.reporte
        ?.resumen
        .puntaje_total ?? 0
    );
  }

  // =========================================================
  // NIVEL DE CRITICIDAD
  // =========================================================

  getNivelLabel(
    nivel: NivelCriticidad,
  ): string {

    return (
      this.nivelesCriticidad.find(
        item =>
          item.value === nivel,
      )?.label ??
      nivel
    );
  }

  getNivelBadgeClass(
    nivel: NivelCriticidad,
  ): string {

    switch (nivel) {
      case 'BAJO':
        return 'badge-success';

      case 'MEDIO':
        return 'badge-warning';

      case 'ALTO':
        return 'badge-error badge-outline';

      case 'CRITICO':
        return 'badge-error';

      default:
        return 'badge-ghost';
    }
  }

  getNivelTextClass(
    nivel: NivelCriticidad,
  ): string {

    switch (nivel) {
      case 'BAJO':
        return 'text-success';

      case 'MEDIO':
        return 'text-warning';

      case 'ALTO':
        return 'text-error';

      case 'CRITICO':
        return 'text-error';

      default:
        return 'text-base-content';
    }
  }

  getNivelBackgroundClass(
    nivel: NivelCriticidad,
  ): string {

    switch (nivel) {
      case 'BAJO':
        return 'bg-success/10';

      case 'MEDIO':
        return 'bg-warning/10';

      case 'ALTO':
        return 'bg-error/10';

      case 'CRITICO':
        return 'bg-error/20';

      default:
        return 'bg-base-200';
    }
  }

  getNivelIcon(
    nivel: NivelCriticidad,
  ): string {

    switch (nivel) {
      case 'BAJO':
        return 'fa-solid fa-shield';

      case 'MEDIO':
        return 'fa-solid fa-triangle-exclamation';

      case 'ALTO':
        return 'fa-solid fa-circle-exclamation';

      case 'CRITICO':
        return 'fa-solid fa-skull-crossbones';

      default:
        return 'fa-solid fa-location-dot';
    }
  }

  // =========================================================
  // DISTRIBUCIONES DINÁMICAS
  // =========================================================

  getEntries<T extends string>(
    data: Partial<Record<T, number>>,
  ): DistribucionItem<T>[] {

    return Object.entries(data)
      .map(([key, total]) => ({
        key: key as T,
        total: Number(total),
      }))
      .sort(
        (a, b) =>
          b.total - a.total,
      );
  }

  getIncidenciasPorTipo(
    zona: ReporteZonaCriticaRanking,
  ): DistribucionItem<TipoIncidenciaZonaCritica>[] {

    return this.getEntries(
      zona.incidencias_por_tipo,
    );
  }

  getIncidenciasPorEstado(
    zona: ReporteZonaCriticaRanking,
  ): DistribucionItem<EstadoIncidenciaZonaCritica>[] {

    return this.getEntries(
      zona.incidencias_por_estado,
    );
  }

  getHistorialesPorTipo(
    zona: ReporteZonaCriticaRanking,
  ): DistribucionItem<TipoHistorialZonaCritica>[] {

    return this.getEntries(
      zona.historiales_por_tipo,
    );
  }

  getAlertasPorTipo(
    zona: ReporteZonaCriticaRanking,
  ): DistribucionItem<TipoAlertaZonaCritica>[] {

    return this.getEntries(
      zona.alertas_por_tipo,
    );
  }

  // =========================================================
  // ETIQUETAS
  // =========================================================

  getTipoIncidenciaLabel(
    tipo: TipoIncidenciaZonaCritica,
  ): string {

    return (
      this.tiposIncidencia.find(
        item =>
          item.value === tipo,
      )?.label ??
      tipo
    );
  }

  getEstadoIncidenciaLabel(
    estado: EstadoIncidenciaZonaCritica,
  ): string {

    return (
      this.estadosIncidencia.find(
        item =>
          item.value === estado,
      )?.label ??
      estado
    );
  }

  getTipoHistorialLabel(
    tipo: TipoHistorialZonaCritica,
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

  getTipoAlertaLabel(
    tipo: TipoAlertaZonaCritica,
  ): string {

    return (
      this.tiposAlerta.find(
        item =>
          item.value === tipo,
      )?.label ??
      tipo
    );
  }

  // =========================================================
  // PUNTOS GEOGRÁFICOS
  // =========================================================

  getPuntosPorFuente(
    zona: ReporteZonaCriticaRanking,
    fuente: FuentePuntoGeografico,
  ): ReportePuntoGeografico[] {

    return zona.puntos_geograficos.filter(
      punto =>
        punto.fuente === fuente,
    );
  }

  getFuenteLabel(
    fuente: FuentePuntoGeografico,
  ): string {

    switch (fuente) {
      case 'INCIDENCIA':
        return 'Incidencia';

      case 'HISTORIAL':
        return 'Historial operativo';

      case 'ALERTA':
        return 'Alerta';

      default:
        return fuente;
    }
  }

  getFuenteBadgeClass(
    fuente: FuentePuntoGeografico,
  ): string {

    switch (fuente) {
      case 'INCIDENCIA':
        return 'badge-warning';

      case 'HISTORIAL':
        return 'badge-info';

      case 'ALERTA':
        return 'badge-error';

      default:
        return 'badge-ghost';
    }
  }

  abrirPuntoEnGoogleMaps(
    punto: ReportePuntoGeografico,
  ): void {

    if (
      !this.coordenadasValidas(
        punto.latitud,
        punto.longitud,
      )
    ) {
      return;
    }

    const url =
      'https://www.google.com/maps/search/?api=1' +
      `&query=${encodeURIComponent(
        `${punto.latitud},${punto.longitud}`,
      )}`;

    window.open(
      url,
      '_blank',
      'noopener,noreferrer',
    );
  }

  abrirZonaEnGoogleMaps(
    zona: ReporteZonaCriticaRanking,
  ): void {

    const coordenada =
      zona.coordenadas[0];

    if (
      !coordenada ||
      !this.coordenadasValidas(
        coordenada.lat,
        coordenada.lng,
      )
    ) {
      return;
    }

    const url =
      'https://www.google.com/maps/search/?api=1' +
      `&query=${encodeURIComponent(
        `${coordenada.lat},${coordenada.lng}`,
      )}`;

    window.open(
      url,
      '_blank',
      'noopener,noreferrer',
    );
  }

  tieneCoordenadas(
    zona: ReporteZonaCriticaRanking,
  ): boolean {

    return zona.coordenadas.some(
      coordenada =>
        this.coordenadasValidas(
          coordenada.lat,
          coordenada.lng,
        ),
    );
  }

  private coordenadasValidas(
    latitud: number,
    longitud: number,
  ): boolean {

    return (
      Number.isFinite(Number(latitud)) &&
      Number.isFinite(Number(longitud)) &&
      Number(latitud) >= -90 &&
      Number(latitud) <= 90 &&
      Number(longitud) >= -180 &&
      Number(longitud) <= 180
    );
  }

  // =========================================================
  // PORCENTAJES
  // =========================================================

  getMaximoPuntaje(): number {

    const valores =
      this.zonas.map(
        zona =>
          zona.puntaje.total,
      );

    return valores.length > 0
      ? Math.max(...valores)
      : 0;
  }

  getPorcentajePuntaje(
    zona: ReporteZonaCriticaRanking,
  ): number {

    const maximo =
      this.getMaximoPuntaje();

    if (maximo <= 0) {
      return 0;
    }

    return Number(
      (
        zona.puntaje.total /
        maximo *
        100
      ).toFixed(1),
    );
  }

  getMaximoEventosFecha(): number {

    const valores =
      this.reporte
        ?.por_fecha
        .map(
          item =>
            item.total_eventos,
        ) ?? [];

    return valores.length > 0
      ? Math.max(...valores)
      : 0;
  }

  getPorcentajeFecha(
    totalEventos: number,
  ): number {

    const maximo =
      this.getMaximoEventosFecha();

    if (maximo <= 0) {
      return 0;
    }

    return Number(
      (
        totalEventos /
        maximo *
        100
      ).toFixed(1),
    );
  }

  // =========================================================
  // UTILIDADES
  // =========================================================

  getRiesgoLabel(
    riesgo: string | null,
  ): string {

    if (!riesgo) {
      return 'No definido';
    }

    return riesgo
      .charAt(0)
      .toUpperCase() +
      riesgo
        .slice(1)
        .toLowerCase();
  }

  private limpiarResultado(): void {

    this.reporte = null;
    this.zonas = [];

    this.zonaSeleccionada = null;
    this.mostrarModalDetalle = false;
  }
}
