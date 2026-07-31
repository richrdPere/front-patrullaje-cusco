import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators, } from '@angular/forms';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/pages/shared/directives/uppercase.directive';

// Services
import { AlertaService } from 'src/app/services/alerta.service';
import { UsuarioService } from 'src/app/services/usuarios.service';

// Interfaces
import {
  Alerta,
  CrearAlertaRequest,
} from 'src/app/interfaces/alertas.interface';
import { Usuario } from 'src/app/interfaces/login/usuarioResponse';

interface SerenoOption {
  id: number;
  username: string;
  nombreCompleto: string;
  foto_perfil: string;
}

@Component({
  selector: 'alerta-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UppercaseDirective,
  ],
  templateUrl: './alerta-form.component.html',
  styles: ``,
})
export class AlertaFormComponent implements OnInit, OnChanges {

  @Input() mostrarModal = false;
  @Input() modoEdicion = false;
  @Input() alertaSeleccionada: Alerta | null = null;

  @Output() modalCerrado = new EventEmitter<void>();
  @Output() alertaCreada = new EventEmitter<Alerta | null>();


  // VARIABLES
  formAlerta!: FormGroup;

  isLoading = false;
  cargandoSerenos = false;

  serenazgos: SerenoOption[] = [];

  modalWidthClass = 'max-w-4xl';

  // CONFIGURACIÓN DEL MODAL
  setModalWidth(
    size: 'sm' | 'md' | 'lg' | 'xl' | 'full',
  ): void {
    const map: Record<
      'sm' | 'md' | 'lg' | 'xl' | 'full',
      string
    > = {
      sm: 'max-w-md',
      md: 'max-w-xl',
      lg: 'max-w-4xl',
      xl: 'max-w-6xl',
      full: 'max-w-full w-[95vw]',
    };

    this.modalWidthClass = map[size];
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly alertaService: AlertaService,
    private readonly usuarioService: UsuarioService,
  ) { }

  // CICLO DE VIDA
  ngOnInit(): void {
    this.initFormAlertas();
    this.loadSerenos();
  }

  ngOnChanges(changes: SimpleChanges): void {
    /*
     * ngOnChanges puede ejecutarse antes que ngOnInit.
     * Por eso verificamos que el formulario ya exista.
     */
    if (!this.formAlerta) {
      return;
    }

    if (
      changes['mostrarModal'] ||
      changes['modoEdicion'] ||
      changes['alertaSeleccionada']
    ) {
      this.configurarFormulario();
    }
  }

  cerrarModal(): void {
    if (this.isLoading) {
      return;
    }

    this.limpiarFormulario();
    this.modalCerrado.emit();
  }


  // FORMULARIO
  private initFormAlertas(): void {
    this.formAlerta = this.fb.group({
      titulo: ['', [Validators.required, Validators.maxLength(150),],],
      descripcion: ['', [Validators.required, Validators.maxLength(1000),],],
      tipo: ['OPERATIVA', Validators.required,],
      prioridad: ['MEDIA', Validators.required,],
      requiere_confirmacion: [true],
      patrullaje_id: [null as number | null],
      zona_id: [null as number | null],
      incidencia_id: [null as number | null],
      latitud: [null as number | null],
      longitud: [null as number | null],
      fecha_expiracion: [null as string | null],
      destinatarios: [[] as number[], [Validators.required, this.validarDestinatarios,],],
    });
  }

  /**
   * Configura el formulario cuando se abre el modal
   * o cambia la alerta seleccionada.
   */
  private configurarFormulario(): void {
    if (!this.mostrarModal) {
      return;
    }

    if (this.modoEdicion && this.alertaSeleccionada) {
      this.cargarAlertaEnFormulario(
        this.alertaSeleccionada,
      );
      return;
    }

    this.limpiarFormulario();
  }

  private cargarAlertaEnFormulario(alerta: Alerta): void {
    this.formAlerta.patchValue({
      titulo: alerta.titulo ?? '',
      descripcion: alerta.descripcion ?? '',
      tipo: alerta.tipo ?? 'OPERATIVA',
      prioridad: alerta.prioridad ?? 'MEDIA',
      requiere_confirmacion: alerta.requiere_confirmacion ?? true,
      patrullaje_id: alerta.patrullaje_id ?? null,
      zona_id: alerta.zona_id ?? null,
      incidencia_id: alerta.incidencia_id ?? null,
      latitud: this.convertirNumeroONull(alerta.latitud),
      longitud: this.convertirNumeroONull(alerta.longitud),
      fecha_expiracion: this.convertirFechaParaInput(alerta.fecha_expiracion,),
      destinatarios: this.obtenerIdsDestinatarios(alerta),
    });

    this.formAlerta.markAsPristine();
    this.formAlerta.markAsUntouched();
  }

