import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

// Service
import { AlertaService } from 'src/app/services/alerta.service';

// Interfaces
import {
  Alerta,
  AlertaDestinatario,
  PaginationDestinatarios,
  ResumenDestinatariosAlerta,
} from 'src/app/interfaces/alertas.interface';

// Components
import { AlertaFormComponent } from './alerta-form/alerta-form.component';

@Component({
  selector: 'app-alertas',
  // standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AlertaFormComponent,
  ],
  templateUrl: './alertas.component.html',
  styles: ``,
})
export class AlertasComponent implements OnInit {

  // ESTADOS DE CARGA
  cargandoAlertas = false;
  cargandoDestinatarios = false;

  cancelandoAlertaId: number | null = null;

  // DATOS PRINCIPALES
  alertas: Alerta[] = [];
  destinatariosDetalle: AlertaDestinatario[] = [];
  resumenDestinatarios: ResumenDestinatariosAlerta | null = null;
  paginationDestinatarios: PaginationDestinatarios | null = null;
  alertaDetalleCompleta: Alerta | null = null;

  // MODAL DEL FORMULARIO
  mostrarModalAlerta = false;
  modoEdicionAlerta = false;
  alertaFormularioSeleccionada: Alerta | null = null;

  mostrarModalDestinatarios = false;
  alertaDetalleSeleccionada: Alerta | null = null;


  // PAGINACIÓN
  paginaActual = 1;
  limite = 5;

  totalRegistros = 0;
  totalPaginas = 0;

  // FILTROS
  filtros = {
    estado: '',
    tipo: '',
    prioridad: '',
  };

  // ============================================================
  // CATÁLOGOS
  // Deben coincidir exactamente con los ENUM del backend.
  // ============================================================
  readonly estados = [
    'PENDIENTE',
    'EN_ATENCION',
    'ATENDIDA',
    'CANCELADA',
  ];

  readonly prioridades = [
    'BAJA',
    'MEDIA',
    'ALTA',
    'CRITICA',
  ];

  readonly tipos = [
    'PANICO',
    'INCIDENCIA',
    'EMERGENCIA',
    'SOS',
  ];

  constructor(
    private readonly alertaService: AlertaService,
  ) { }


  // CICLO DE VIDA
  ngOnInit(): void {
    this.loadAlertasEmitidas();
  }


  // MODAL CREAR / EDITAR ALERTA
  abrirModalCrearAlerta(): void {
    this.modoEdicionAlerta = false;
    this.alertaFormularioSeleccionada = null;
    this.mostrarModalAlerta = true;
  }

  abrirModalEditarAlerta(alerta: Alerta): void {
    this.modoEdicionAlerta = true;
    this.alertaFormularioSeleccionada = alerta;
    this.mostrarModalAlerta = true;
  }

  cerrarModalAlerta(): void {
    this.mostrarModalAlerta = false;
    this.modoEdicionAlerta = false;
    this.alertaFormularioSeleccionada = null;
  }

  onAlertaCreada(alerta?: Alerta | null): void {
    this.cerrarModalAlerta();
    this.paginaActual = 1;
    this.loadAlertasEmitidas();
  }

  // ============================================================
  // OBTENER ALERTAS EMITIDAS
  // ============================================================
  loadAlertasEmitidas(): void {
    if (this.cargandoAlertas) {
      return;
    }

    this.cargandoAlertas = true;

    this.alertaService
      .getAlertasEmitidas({
        page: this.paginaActual,
        limit: this.limite,
        estado: this.filtros.estado || undefined,
        tipo: this.filtros.tipo || undefined,
        prioridad: this.filtros.prioridad || undefined,
      })
      .pipe(
        finalize(() => {
          this.cargandoAlertas = false;
        }),
      )
      .subscribe({
        next: (response) => {
          const paginado = response?.data;

          this.alertas =
            this.extraerListaAlertas(paginado);

          this.totalRegistros =
            this.extraerTotalRegistros(paginado);

          this.totalPaginas =
            this.extraerTotalPaginas(paginado);

          /*
           * Si después de eliminar, cancelar o filtrar
           * quedamos en una página inexistente,
           * retrocedemos a la última página válida.
           */
          if (
            this.totalPaginas > 0 &&
            this.paginaActual > this.totalPaginas
          ) {
            this.paginaActual = this.totalPaginas;
            this.loadAlertasEmitidas();
          }
        },

        error: (error) => {
          this.alertas = [];
          this.totalRegistros = 0;
          this.totalPaginas = 0;

          Swal.fire({
            icon: 'error',
            title: 'Error al obtener alertas',
            text: this.obtenerMensajeError(error),
          });
        },
      });
  }

