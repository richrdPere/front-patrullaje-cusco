import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

// Service
import { IncidenciasService, } from 'src/app/services/incidencias.service';

// Interfaces
import { EstadoIncidencia, IncidenciaPaginada, } from 'src/app/interfaces/incidencia/incidencias.interface';
import { IncidenciaDetalle, } from 'src/app/interfaces/incidencia/incidencia_detalle.interface';

interface EstadoIncidenciaOption {
  value: EstadoIncidencia;
  label: string;
  descripcion: string;
  icon: string;
  badgeClass: string;
}

@Component({
  selector: 'incidencia-estado-form',
  standalone: true,
  imports: [CommonModule, FormsModule,],
  templateUrl: './incidencia-estado-form.component.html',
  styles: ``
})
export class IncidenciaEstadoFormComponent implements OnChanges {

  // INPUTS
  @Input() incidencia: IncidenciaDetalle | IncidenciaPaginada | null = null;
  @Input() visible = false;

  // OUTPUTS
  @Output() cerrar = new EventEmitter<void>();
  @Output() estadoActualizado = new EventEmitter<IncidenciaDetalle>();


  // ESTADO
  estadoSeleccionado: EstadoIncidencia | null = null;
  isSaving = false;
  errorMessage = '';

  // OPCIONES
  readonly estados: EstadoIncidenciaOption[] = [
    {
      value: 'REPORTADO',
      label: 'Reportado',
      descripcion:
        'La incidencia fue registrada y está pendiente de atención.',
      icon: 'fa-solid fa-circle-exclamation',
      badgeClass: 'badge-warning',
    },
    {
      value: 'EN_PROCESO',
      label: 'En proceso',
      descripcion:
        'La incidencia está siendo revisada o atendida por el personal.',
      icon: 'fa-solid fa-spinner',
      badgeClass: 'badge-info',
    },
    {
      value: 'ATENDIDO',
      label: 'Atendido',
      descripcion:
        'La intervención fue realizada y la incidencia fue atendida.',
      icon: 'fa-solid fa-circle-check',
      badgeClass: 'badge-success',
    },
    {
      value: 'CERRADO',
      label: 'Cerrado',
      descripcion:
        'La incidencia concluyó y no requiere más acciones.',
      icon: 'fa-solid fa-lock',
      badgeClass: 'badge-neutral',
    },
    // {
    //   value: 'ELIMINADO',
    //   label: 'Eliminado',
    //   descripcion:
    //     'La incidencia será marcada como eliminada.',
    //   icon: 'fa-solid fa-trash',
    //   badgeClass: 'badge-error',
    // },
  ];

  constructor(
    private incidenciasService: IncidenciasService,
  ) { }

  // CICLO DE VIDA
  ngOnChanges(changes: SimpleChanges): void {

    const incidenciaChange = changes['incidencia'];
    const visibleChange = changes['visible'];

    if (incidenciaChange || visibleChange?.currentValue === true) {
      this.inicializarFormulario();
    }

    if (visibleChange?.currentValue === false) {
      this.limpiarFormulario();
    }
  }

  // INICIALIZAR
  private inicializarFormulario(): void {

    this.errorMessage = '';

    this.estadoSeleccionado =
      this.incidencia?.estado ?? null;
  }

  private limpiarFormulario(): void {

    this.estadoSeleccionado = null;
    this.errorMessage = '';
    this.isSaving = false;
  }


  // VALIDACIONES
  get estadoActual(): EstadoIncidencia | null {
    return this.incidencia?.estado ?? null;
  }

  get estadoCambio(): boolean {

    return (
      this.estadoSeleccionado !== null &&
      this.estadoSeleccionado !== this.estadoActual
    );
  }

  get formularioValido(): boolean {

    return (
      !!this.incidencia?.id &&
      this.estadoSeleccionado !== null &&
      this.estadoCambio &&
      !this.isSaving
    );
  }

  /**
   * Define transiciones operativas válidas.
   *
   * Se permite regresar a REPORTADO o EN_PROCESO para corregir
   * estados asignados accidentalmente.
   */
  esTransicionValida(
    nuevoEstado: EstadoIncidencia,
  ): boolean {

    const actual = this.estadoActual;

    if (!actual) {
      return false;
    }

    if (nuevoEstado === actual) {
      return true;
    }

    const transiciones:
      Record<EstadoIncidencia, EstadoIncidencia[]> = {
      REPORTADO: [
        'EN_PROCESO',
        'ATENDIDO',
        'CERRADO',
        'ELIMINADO',
      ],

      EN_PROCESO: [
        'REPORTADO',
        'ATENDIDO',
        'CERRADO',
        'ELIMINADO',
      ],

      ATENDIDO: [
        'REPORTADO',
        'EN_PROCESO',
        'CERRADO',
        'ELIMINADO',
      ],

      CERRADO: [
        'REPORTADO',
        'EN_PROCESO',
        'ATENDIDO',
        'ELIMINADO',
      ],

      ELIMINADO: [
        'REPORTADO',
      ],
    };

    return transiciones[actual]
      .includes(nuevoEstado);
  }