  // ============================================================
  // CARGAR SERENOS
  // ============================================================
  loadSerenos(): void {
    this.cargandoSerenos = true;

    this.usuarioService
      .getSerenosAndConductores()
      .pipe(
        finalize(() => {
          this.cargandoSerenos = false;
        }),
      )
      .subscribe({
        next: (response: any) => {
          const serenazgosResponse = response.data ?? [];


          console.log("SERENAZGO: ", serenazgosResponse);

          this.serenazgos = Array.isArray(
            serenazgosResponse,
          )
            ? serenazgosResponse.map(
              (usuario: any): SerenoOption => ({
                id: Number(usuario.id),

                username:
                  usuario.username ??
                  usuario.usuario ??
                  'SIN USUARIO',

                nombreCompleto:
                  usuario.nombreCompleto ??
                  usuario.nombre_completo ??
                  this.construirNombreCompleto(usuario),

                foto_perfil: usuario.persona.foto_perfil
              }),
            )
            : [];

          /*
           * Si la alerta se abrió antes de terminar de cargar
           * los usuarios, volvemos a configurar el formulario.
           */
          if (
            this.mostrarModal &&
            this.modoEdicion &&
            this.alertaSeleccionada
          ) {
            this.cargarAlertaEnFormulario(
              this.alertaSeleccionada,
            );
          }
        },

        error: (error) => {
          this.serenazgos = [];

          Swal.fire({
            icon: 'error',
            title: 'No se pudieron cargar los serenos',
            text: this.obtenerMensajeError(error),
          });
        },
      });
  }

  // ============================================================
  // SELECCIÓN DE DESTINATARIOS
  // ============================================================
  cambiarSeleccionSereno(
    usuarioId: number,
    seleccionado: boolean,
  ): void {
    const control =
      this.formAlerta.get('destinatarios');

    const destinatariosActuales: number[] =
      control?.value ?? [];

    let nuevosDestinatarios: number[];

    if (seleccionado) {
      nuevosDestinatarios = [
        ...new Set([
          ...destinatariosActuales,
          usuarioId,
        ]),
      ];
    } else {
      nuevosDestinatarios =
        destinatariosActuales.filter(
          (id) => id !== usuarioId,
        );
    }

    control?.setValue(nuevosDestinatarios);
    control?.markAsDirty();
    control?.markAsTouched();
    control?.updateValueAndValidity();
  }

  estaSerenoSeleccionado(
    usuarioId: number,
  ): boolean {
    const destinatarios: number[] =
      this.formAlerta.get('destinatarios')?.value ??
      [];

    return destinatarios.includes(usuarioId);
  }

  seleccionarTodosLosSerenos(): void {
    const ids = this.serenazgos
      .map((sereno) => Number(sereno.id))
      .filter((id) => Number.isFinite(id));

    const control =
      this.formAlerta.get('destinatarios');

    control?.setValue(ids);
    control?.markAsDirty();
    control?.markAsTouched();
    control?.updateValueAndValidity();
  }

  limpiarSerenosSeleccionados(): void {
    const control =
      this.formAlerta.get('destinatarios');

    control?.setValue([]);
    control?.markAsDirty();
    control?.markAsTouched();
    control?.updateValueAndValidity();
  }

  // ============================================================
  // GUARDAR ALERTA
  // ============================================================
  guardarAlerta(): void {
    if (this.isLoading) {
      return;
    }

    if (this.formAlerta.invalid) {
      this.formAlerta.markAllAsTouched();

      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text:
          'Complete los campos obligatorios y seleccione al menos un sereno.',
      });