  // ============================================================
  // FILTROS
  // ============================================================
  aplicarFiltros(): void {
    this.paginaActual = 1;
    this.loadAlertasEmitidas();
  }

  onSearchChange(): void {
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.filtros = {
      estado: '',
      tipo: '',
      prioridad: '',
    };

    this.paginaActual = 1;
    this.loadAlertasEmitidas();
  }

  tieneFiltrosActivos(): boolean {
    return Boolean(
      this.filtros.estado ||
      this.filtros.tipo ||
      this.filtros.prioridad,
    );
  }

  // ============================================================
  // PAGINACIÓN
  // ============================================================
  paginaAnterior(): void {
    if (
      this.cargandoAlertas ||
      this.paginaActual <= 1
    ) {
      return;
    }

    this.paginaActual--;
    this.loadAlertasEmitidas();
  }
  paginaSiguiente(): void {
    if (this.cargandoAlertas) {
      return;
    }

    if (
      this.totalPaginas === 0 ||
      this.paginaActual >= this.totalPaginas
    ) {
      return;
    }

    this.paginaActual++;
    this.loadAlertasEmitidas();
  }

  cambiarPagina(pagina: number): void {
    if (
      this.cargandoAlertas ||
      pagina < 1 ||
      pagina === this.paginaActual
    ) {
      return;
    }

    if (
      this.totalPaginas > 0 &&
      pagina > this.totalPaginas
    ) {
      return;
    }

    this.paginaActual = pagina;
    this.loadAlertasEmitidas();
  }

  cambiarLimite(nuevoLimite: number | string): void {
    const limiteConvertido = Number(nuevoLimite);

    if (
      !Number.isFinite(limiteConvertido) ||
      limiteConvertido <= 0
    ) {
      return;
    }

    this.limite = limiteConvertido;
    this.paginaActual = 1;

    this.loadAlertasEmitidas();
  }

  get paginasVisibles(): number[] {
    if (this.totalPaginas <= 0) {
      return [];
    }

    const cantidadVisible = 5;

    let inicio = Math.max(
      1,
      this.paginaActual -
      Math.floor(cantidadVisible / 2),
    );

    let fin = Math.min(
      this.totalPaginas,
      inicio + cantidadVisible - 1,
    );

    /*
     * Ajustar el inicio cuando estamos cerca
     * de la última página.
     */
    inicio = Math.max(
      1,
      fin - cantidadVisible + 1,
    );

    const paginas: number[] = [];

    for (
      let pagina = inicio;
      pagina <= fin;
      pagina++
    ) {
      paginas.push(pagina);
    }

    return paginas;
  }

  get registroInicial(): number {
    if (this.totalRegistros === 0) {
      return 0;
    }

    return (
      (this.paginaActual - 1) *
      this.limite +
      1
    );
  }

  get registroFinal(): number {
    return Math.min(
      this.paginaActual * this.limite,
      this.totalRegistros,
    );
  }