  seleccionarEstado(
    estado: EstadoIncidencia,
  ): void {

    if (
      this.isSaving ||
      !this.esTransicionValida(estado)
    ) {
      return;
    }

    this.estadoSeleccionado = estado;
    this.errorMessage = '';
  }

  // =========================================================
  // ACTUALIZAR
  // =========================================================
  async guardarEstado(): Promise<void> {

    if (
      !this.incidencia?.id ||
      !this.estadoSeleccionado
    ) {
      this.errorMessage =
        'Seleccione un estado válido.';

      return;
    }

    if (!this.estadoCambio) {
      this.errorMessage =
        'Seleccione un estado diferente al actual.';

      return;
    }

    if (
      !this.esTransicionValida(
        this.estadoSeleccionado,
      )
    ) {
      this.errorMessage =
        'La transición de estado seleccionada no está permitida.';

      return;
    }

    const nuevoEstado =
      this.estadoSeleccionado;

    const confirmacion =
      await Swal.fire({
        icon: this.getConfirmacionIcon(
          nuevoEstado,
        ),
        title: '¿Actualizar estado?',
        html: `
          La incidencia
          <strong>#${this.incidencia.id}</strong>
          cambiará de
          <strong>${this.getEstadoLabel(this.estadoActual)}</strong>
          a
          <strong>${this.getEstadoLabel(nuevoEstado)}</strong>.
        `,
        showCancelButton: true,
        confirmButtonText: 'Sí, actualizar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        confirmButtonColor:
          nuevoEstado === 'ELIMINADO'
            ? '#dc2626'
            : undefined,
      });

    if (!confirmacion.isConfirmed) {
      return;
    }

    this.actualizarEstado(
      this.incidencia.id,
      nuevoEstado,
    );
  }

  private actualizarEstado(
    incidenciaId: number,
    estado: EstadoIncidencia,
  ): void {

    this.isSaving = true;
    this.errorMessage = '';

    this.incidenciasService
      .updateEstadoIncidencia(
        incidenciaId,
        estado,
      )
      .pipe(
        finalize(() => {
          this.isSaving = false;
        }),
      )
      .subscribe({
        next: response => {

          if (
            !response.success ||
            !response.data
          ) {
            this.errorMessage =
              response.message ||
              'No fue posible actualizar el estado.';

            return;
          }

          this.estadoActualizado.emit(
            response.data,
          );

          Swal.fire({
            icon: 'success',
            title: 'Estado actualizado',
            text:
              response.message ||
              'El estado de la incidencia fue actualizado correctamente.',
            timer: 1800,
            showConfirmButton: false,
          });

          this.cerrar.emit();
        },

        error: error => {

          console.error(
            'Error al actualizar estado de incidencia:',
            error,
          );

          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Ocurrió un error al actualizar el estado.';

          Swal.fire({
            icon: 'error',
            title: 'No se pudo actualizar',
            text: this.errorMessage,
          });
        },
      });
  }

  // =========================================================
  // MODAL
  // =========================================================
  cerrarModal(): void {

    if (this.isSaving) {
      return;
    }

    this.cerrar.emit();
  }

  // =========================================================
  // PRESENTACIÓN
  // =========================================================
  getEstadoOption(
    estado?: EstadoIncidencia | null,
  ): EstadoIncidenciaOption | undefined {

    if (!estado) {
      return undefined;
    }

    return this.estados.find(
      item => item.value === estado,
    );
  }

  getEstadoLabel(
    estado?: EstadoIncidencia | null,
  ): string {

    return (
      this.getEstadoOption(estado)?.label ||
      estado ||
      'Sin estado'
    );
  }

  getEstadoBadgeClass(
    estado?: EstadoIncidencia | null,
  ): string {

    return (
      this.getEstadoOption(estado)?.badgeClass ||
      'badge-ghost'
    );
  }

  getEstadoIcon(
    estado?: EstadoIncidencia | null,
  ): string {

    return (
      this.getEstadoOption(estado)?.icon ||
      'fa-solid fa-circle-question'
    );
  }

  private getConfirmacionIcon(
    estado: EstadoIncidencia,
  ): 'warning' | 'question' {

    return estado === 'ELIMINADO'
      ? 'warning'
      : 'question';
  }
}