      return;
    }

    /*
     * Actualmente el servicio implementado solo posee creación.
     * Todavía no existe actualizarAlerta().
     */
    if (this.modoEdicion) {
      Swal.fire({
        icon: 'info',
        title: 'Edición no disponible',
        text:
          'El backend todavía no cuenta con un endpoint para actualizar alertas.',
      });

      return;
    }

    this.crearAlerta();
  }

  private crearAlerta(): void {
    const request = this.construirRequest();

    this.isLoading = true;

    this.alertaService
      .crearAlerta(request)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          Swal.fire({
            icon: 'success',
            title: 'Alerta enviada',
            text:
              response?.message ??
              'La alerta fue enviada correctamente.',
          }).then(() => {
            /*
             * Emitimos el dato al padre.
             * El padre será responsable de recargar la tabla.
             */
            this.alertaCreada.emit(
              response?.data ?? null,
            );

            this.limpiarFormulario();
            this.modalCerrado.emit();
          });
        },

        error: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'No se pudo enviar la alerta',
            text: this.obtenerMensajeError(error),
          });
        },
      });
  }

  private construirRequest(): CrearAlertaRequest {
    const formulario = this.formAlerta.getRawValue();

    return {
      titulo: formulario.titulo.trim(),
      descripcion: formulario.descripcion.trim(),
      tipo: formulario.tipo,
      prioridad: formulario.prioridad,
      requiere_confirmacion: Boolean(formulario.requiere_confirmacion),
      destinatarios: [
        ...new Set<number>(
          formulario.destinatarios.map(
            (id: number | string) => Number(id),
          ),
        ),
      ],
      patrullaje_id: this.convertirNumeroONull(formulario.patrullaje_id,),
      zona_id: this.convertirNumeroONull(formulario.zona_id,),
      incidencia_id: this.convertirNumeroONull(formulario.incidencia_id,),
      latitud: this.convertirNumeroONull(formulario.latitud,),
      longitud: this.convertirNumeroONull(formulario.longitud,),
      fecha_expiracion: this.convertirFechaAIso(formulario.fecha_expiracion,),
    };
  }

  // ============================================================
  // LIMPIAR FORMULARIO
  // ============================================================
  limpiarFormulario(): void {
    if (!this.formAlerta) {
      return;
    }

    this.formAlerta.reset({
      titulo: '',
      descripcion: '',
      tipo: 'OPERATIVA',
      prioridad: 'MEDIA',
      requiere_confirmacion: true,
      patrullaje_id: null,
      zona_id: null,
      incidencia_id: null,
      latitud: null,
      longitud: null,
      fecha_expiracion: null,
      destinatarios: [],
    });

    this.formAlerta.markAsPristine();
    this.formAlerta.markAsUntouched();
    this.formAlerta.updateValueAndValidity();
  }

  // ============================================================
  // HELPERS DE VALIDACIÓN
  // ============================================================
  private validarDestinatarios(
    control: AbstractControl,
  ): ValidationErrors | null {
    const destinatarios = control.value;

    if (
      !Array.isArray(destinatarios) ||
      destinatarios.length === 0
    ) {
      return {
        destinatariosRequeridos: true,
      };
    }

    return null;
  }

  // ============================================================
  // HELPERS DE DATOS
  // ============================================================
  private convertirNumeroONull(
    valor: unknown,
  ): number | null {
    if (
      valor === null ||
      valor === undefined ||
      valor === ''
    ) {
      return null;
    }

    const numero = Number(valor);

    return Number.isFinite(numero)
      ? numero
      : null;
  }

  private convertirFechaAIso(
    fecha: string | null,
  ): string | null {
    if (!fecha) {
      return null;
    }

    const fechaConvertida = new Date(fecha);

    if (
      Number.isNaN(fechaConvertida.getTime())
    ) {
      return null;
    }

    return fechaConvertida.toISOString();
  }

  /**
   * Convierte una fecha ISO al formato:
   * yyyy-MM-ddTHH:mm
   *
   * Es el formato utilizado por input datetime-local.
   */
  private convertirFechaParaInput(
    fecha: string | Date | null | undefined,
  ): string | null {
    if (!fecha) {
      return null;
    }

    const date = new Date(fecha);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    const offset = date.getTimezoneOffset();

    const fechaLocal = new Date(
      date.getTime() - offset * 60_000,
    );

    return fechaLocal
      .toISOString()
      .slice(0, 16);
  }

  private obtenerIdsDestinatarios(
    alerta: Alerta,
  ): number[] {
    const destinatarios =
      (alerta as any)?.destinatarios ?? [];

    if (!Array.isArray(destinatarios)) {
      return [];
    }

    return destinatarios
      .map((destinatario: any) => {
        const id =
          destinatario.usuario_id ??
          destinatario.destinatario_id ??
          destinatario.usuario?.id ??
          destinatario.id;

        return Number(id);
      })
      .filter(
        (id: number) => Number.isFinite(id),
      );
  }

  private construirNombreCompleto(
    usuario: any,
  ): string {
    const persona =
      usuario?.persona ?? usuario;

    const nombres = [
      persona?.nombres,
      persona?.apellido_paterno,
      persona?.apellido_materno,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    return nombres || usuario?.username || 'SIN NOMBRE';
  }

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

  // ============================================================
  // GETTERS PARA EL HTML
  // ============================================================

  get tituloControl(): AbstractControl | null {
    return this.formAlerta.get('titulo');
  }

  get descripcionControl(): AbstractControl | null {
    return this.formAlerta.get('descripcion');
  }

  get destinatariosControl(): AbstractControl | null {
    return this.formAlerta.get('destinatarios');
  }

  get totalDestinatariosSeleccionados(): number {
    const destinatarios =
      this.destinatariosControl?.value;

    return Array.isArray(destinatarios)
      ? destinatarios.length
      : 0;
  }
}