  // ============================================================
  // OBTENER DESTINATARIOS
  // ============================================================
  verDestinatarios(alerta: Alerta): void {
    if (this.cargandoDestinatarios) {
      return;
    }

    this.alertaDetalleSeleccionada = alerta;
    this.alertaDetalleCompleta = null;

    this.destinatariosDetalle = [];
    this.resumenDestinatarios = null;
    this.paginationDestinatarios = null;

    this.mostrarModalDestinatarios = true;
    this.cargandoDestinatarios = true;

    this.alertaService
      .getDestinatarios(alerta.id)
      .pipe(
        finalize(() => {
          this.cargandoDestinatarios = false;
        }),
      )
      .subscribe({
        next: (response) => {
          const data = response?.data;

          console.log(
            'DATA DESTINATARIOS:',
            data,
          );

          this.alertaDetalleCompleta = data?.alerta ?? alerta;
          this.resumenDestinatarios = data?.resumen ?? null;
          this.destinatariosDetalle = Array.isArray(data?.destinatarios)
            ? data.destinatarios
            : [];

          this.paginationDestinatarios = data?.pagination ?? null;

          console.log('DATA DESTINATARIOS:', data,          );
        },

        error: (error) => {
          this.destinatariosDetalle = [];
          this.resumenDestinatarios = null;
          this.paginationDestinatarios = null;
          this.alertaDetalleCompleta = null;

          Swal.fire({
            icon: 'error',
            title:
              'No se pudieron obtener los destinatarios',
            text: this.obtenerMensajeError(error),
          }).then(() => {
            this.cerrarDetalleDestinatarios();
          });
        },
      });
  }

  cerrarDetalleDestinatarios(): void {
    if (this.cargandoDestinatarios) {
      return;
    }

    this.mostrarModalDestinatarios = false;

    this.alertaDetalleSeleccionada = null;
    this.alertaDetalleCompleta = null;

    this.destinatariosDetalle = [];
    this.resumenDestinatarios = null;
    this.paginationDestinatarios = null;
  }

  // ============================================================
  // CANCELAR ALERTA
  // ============================================================
  async cancelarAlerta(
    alerta: Alerta,
  ): Promise<void> {
    if (this.estaCancelando(alerta.id)) {
      return;
    }

    if (alerta.estado === 'CANCELADA') {
      await Swal.fire({
        icon: 'info',
        title: 'Alerta cancelada',
        text:
          'Esta alerta ya se encuentra cancelada.',
      });

      return;
    }

    if (alerta.estado === 'EXPIRADA') {
      await Swal.fire({
        icon: 'info',
        title: 'Alerta atendida',
        text:
          'No se puede cancelar una alerta que ya fue atendida.',
      });

      return;
    }

    const resultado = await Swal.fire({
      icon: 'warning',
      title: 'Cancelar alerta',

      html: `
        <p>
          ¿Desea cancelar la alerta
          <strong>${this.escaparHtml(alerta.titulo)}</strong>?
        </p>
      `,

      input: 'textarea',
      inputLabel: 'Motivo de cancelación',
      inputPlaceholder:
        'Ingrese el motivo de la cancelación',

      inputAttributes: {
        maxlength: '500',
        autocapitalize: 'sentences',
      },

      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar alerta',
      cancelButtonText: 'Volver',
      reverseButtons: true,
      confirmButtonColor: '#dc2626',
      showLoaderOnConfirm: true,

      inputValidator: (value) => {
        const observacion = value?.trim();

        if (!observacion) {
          return 'Ingrese el motivo de la cancelación.';
        }

        if (observacion.length < 5) {
          return 'El motivo debe contener al menos 5 caracteres.';
        }

        return null;
      },

      allowOutsideClick: () =>
        !Swal.isLoading(),
    });

    if (!resultado.isConfirmed) {
      return;
    }

    const observacion =
      String(resultado.value).trim();

    this.cancelandoAlertaId = alerta.id;

    this.alertaService
      .cancelarAlerta(
        alerta.id,
        observacion,
      )
      .pipe(
        finalize(() => {
          this.cancelandoAlertaId = null;
        }),
      )
      .subscribe({
        next: (response) => {
          Swal.fire({
            icon: 'success',
            title: 'Alerta cancelada',
            text:
              response?.message ??
              'La alerta fue cancelada correctamente.',
          });

          this.loadAlertasEmitidas();
        },

        error: (error) => {
          Swal.fire({
            icon: 'error',
            title:
              'No se pudo cancelar la alerta',
            text: this.obtenerMensajeError(error),
          });
        },
      });
  }

  estaCancelando(alertaId: number): boolean {
    return (
      this.cancelandoAlertaId === alertaId
    );
  }

  puedeCancelarAlerta(alerta: Alerta): boolean {
    return (
      alerta.estado !== 'CANCELADA' && alerta.estado !== 'EXPIRADA'
    );
  }

  // ============================================================
  // HELPERS DE PRESENTACIÓN
  // ============================================================

  obtenerClaseEstado(
    estado: string | null | undefined,
  ): string {
    const clases: Record<string, string> = {
      PENDIENTE: 'badge badge-warning badge-outline',
      EN_ATENCION: 'badge badge-info badge-outline',
      ATENDIDA: 'badge badge-success badge-outline',
      CANCELADA: 'badge badge-error badge-outline',
    };

    return (
      clases[estado ?? ''] ??
      'badge badge-ghost'
    );
  }

  obtenerClasePrioridad(
    prioridad: string | null | undefined,
  ): string {
    const clases: Record<string, string> = {
      BAJA: 'badge badge-ghost',
      MEDIA: 'badge badge-info',
      ALTA: 'badge badge-warning',
      CRITICA: 'badge badge-error',
    };

    return (
      clases[prioridad ?? ''] ??
      'badge badge-ghost'
    );
  }

  formatearTextoEnum(
    valor: string | null | undefined,
  ): string {
    if (!valor) {
      return 'Sin información';
    }

    return valor
      .toLowerCase()
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (letra) =>
        letra.toUpperCase(),
      );
  }

  trackByAlertaId(
    index: number,
    alerta: Alerta,
  ): number {
    return alerta.id;
  }

  trackByDestinatarioId(
    index: number,
    destinatario: AlertaDestinatario,
  ): number | string {
    return (
      (destinatario as any).id ??
      (destinatario as any).usuario_id ??
      index
    );
  }

  // ============================================================
  // EXTRAER RESPUESTA PAGINADA
  // ============================================================

  private extraerListaAlertas(
    paginado: unknown,
  ): Alerta[] {
    if (Array.isArray(paginado)) {
      return paginado;
    }

    if (
      !paginado ||
      typeof paginado !== 'object'
    ) {
      return [];
    }

    const value = paginado as {
      data?: Alerta[];
      items?: Alerta[];
      rows?: Alerta[];
      alertas?: Alerta[];
    };

    const lista =
      value.data ??
      value.items ??
      value.rows ??
      value.alertas ??
      [];

    return Array.isArray(lista)
      ? lista
      : [];
  }

  private extraerTotalRegistros(
    paginado: unknown,
  ): number {
    if (Array.isArray(paginado)) {
      return paginado.length;
    }

    if (
      !paginado ||
      typeof paginado !== 'object'
    ) {
      return 0;
    }

    const value = paginado as {
      total?: number;
      count?: number;
      totalRegistros?: number;
      total_items?: number;
      totalItems?: number;
    };

    return Number(
      value.total ??
      value.count ??
      value.totalRegistros ??
      value.total_items ??
      value.totalItems ??
      0,
    );
  }

  private extraerTotalPaginas(
    paginado: unknown,
  ): number {
    if (
      !paginado ||
      typeof paginado !== 'object'
    ) {
      return 0;
    }

    const value = paginado as {
      totalPages?: number;
      totalPaginas?: number;
      total_pages?: number;
      lastPage?: number;
    };

    const totalPaginas = Number(
      value.totalPages ??
      value.totalPaginas ??
      value.total_pages ??
      value.lastPage ??
      0,
    );

    if (totalPaginas > 0) {
      return totalPaginas;
    }

    if (this.totalRegistros === 0) {
      return 0;
    }

    return Math.ceil(
      this.totalRegistros / this.limite,
    );
  }

  // ============================================================
  // HELPERS GENERALES
  // ============================================================

  private obtenerMensajeError(
    error: any,
  ): string {
    return (
      error?.error?.message ??
      error?.error?.error ??
      error?.message ??
      'Ocurrió un error inesperado.'
    );
  }

  /**
   * Evita insertar directamente contenido no confiable
   * dentro del HTML de SweetAlert.
   */
  private escaparHtml(valor: string): string {
    return valor
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
