import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription, debounceTime, finalize, forkJoin, merge } from 'rxjs';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/pages/shared/directives/uppercase.directive';

// Services
import { UnidadPatrullajeService } from 'src/app/services/unidad/unidad-patrullaje.service';
import { ZonaService } from 'src/app/services/zona/zona.service';
import { PatrullajeProgramadoService } from 'src/app/services/patrullaje/patrullaje_programado.service';

// Interfaces
import { CreatePatrullajeProgramadoRequest, ModalidadPatrullaje, TipoPatrullaje } from 'src/app/interfaces/patrullaje_programado/create-patrullaje-programado.model';
import { UpdatePatrullajeProgramadoRequest } from 'src/app/interfaces/patrullaje_programado/update-patrullaje-programado.model';
import { ApiErrorData } from 'src/app/pages/shared/interfaces/api-error-data.model';
import { PoliciaDisponibilidadData, SerenoDisponibilidadData } from 'src/app/interfaces/patrullaje_programado/get-personal-disponible.model';
import { PatrullajePaginatedItemData } from 'src/app/interfaces/patrullaje_programado/get-patrullajes-paginated.model';

@Component({
  selector: 'patrullaje-program-form',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    UppercaseDirective,
  ],
  templateUrl: './patrullaje-program-form.component.html',
  styles: ``,
})
export class PatrullajeProgramFormComponent implements OnInit, OnChanges, OnDestroy {

  // ========================================================
  // INPUTS Y OUTPUTS
  // ========================================================
  @Input() mostrarModal = false;
  @Input() modoEdicion = false;
  @Input() patrullajeSeleccionado: PatrullajePaginatedItemData | null = null;

  @Output() modalCerrado = new EventEmitter<void>();
  @Output() patrullajeCreado = new EventEmitter<void>();

  // ========================================================
  // LISTAS
  // ========================================================
  zonas: any[] = [];
  unidades: any[] = [];

  serenos: SerenoDisponibilidadData[] = [];
  policias: PoliciaDisponibilidadData[] = [];

  // ========================================================
  // FORMULARIO
  // ========================================================
  formPatrullaje!: FormGroup;

  // ========================================================
  // ESTADOS DE CARGA
  // ========================================================
  isLoadingCatalogs = false;
  isLoadingPersonal = false;
  isSaving = false;

  errorPersonal = '';

  // ========================================================
  // SUSCRIPCIONES
  // ========================================================
  private horarioSubscription?: Subscription;
  private personalRequestSubscription?: Subscription;
  private tipoSubscription?: Subscription;
  private modalidadSubscription?: Subscription;
  private saveSubscription: Subscription | null = null;

  // ========================================================
  // OPCIONES
  // ========================================================
  readonly tiposPatrullaje = [
    {
      value: 'A_PIE',
      label: 'A pie',
      descripcion: 'Patrullaje realizado sin una unidad vehicular.',
      icon: 'fa-person-walking',
    },
    {
      value: 'MOTORIZADO',
      label: 'Motorizado',
      descripcion: 'Patrullaje realizado con una unidad vehicular.',
      icon: 'fa-car-side',
    },
  ];

  readonly modalidadesPatrullaje = [
    {
      value: 'MUNICIPAL',
      label: 'Municipal',
      descripcion: 'Participa únicamente personal de Serenazgo.',
      icon: 'fa-user-shield',
    },
    {
      value: 'INTEGRADO',
      label: 'Integrado',
      descripcion: 'Participan serenos y efectivos policiales.',
      icon: 'fa-people-group',
    },
  ];

  // ========================================================
  // MODAL
  // ========================================================
  modalWidthClass = 'max-w-4xl';

  setModalWidth(
    size: 'sm' | 'md' | 'lg' | 'xl' | 'full',
  ): void {
    const map = {
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
    private readonly unidadService: UnidadPatrullajeService,
    private readonly zonaService: ZonaService,
    private readonly patrullajeService: PatrullajeProgramadoService,
  ) { }

  // ========================================================
  // CICLO DE VIDA
  // ========================================================

  ngOnInit(): void {
    this.initFormPatrullaje();
    this.configurarCambiosFormulario();
    this.getAllData();
    this.setModalWidth('lg');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.formPatrullaje) {
      return;
    }

    if (changes['mostrarModal'] && this.mostrarModal) {

      this.setModalWidth('lg');

      if (this.modoEdicion && this.patrullajeSeleccionado) {
        this.cargarPatrullajeEdicion(this.patrullajeSeleccionado);
      } else {
        this.prepararFormularioCreacion();
      }
    }

    if (
      changes['patrullajeSeleccionado'] &&
      this.mostrarModal &&
      this.modoEdicion &&
      this.patrullajeSeleccionado
    ) {
      this.cargarPatrullajeEdicion(
        this.patrullajeSeleccionado,
      );
    }

    if (
      changes['mostrarModal'] &&
      !this.mostrarModal
    ) {
      this.limpiarFormulario();
    }
  }

  ngOnDestroy(): void {
    this.horarioSubscription?.unsubscribe();
    this.personalRequestSubscription?.unsubscribe();
    this.tipoSubscription?.unsubscribe();
    this.modalidadSubscription?.unsubscribe();
    this.saveSubscription?.unsubscribe();
  }

  // ========================================================
  // FORMULARIO
  // ========================================================

  private initFormPatrullaje(): void {
    this.formPatrullaje = this.fb.group({
      id: [null],
      tipo_patrullaje: ['MOTORIZADO', Validators.required],
      modalidad_patrullaje: ['MUNICIPAL', Validators.required],
      unidad_id: [null, Validators.required],
      zona_id: [null, Validators.required],
      fecha: ['', Validators.required],
      hora_inicio: ['', Validators.required],
      hora_fin: ['', Validators.required],
      descripcion: ['', Validators.required],
      serenos: [[], Validators.required],
      policias: [[]],
    });

    this.prepararFormularioCreacion();
  }

  private configurarCambiosFormulario(): void {
    const fechaControl = this.formPatrullaje.get('fecha');

    const horaInicioControl = this.formPatrullaje.get('hora_inicio');

    const horaFinControl =
      this.formPatrullaje.get('hora_fin');

    if (
      fechaControl &&
      horaInicioControl &&
      horaFinControl
    ) {
      this.horarioSubscription = merge(
        fechaControl.valueChanges,
        horaInicioControl.valueChanges,
        horaFinControl.valueChanges,
      )
        .pipe(
          debounceTime(350),
        )
        .subscribe(() => {
          if (this.mostrarModal) {
            this.cargarPersonalDisponible();
          }
        });
    }

    this.tipoSubscription =
      this.formPatrullaje
        .get('tipo_patrullaje')
        ?.valueChanges
        .subscribe((tipo) => {
          this.actualizarValidadorUnidad(tipo);
        });

    this.modalidadSubscription =
      this.formPatrullaje
        .get('modalidad_patrullaje')
        ?.valueChanges
        .subscribe((modalidad) => {
          this.actualizarValidadorPolicias(
            modalidad,
          );
        });
  }

  private prepararFormularioCreacion(): void {
    const fechaHora =
      this.obtenerFechaHoraActual();

    this.formPatrullaje.reset(
      {
        id: null,
        tipo_patrullaje: 'MOTORIZADO',
        modalidad_patrullaje: 'MUNICIPAL',
        unidad_id: null,
        zona_id: null,
        fecha: fechaHora.fecha,
        hora_inicio: fechaHora.hora,
        hora_fin: '',
        descripcion: '',
        serenos: [],
        policias: [],
      },
      {
        emitEvent: true,
      },
    );

    this.actualizarValidadorUnidad(
      'MOTORIZADO',
    );

    this.actualizarValidadorPolicias(
      'MUNICIPAL',
    );

    this.serenos = [];
    this.policias = [];
    this.errorPersonal = '';
  }

  private cargarPatrullajeEdicion(
    patrullaje: any,
  ): void {
    const serenosIds =
      (patrullaje.serenos ?? [])
        .map((sereno: any) =>
          Number(sereno.id ?? sereno.value),
        )
        .filter(Number.isInteger);

    const policiasIds =
      (patrullaje.policias ?? [])
        .map((policia: any) =>
          Number(policia.id ?? policia.value),
        )
        .filter(Number.isInteger);

    const tipoPatrullaje =
      patrullaje.tipo_patrullaje ??
      (patrullaje.unidad
        ? 'MOTORIZADO'
        : 'A_PIE');

    const modalidadPatrullaje =
      patrullaje.modalidad_patrullaje ??
      (policiasIds.length > 0
        ? 'INTEGRADO'
        : 'MUNICIPAL');

    this.formPatrullaje.patchValue(
      {
        id: patrullaje.id,

        tipo_patrullaje:
          tipoPatrullaje,

        modalidad_patrullaje:
          modalidadPatrullaje,

        unidad_id:
          patrullaje.unidad_id ??
          patrullaje.unidad?.id ??
          null,

        zona_id:
          patrullaje.zona_id ??
          patrullaje.zona?.id ??
          null,

        fecha:
          this.normalizarFechaFormulario(
            patrullaje.fecha,
          ),

        hora_inicio:
          this.normalizarHoraFormulario(
            patrullaje.hora_inicio,
          ),

        hora_fin:
          this.normalizarHoraFormulario(
            patrullaje.hora_fin,
          ),

        descripcion:
          patrullaje.descripcion ?? '',

        serenos:
          serenosIds,

        policias:
          policiasIds,
      },
      {
        emitEvent: true,
      },
    );

    this.actualizarValidadorUnidad(
      tipoPatrullaje,
    );

    this.actualizarValidadorPolicias(
      modalidadPatrullaje,
    );

    /*
     * La carga explícita garantiza la consulta incluso si
     * Angular no detecta cambios en valores iguales.
     */
    this.cargarPersonalDisponible();
  }

  private actualizarValidadorUnidad(
    tipo: string,
  ): void {
    const unidadControl =
      this.formPatrullaje.get('unidad_id');

    if (!unidadControl) {
      return;
    }

    if (tipo === 'MOTORIZADO') {
      unidadControl.setValidators(
        Validators.required,
      );
    } else {
      unidadControl.clearValidators();

      unidadControl.setValue(
        null,
        {
          emitEvent: false,
        },
      );
    }

    unidadControl.updateValueAndValidity({
      emitEvent: false,
    });
  }

  private actualizarValidadorPolicias(
    modalidad: string,
  ): void {
    const policiasControl =
      this.formPatrullaje.get('policias');

    if (!policiasControl) {
      return;
    }

    if (modalidad === 'INTEGRADO') {
      policiasControl.setValidators(
        Validators.required,
      );
    } else {
      policiasControl.clearValidators();

      policiasControl.setValue(
        [],
        {
          emitEvent: false,
        },
      );
    }

    policiasControl.updateValueAndValidity({
      emitEvent: false,
    });
  }

  // ========================================================
  // CATÁLOGOS
  // ========================================================

  getAllData(): void {
    if (this.isLoadingCatalogs) {
      return;
    }

    this.isLoadingCatalogs = true;

    forkJoin({
      zonas:
        this.zonaService.getZonasSelect({}),

      unidades:
        this.unidadService.getUnidadesSelect(),
    })
      .pipe(
        finalize(() => {
          this.isLoadingCatalogs = false;
        }),
      )
      .subscribe({
        next: (response: any) => {
          this.zonas =
            response.zonas?.data?.items ??
            response.zonas?.data?.rows ??
            [];

          this.unidades =
            response.unidades?.data?.items ??
            response.unidades?.data?.unidades ??
            [];
        },

        error: (error) => {
          console.error(
            'Error cargando catálogos:',
            error,
          );

          this.zonas = [];
          this.unidades = [];

          void Swal.fire({
            icon: 'error',
            title:
              'No se pudieron cargar los datos',
            text:
              error?.message ||
              'No se pudieron obtener las zonas y unidades.',
          });
        },
      });
  }

  // ========================================================
  // PERSONAL DISPONIBLE
  // ========================================================

  cargarPersonalDisponible(): void {
    const fecha =
      this.formPatrullaje.get('fecha')?.value;

    const horaInicio =
      this.formPatrullaje
        .get('hora_inicio')
        ?.value;

    const horaFin =
      this.formPatrullaje
        .get('hora_fin')
        ?.value;

    if (
      !fecha ||
      !horaInicio ||
      !horaFin
    ) {
      this.cancelarCargaPersonal();
      return;
    }

    if (horaInicio >= horaFin) {
      this.cancelarCargaPersonal();

      this.errorPersonal =
        'La hora de inicio debe ser menor que la hora de finalización.';

      return;
    }

    const patrullajeId =
      Number(
        this.formPatrullaje
          .get('id')
          ?.value,
      );

    this.personalRequestSubscription
      ?.unsubscribe();

    this.isLoadingPersonal = true;
    this.errorPersonal = '';

    this.personalRequestSubscription =
      this.patrullajeService
        .getPersonalDisponibilidad({
          fecha,
          hora_inicio: horaInicio,
          hora_fin: horaFin,

          patrullaje_excluir_id:
            this.modoEdicion &&
              Number.isInteger(patrullajeId) &&
              patrullajeId > 0
              ? patrullajeId
              : undefined,
        })
        .pipe(
          finalize(() => {
            this.isLoadingPersonal = false;
          }),
        )
        .subscribe({
          next: (response) => {
            this.serenos =
              response.data.serenos ?? [];

            this.policias =
              response.data.policias ?? [];

            this.depurarSelecciones();
          },

          error: (error) => {
            console.error(
              'Error cargando disponibilidad:',
              error,
            );

            this.serenos = [];
            this.policias = [];

            this.errorPersonal =
              error?.message ||
              'No se pudo consultar la disponibilidad del personal.';
          },
        });
  }

  private cancelarCargaPersonal(): void {
    this.personalRequestSubscription
      ?.unsubscribe();

    this.isLoadingPersonal = false;
    this.serenos = [];
    this.policias = [];
  }

  /*
   * Si el operador cambia el horario, una persona que antes
   * estaba disponible podría tener ahora un conflicto.
   * En ese caso se elimina automáticamente de la selección.
   */
  private depurarSelecciones(): void {
    const serenosPermitidos = new Set(
      this.serenos
        .filter((item) => item.disponible)
        .map((item) => item.value),
    );

    const policiasPermitidos = new Set(
      this.policias
        .filter((item) => item.disponible)
        .map((item) => item.value),
    );

    const serenosSeleccionados: number[] =
      this.formPatrullaje
        .get('serenos')
        ?.value ?? [];

    const policiasSeleccionados: number[] =
      this.formPatrullaje
        .get('policias')
        ?.value ?? [];

    this.formPatrullaje.patchValue(
      {
        serenos:
          serenosSeleccionados.filter(
            (id) =>
              serenosPermitidos.has(
                Number(id),
              ),
          ),

        policias:
          policiasSeleccionados.filter(
            (id) =>
              policiasPermitidos.has(
                Number(id),
              ),
          ),
      },
      {
        emitEvent: false,
      },
    );
  }

  // ========================================================
  // SELECCIÓN DE PERSONAL
  // ========================================================

  toggleSereno(
    id: number,
    event: Event,
  ): void {
    const input =
      event.target as HTMLInputElement;

    const sereno =
      this.serenos.find(
        (item) => item.value === id,
      );

    if (
      input.checked &&
      !sereno?.disponible
    ) {
      input.checked = false;
      return;
    }

    this.actualizarSeleccion(
      'serenos',
      id,
      input.checked,
    );
  }

  togglePolicia(
    id: number,
    event: Event,
  ): void {
    const input =
      event.target as HTMLInputElement;

    const policia =
      this.policias.find(
        (item) => item.value === id,
      );

    if (
      input.checked &&
      !policia?.disponible
    ) {
      input.checked = false;
      return;
    }

    this.actualizarSeleccion(
      'policias',
      id,
      input.checked,
    );
  }

  private actualizarSeleccion(
    campo: 'serenos' | 'policias',
    id: number,
    checked: boolean,
  ): void {
    const control =
      this.formPatrullaje.get(campo);

    const seleccionActual: number[] =
      control?.value ?? [];

    const seleccion = new Set(
      seleccionActual.map(Number),
    );

    if (checked) {
      seleccion.add(id);
    } else {
      seleccion.delete(id);
    }

    control?.setValue(
      Array.from(seleccion),
    );

    control?.markAsTouched();
    control?.updateValueAndValidity();
  }

  isSerenoSeleccionado(
    id: number,
  ): boolean {
    const seleccionados: number[] =
      this.formPatrullaje
        .get('serenos')
        ?.value ?? [];

    return seleccionados
      .map(Number)
      .includes(id);
  }

  isPoliciaSeleccionado(
    id: number,
  ): boolean {
    const seleccionados: number[] =
      this.formPatrullaje
        .get('policias')
        ?.value ?? [];

    return seleccionados
      .map(Number)
      .includes(id);
  }



  /*
  |--------------------------------------------------------------------------
  | Crear o actualizar
  |--------------------------------------------------------------------------
  */

  crearOEditarPatrullaje(): void {
    if (
      this.formPatrullaje.invalid
    ) {
      this.formPatrullaje
        .markAllAsTouched();

      void Swal.fire({
        icon: 'warning',
        title:
          'Formulario incompleto',
        text:
          'Revise los campos obligatorios y el rango de horas.',
      });

      return;
    }

    const value =
      this.formPatrullaje
        .getRawValue();

    const tipo =
      value.tipo_patrullaje as
      TipoPatrullaje;

    const modalidad =
      value.modalidad_patrullaje as
      ModalidadPatrullaje;

    const payload:
      CreatePatrullajeProgramadoRequest = {
      unidad_id:
        tipo === 'MOTORIZADO'
          ? Number(
            value.unidad_id,
          )
          : null,

      zona_id:
        Number(value.zona_id),

      tipo_patrullaje:
        tipo,

      modalidad_patrullaje:
        modalidad,

      detalle_tipo_patrullaje:
        value
          .detalle_tipo_patrullaje
          ?.trim() ||
        null,

      fecha:
        value.fecha,

      hora_inicio:
        this.toBackendTime(
          value.hora_inicio,
        ),

      hora_fin:
        this.toBackendTime(
          value.hora_fin,
        ),

      descripcion:
        value.descripcion
          .trim(),

      serenos:
        value.serenos.map(
          Number,
        ),

      policias:
        modalidad ===
          'INTEGRADO'
          ? value.policias.map(
            Number,
          )
          : [],
    };

    this.isSaving = true;

    if (
      this.modoEdicion &&
      value.id
    ) {
      this.saveSubscription =
        this.patrullajeService
          .updatePatrullajeProgramado(
            Number(value.id),

            payload as
            UpdatePatrullajeProgramadoRequest,
          )
          .pipe(
            finalize(() => {
              this.isSaving = false;
            }),
          )
          .subscribe({
            next: (response) => {
              this.handleSuccess(
                response.message,
                'Patrullaje actualizado',
              );
            },

            error: (
              error:
                ApiErrorData,
            ) => {
              this.handleError(
                error,
                'No se pudo actualizar el patrullaje',
              );
            },
          });

      return;
    }

    this.saveSubscription =
      this.patrullajeService
        .newPatrullajeProgramado(
          payload,
        )
        .pipe(
          finalize(() => {
            this.isSaving = false;
          }),
        )
        .subscribe({
          next: (response) => {
            this.handleSuccess(
              response.message,
              'Patrullaje programado',
            );
          },

          error: (
            error:
              ApiErrorData,
          ) => {
            this.handleError(
              error,
              'No se pudo programar el patrullaje',
            );
          },
        });
  }


  // ========================================================
  // HELPERS
  // ========================================================

  esRequerido(
    campo: string,
  ): boolean {
    return (
      this.formPatrullaje
        .get(campo)
        ?.hasValidator(
          Validators.required,
        ) ?? false
    );
  }

  get tipoPatrullaje(): string {
    return (
      this.formPatrullaje
        ?.get('tipo_patrullaje')
        ?.value ?? ''
    );
  }

  get modalidadPatrullaje(): string {
    return (
      this.formPatrullaje
        ?.get('modalidad_patrullaje')
        ?.value ?? ''
    );
  }

  get totalSerenosDisponibles(): number {
    return this.serenos.filter(
      (item) => item.disponible,
    ).length;
  }

  get totalPoliciasDisponibles(): number {
    return this.policias.filter(
      (item) => item.disponible,
    ).length;
  }

  getEstadoOperativoLabel(
    estado: string,
  ): string {
    const labels: Record<string, string> = {
      DISPONIBLE: 'Disponible',
      ASIGNADO: 'Asignado',
      ACEPTADO: 'Aceptado',
      EN_SERVICIO: 'En servicio',
    };

    return labels[estado] ?? estado;
  }

  private obtenerFechaHoraActual(): {
    fecha: string;
    hora: string;
  } {
    const ahora = new Date();

    const year = ahora.getFullYear();
    const month = String(ahora.getMonth() + 1).padStart(2, '0');
    const day = String(ahora.getDate()).padStart(2, '0');
    const hours = String(ahora.getHours()).padStart(2, '0');
    const minutes = String(ahora.getMinutes()).padStart(2, '0');

    return {
      fecha: `${year}-${month}-${day}`,
      hora: `${hours}:${minutes}`,
    };
  }

  private normalizarFechaFormulario(fecha: string | null | undefined): string {
    if (!fecha) {
      return '';
    }

    return fecha.substring(0, 10);
  }

  private normalizarHoraFormulario(hora: string | null | undefined): string {
    if (!hora) {
      return '';
    }

    return hora.substring(0, 5);
  }

  private limpiarFormulario(): void {
    this.personalRequestSubscription?.unsubscribe();

    this.isLoadingPersonal = false;
    this.isSaving = false;

    this.serenos = [];
    this.policias = [];
    this.errorPersonal = '';

    this.formPatrullaje.reset(
      {
        id: null,
        tipo_patrullaje: 'MOTORIZADO',
        modalidad_patrullaje: 'MUNICIPAL',
        unidad_id: null,
        zona_id: null,
        fecha: '',
        hora_inicio: '',
        hora_fin: '',
        descripcion: '',
        serenos: [],
        policias: [],
      },
      {
        emitEvent: false,
      },
    );
  }

  private handleSuccess(
    message: string,
    title: string,
  ): void {
    void Swal.fire({
      icon: 'success',
      title,
      text: message,
      timer: 1800,
      showConfirmButton: false,
    });

    this.patrullajeCreado.emit();
    this.cerrarModal();
  }

  private handleError(
    error: ApiErrorData,
    title: string,
  ): void {
    void Swal.fire({
      icon: 'error',
      title,

      text:
        error.message ||
        'Ocurrió un error inesperado.',
    });
  }

  private toBackendTime(
    time: string,
  ): string {
    return time.length === 5
      ? `${time}:00`
      : time;
  }

  cerrarModal(): void {
    if (this.isSaving) {
      return;
    }

    this.limpiarFormulario();
    this.modalCerrado.emit();
  }
}
// import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
// import { Subject, Subscription, finalize, forkJoin, takeUntil } from 'rxjs';
// import Swal from 'sweetalert2';

// // Directives
// import { UppercaseDirective } from 'src/app/pages/shared/directives/uppercase.directive';

// // Services
// import { UnidadPatrullajeService } from 'src/app/services/unidad/unidad-patrullaje.service';
// import { ZonaService } from 'src/app/services/zona/zona.service';
// import { PatrullajeProgramadoService } from 'src/app/services/patrullaje/patrullaje_programado.service';
// import { UsuarioService } from 'src/app/services/usuarios/usuarios.service';
// import { PoliciasService } from 'src/app/services/usuarios/policias.service';

// // Interfaces
// import { UnidadPatrullajeSelectItem } from 'src/app/interfaces/unidad-patrullaje/get-unidades-select.model';
// import { ZonaSelectItem } from 'src/app/interfaces/zona/get-zonas-select.model';

// import { ApiErrorData } from 'src/app/pages/shared/interfaces/api-error-data.model';
// import { PatrullajeByIdData } from 'src/app/interfaces/patrullaje_programado/get-patrullaje-by-id.model';
// import { PoliciaSelectItem } from 'src/app/interfaces/policia/selected-policia.model';
// import { CreatePatrullajeProgramadoRequest, TipoPatrullaje } from 'src/app/interfaces/patrullaje_programado/create-patrullaje-programado.model';
// import { UpdatePatrullajeProgramadoRequest } from 'src/app/interfaces/patrullaje_programado/update-patrullaje-programado.model';
// import { PoliciaDisponibilidadData, SerenoDisponibilidadData } from 'src/app/interfaces/patrullaje_programado/get-personal-disponible.model';

// type ModalidadPatrullaje =
//   | 'MUNICIPAL'
//   | 'INTEGRADO';

// interface SerenoSelectItem {
//   id?: number;
//   value?: number;
//   label?: string;
//   descripcion?: string;

//   persona?: {
//     nombres?: string;
//     apellidos?: string;
//   };

//   roles?: Array<string | { nombre: string; }
//   >;
// }

// //  Validar cantidad mínima de elementos
// const minArrayLength = (minimum: number): ValidatorFn => {
//   return (control: AbstractControl): ValidationErrors | null => {
//     const value = control.value;

//     if (!Array.isArray(value) || value.length < minimum) {
//       return {
//         minArrayLength: {
//           requiredLength: minimum,
//           actualLength:
//             Array.isArray(value)
//               ? value.length
//               : 0,
//         },
//       };
//     }

//     return null;
//   };
// };

// // Validar rango de horas
// const timeRangeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
//   const horaInicio = control.get('hora_inicio')?.value;
//   const horaFin = control.get('hora_fin')?.value;

//   if (!horaInicio || !horaFin) {
//     return null;
//   }

//   if (horaFin <= horaInicio) {
//     return {
//       invalidTimeRange: true,
//     };
//   }

//   return null;
// };

// @Component({
//   selector: 'patrullaje-program-form',
//   imports: [
//     ReactiveFormsModule,
//     CommonModule,
//     UppercaseDirective,
//   ],
//   templateUrl: './patrullaje-program-form.component.html',
//   styles: ``,
// })
// export class PatrullajeProgramFormComponent implements OnInit, OnChanges, OnDestroy {

//   @Input() mostrarModal = false;
//   @Input() modoEdicion = false;
//   @Input() patrullajeSeleccionado: PatrullajeByIdData | null = null;

//   @Output() modalCerrado = new EventEmitter<void>();
//   @Output() patrullajeCreado = new EventEmitter<void>();

//   // FORMULARIO
//   formPatrullaje!: FormGroup;

//   // LISTAS
//   zonas: ZonaSelectItem[] = [];
//   unidades: UnidadPatrullajeSelectItem[] = [];
//   serenos: SerenoSelectItem[] = [];
//   policias: PoliciaSelectItem[] | PoliciaDisponibilidadData[]= [];
//   // serenos: SerenoSelectItem[] = [];
//   // policias: PoliciaSelectItem[] = [];

//   isLoadingPersonal = false;
//   isLoadingCatalogs = false;
//   isSaving = false;

//   modalWidthClass = 'max-w-6xl';

//   setModalWidth(size: 'sm' | 'md' | 'lg' | 'xl' | 'full') {
//     const map = {
//       sm: 'max-w-md',
//       md: 'max-w-xl',
//       lg: 'max-w-4xl',
//       xl: 'max-w-6xl',
//       full: 'max-w-full w-[95vw]'
//     };

//     this.modalWidthClass = map[size];
//   }

//   fechaMinima = '';


//   // SUSCRIPCIONES
//   private horarioSubscription?: Subscription;
//   private personalRequestSubscription?: Subscription;
//   private tipoSubscription?: Subscription;
//   private modalidadSubscription?: Subscription;

//   // OPCIONES
//   readonly tiposPatrullaje: Array<{
//     value: TipoPatrullaje;
//     label: string;
//     descripcion: string;
//     icon: string;
//   }> = [
//       {
//         value: 'A_PIE',
//         label: 'A pie',
//         descripcion:
//           'Patrullaje realizado mediante desplazamiento peatonal.',
//         icon: 'fa-person-walking',
//       },
//       {
//         value: 'MOTORIZADO',
//         label: 'Motorizado',
//         descripcion:
//           'Patrullaje realizado utilizando una unidad vehicular.',
//         icon: 'fa-car-side',
//       },
//     ];

//   readonly modalidadesPatrullaje: Array<{
//     value: ModalidadPatrullaje;
//     label: string;
//     descripcion: string;
//     icon: string;
//   }> = [
//       {
//         value: 'MUNICIPAL',
//         label: 'Municipal',
//         descripcion:
//           'Participación exclusiva del personal de Serenazgo.',
//         icon: 'fa-shield-halved',
//       },
//       {
//         value: 'INTEGRADO',
//         label: 'Integrado',
//         descripcion:
//           'Participación conjunta de serenos y Policía Nacional.',
//         icon: 'fa-people-group',
//       },
//     ];

//   private catalogsSubscription: Subscription | null = null;
//   private saveSubscription: Subscription | null = null;
//   private readonly destroy$ = new Subject<void>();

//   constructor(
//     private fb: FormBuilder,
//     private unidadService: UnidadPatrullajeService,
//     private zonaService: ZonaService,
//     private usuarioService: UsuarioService,
//     private policiaService: PoliciasService,
//     private patrullajeService: PatrullajeProgramadoService,
//   ) { }

//   ngOnInit(): void {
//     this.initFormPatrullaje();
//     this.listenConditionalFields();
//     this.setModalWidth('lg');

//     if (this.mostrarModal) {
//       this.prepareModal();
//     }
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (!this.formPatrullaje) {
//       return;
//     }

//     const modalOpened = changes['mostrarModal']?.currentValue === true;
//     const patrolChanged = Boolean(changes['patrullajeSeleccionado']);

//     if (modalOpened || (this.mostrarModal && patrolChanged)) {
//       this.prepareModal();
//     }

//     if (changes['mostrarModal'] && !this.mostrarModal) {
//       this.resetForm();
//     }
//   }

//   ngOnDestroy(): void {
//     this.catalogsSubscription?.unsubscribe();
//     this.saveSubscription?.unsubscribe();
//     this.horarioSubscription?.unsubscribe();
//     this.personalRequestSubscription?.unsubscribe();
//     this.tipoSubscription?.unsubscribe();
//     this.modalidadSubscription?.unsubscribe();

//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   // ====================================
//   // Inicializar formulario
//   // ====================================
//   private initFormPatrullaje(): void {
//     this.formPatrullaje = this.fb.group({
//       id: [null],

//       tipo_patrullaje: ['MOTORIZADO', Validators.required],
//       modalidad_patrullaje: ['MUNICIPAL', Validators.required],
//       detalle_tipo_patrullaje: [null, Validators.maxLength(150)],
//       unidad_id: [null, Validators.required],
//       zona_id: [null, Validators.required],
//       fecha: ['', Validators.required],
//       hora_inicio: ['', Validators.required],
//       hora_fin: ['', Validators.required],
//       descripcion: ['', [Validators.required, Validators.maxLength(1000)]],
//       serenos: [[], minArrayLength(1)],
//       policias: [[]],
//     },
//       {
//         validators:
//           timeRangeValidator,
//       },
//     );
//   }

//   private listenConditionalFields(): void {
//     this.formPatrullaje.get('tipo_patrullaje')?.valueChanges
//       .pipe(
//         takeUntil(this.destroy$),
//       )
//       .subscribe(
//         (
//           tipo: TipoPatrullaje,
//         ) => {
//           this.updateUnidadValidators(
//             tipo,
//           );
//         },
//       );

//     this.formPatrullaje.get('modalidad_patrullaje')?.valueChanges
//       .pipe(
//         takeUntil(this.destroy$),
//       )
//       .subscribe(
//         (
//           modalidad: ModalidadPatrullaje,
//         ) => {
//           this.updatePoliciaValidators(modalidad);
//         },
//       );
//   }

//   private updateUnidadValidators(tipo: TipoPatrullaje): void {
//     const control = this.formPatrullaje.get('unidad_id');

//     if (!control) {
//       return;
//     }

//     if (tipo === 'MOTORIZADO') {
//       control.setValidators(
//         Validators.required,
//       );
//     } else {
//       control.clearValidators();

//       control.setValue(
//         null,
//         {
//           emitEvent: false,
//         },
//       );
//     }

//     control.updateValueAndValidity({ emitEvent: false });
//   }

//   private updatePoliciaValidators(modalidad: ModalidadPatrullaje): void {
//     const control = this.formPatrullaje.get('policias');

//     if (!control) {
//       return;
//     }

//     if (modalidad === 'INTEGRADO') {
//       control.setValidators(
//         minArrayLength(1),
//       );
//     } else {
//       control.clearValidators();

//       control.setValue(
//         [],
//         {
//           emitEvent: false,
//         },
//       );
//     }

//     control.updateValueAndValidity({
//       emitEvent: false,
//     });
//   }

//   // ====================================
//   // Preparar modal
//   // ====================================
//   private prepareModal(): void {
//     if (this.modoEdicion && this.patrullajeSeleccionado) {
//       this.patchEditForm(this.patrullajeSeleccionado);
//     } else {
//       this.resetForm();
//     }

//     const unidadId = this.patrullajeSeleccionado?.unidad_id ?? undefined;

//     this.getAllData(unidadId);
//   }

//   private patchEditForm(patrullaje: PatrullajeByIdData): void {
//     const serenosIds = patrullaje.serenos.map(
//       (sereno) =>
//         sereno.usuario_id,
//     );

//     const policiasIds = patrullaje.policias.map(
//       (policia) =>
//         policia.policia_id,
//     );

//     this.formPatrullaje.reset(
//       {
//         id: patrullaje.id,
//         unidad_id: patrullaje.unidad_id,
//         zona_id: patrullaje.zona_id,
//         tipo_patrullaje: patrullaje.tipo_patrullaje,
//         modalidad_patrullaje: patrullaje.modalidad_patrullaje,
//         detalle_tipo_patrullaje: patrullaje.detalle_tipo_patrullaje,
//         fecha: patrullaje.fecha,
//         hora_inicio: this.toInputTime(patrullaje.hora_inicio),
//         hora_fin: this.toInputTime(patrullaje.hora_fin),
//         descripcion: patrullaje.descripcion,
//         serenos: serenosIds,
//         policias: policiasIds,
//       },
//       {
//         emitEvent: false,
//       },
//     );

//     this.updateUnidadValidators(patrullaje.tipo_patrullaje);

//     this.updatePoliciaValidators(patrullaje.modalidad_patrullaje);
//   }

//   /*
//   |--------------------------------------------------------------------------
//   | Cargar selectores
//   |--------------------------------------------------------------------------
//   */
//   cargarPersonalDisponible(): void {
//     const fecha = this.formPatrullaje.get('fecha')?.value;
//     const horaInicio = this.formPatrullaje.get('hora_inicio')?.value;
//     const horaFin = this.formPatrullaje.get('hora_fin')?.value;

//     if (!fecha || !horaInicio || !horaFin) {
//       this.serenos = [];
//       this.policias = [];
//       return;
//     }

//     const patrullajeExcluirId = this.modoEdicion
//       ? this.formPatrullaje.get('id')?.value
//       : undefined;

//     this.isLoadingPersonal = true;

//     this.patrullajeService.getPersonalDisponibilidad({
//       fecha,
//       hora_inicio: horaInicio,
//       hora_fin: horaFin,
//       patrullaje_excluir_id: patrullajeExcluirId || undefined,
//     })
//       .pipe(
//         finalize(() => {
//           this.isLoadingPersonal = false;
//         }),
//       )
//       .subscribe({
//         next: (response) => {
//           this.serenos = response.data.serenos;
//           this.policias = response.data.policias;
//         },

//         error: (error) => {
//           this.serenos = [];
//           this.policias = [];

//           void Swal.fire({
//             icon: 'error',
//             title:
//               'No se pudo cargar el personal',
//             text:
//               error.message ||
//               'Ocurrió un error al consultar la disponibilidad.',
//           });
//         },
//       });
//   }

//   private getAllData(
//     includeUnidadId?: number,
//   ): void {
//     this.catalogsSubscription
//       ?.unsubscribe();

//     this.isLoadingCatalogs = true;

//     this.catalogsSubscription =
//       forkJoin({
//         zonas: this.zonaService.getZonasSelect({}),
//         unidades: this.unidadService.getUnidadesSelect(),
//         serenos: this.usuarioService.getSerenosAndConductores(),
//         policias: this.policiaService.getPoliciasSelect(),
//       })
//         .pipe(
//           finalize(() => {
//             this.isLoadingCatalogs =
//               false;
//           }),
//         )
//         .subscribe({
//           next: (responses) => {
//             this.zonas = responses.zonas.data.items;

//             this.unidades =
//               responses.unidades
//                 .data.items;

//             this.policias =
//               responses.policias
//                 .data.items;

//             const serenosData:
//               any =
//               responses.serenos
//                 .data;

//             this.serenos =
//               Array.isArray(
//                 serenosData,
//               )
//                 ? serenosData
//                 : serenosData
//                   ?.items ??
//                 [];
//           },

//           error: (
//             error: ApiErrorData,
//           ) => {
//             this.zonas = [];
//             this.unidades = [];
//             this.serenos = [];
//             this.policias = [];

//             void Swal.fire({
//               icon: 'error',

//               title:
//                 'No se pudieron cargar los selectores',

//               text:
//                 error.message ||
//                 'Ocurrió un error al cargar los datos del formulario.',
//             });
//           },
//         });
//   }

//   /*
//   |--------------------------------------------------------------------------
//   | Serenos
//   |--------------------------------------------------------------------------
//   */

//   getSerenoId(
//     sereno:
//       SerenoSelectItem,
//   ): number {
//     return Number(
//       sereno.value ??
//       sereno.id,
//     );
//   }

//   getSerenoLabel(
//     sereno:
//       SerenoSelectItem,
//   ): string {
//     if (sereno.label) {
//       return sereno.label;
//     }

//     return [
//       sereno.persona?.nombres,
//       sereno.persona?.apellidos,
//     ]
//       .filter(Boolean)
//       .join(' ');
//   }

//   getSerenoRoles(
//     sereno:
//       SerenoSelectItem,
//   ): string {
//     return (
//       sereno.roles
//         ?.map((role) =>
//           typeof role === 'string'
//             ? role
//             : role.nombre,
//         )
//         .join(', ') ||
//       'SERENO'
//     );
//   }

//   isSerenoSelected(
//     id: number,
//   ): boolean {
//     const selected:
//       number[] =
//       this.formPatrullaje
//         .get('serenos')
//         ?.value ?? [];

//     return selected.includes(
//       id,
//     );
//   }

//   toggleSereno(
//     id: number,
//     event: Event,
//   ): void {
//     const input =
//       event.target as
//       HTMLInputElement;

//     this.toggleArrayControl(
//       'serenos',
//       id,
//       input.checked,
//     );
//   }

//   /*
//   |--------------------------------------------------------------------------
//   | Policías
//   |--------------------------------------------------------------------------
//   */

//   isPoliciaSelected(
//     id: number,
//   ): boolean {
//     const selected:
//       number[] =
//       this.formPatrullaje
//         .get('policias')
//         ?.value ?? [];

//     return selected.includes(
//       id,
//     );
//   }

//   togglePolicia(
//     id: number,
//     event: Event,
//   ): void {
//     const input =
//       event.target as
//       HTMLInputElement;

//     this.toggleArrayControl(
//       'policias',
//       id,
//       input.checked,
//     );
//   }

//   private toggleArrayControl(
//     controlName:
//       'serenos' | 'policias',
//     id: number,
//     checked: boolean,
//   ): void {
//     const control =
//       this.formPatrullaje.get(
//         controlName,
//       );

//     const current:
//       number[] = [
//         ...(
//           control?.value ?? []
//         ),
//       ];

//     const updated =
//       checked
//         ? [
//           ...new Set([
//             ...current,
//             id,
//           ]),
//         ]
//         : current.filter(
//           (item) =>
//             item !== id,
//         );

//     control?.setValue(updated);
//     control?.markAsTouched();
//   }

//   /*
//   |--------------------------------------------------------------------------
//   | Crear o actualizar
//   |--------------------------------------------------------------------------
//   */

//   crearOEditarPatrullaje(): void {
//     if (
//       this.formPatrullaje.invalid
//     ) {
//       this.formPatrullaje
//         .markAllAsTouched();

//       void Swal.fire({
//         icon: 'warning',
//         title:
//           'Formulario incompleto',
//         text:
//           'Revise los campos obligatorios y el rango de horas.',
//       });

//       return;
//     }

//     const value =
//       this.formPatrullaje
//         .getRawValue();

//     const tipo =
//       value.tipo_patrullaje as
//       TipoPatrullaje;

//     const modalidad =
//       value.modalidad_patrullaje as
//       ModalidadPatrullaje;

//     const payload:
//       CreatePatrullajeProgramadoRequest = {
//       unidad_id:
//         tipo === 'MOTORIZADO'
//           ? Number(
//             value.unidad_id,
//           )
//           : null,

//       zona_id:
//         Number(value.zona_id),

//       tipo_patrullaje:
//         tipo,

//       modalidad_patrullaje:
//         modalidad,

//       detalle_tipo_patrullaje:
//         value
//           .detalle_tipo_patrullaje
//           ?.trim() ||
//         null,

//       fecha:
//         value.fecha,

//       hora_inicio:
//         this.toBackendTime(
//           value.hora_inicio,
//         ),

//       hora_fin:
//         this.toBackendTime(
//           value.hora_fin,
//         ),

//       descripcion:
//         value.descripcion
//           .trim(),

//       serenos:
//         value.serenos.map(
//           Number,
//         ),

//       policias:
//         modalidad ===
//           'INTEGRADO'
//           ? value.policias.map(
//             Number,
//           )
//           : [],
//     };

//     this.isSaving = true;

//     if (
//       this.modoEdicion &&
//       value.id
//     ) {
//       this.saveSubscription =
//         this.patrullajeService
//           .updatePatrullajeProgramado(
//             Number(value.id),

//             payload as
//             UpdatePatrullajeProgramadoRequest,
//           )
//           .pipe(
//             finalize(() => {
//               this.isSaving = false;
//             }),
//           )
//           .subscribe({
//             next: (response) => {
//               this.handleSuccess(
//                 response.message,
//                 'Patrullaje actualizado',
//               );
//             },

//             error: (
//               error:
//                 ApiErrorData,
//             ) => {
//               this.handleError(
//                 error,
//                 'No se pudo actualizar el patrullaje',
//               );
//             },
//           });

//       return;
//     }

//     this.saveSubscription =
//       this.patrullajeService
//         .newPatrullajeProgramado(
//           payload,
//         )
//         .pipe(
//           finalize(() => {
//             this.isSaving = false;
//           }),
//         )
//         .subscribe({
//           next: (response) => {
//             this.handleSuccess(
//               response.message,
//               'Patrullaje programado',
//             );
//           },

//           error: (
//             error:
//               ApiErrorData,
//           ) => {
//             this.handleError(
//               error,
//               'No se pudo programar el patrullaje',
//             );
//           },
//         });
//   }

//   private handleSuccess(
//     message: string,
//     title: string,
//   ): void {
//     void Swal.fire({
//       icon: 'success',
//       title,
//       text: message,
//       timer: 1800,
//       showConfirmButton: false,
//     });

//     this.patrullajeCreado.emit();
//     this.cerrarModal();
//   }

//   private handleError(
//     error: ApiErrorData,
//     title: string,
//   ): void {
//     void Swal.fire({
//       icon: 'error',
//       title,

//       text:
//         error.message ||
//         'Ocurrió un error inesperado.',
//     });
//   }

//   /*
//   |--------------------------------------------------------------------------
//   | Helpers
//   |--------------------------------------------------------------------------
//   */

//   get tipoPatrullaje():
//     TipoPatrullaje {
//     return this.formPatrullaje
//       .get('tipo_patrullaje')
//       ?.value;
//   }

//   get modalidadPatrullaje():
//     ModalidadPatrullaje {
//     return this.formPatrullaje
//       .get('modalidad_patrullaje')
//       ?.value;
//   }

//   get selectedSerenosCount():
//     number {
//     return (
//       this.formPatrullaje
//         .get('serenos')
//         ?.value?.length ??
//       0
//     );
//   }

//   get selectedPoliciasCount():
//     number {
//     return (
//       this.formPatrullaje.get('policias')?.value?.length ?? 0
//     );
//   }

//   get invalidTimeRange():
//     boolean {
//     return Boolean(
//       this.formPatrullaje.hasError('invalidTimeRange') &&
//       (
//         this.formPatrullaje.get('hora_inicio')?.touched ||
//         this.formPatrullaje.get('hora_fin')?.touched
//       ),
//     );
//   }

//   private initFechaHoraActual(): void {
//     const now = new Date();

//     const year = now.getFullYear();
//     const month = String(now.getMonth() + 1).padStart(2, '0');
//     const day = String(now.getDate()).padStart(2, '0');
//     const hours = String(now.getHours()).padStart(2, '0');
//     const minutes = String(now.getMinutes()).padStart(2, '0');

//     this.fechaMinima = `${year}-${month}-${day}`;

//     this.formPatrullaje.patchValue(
//       {
//         fecha: this.fechaMinima,
//         hora_inicio: `${hours}:${minutes}`,
//         hora_fin: '',
//       },
//       {
//         emitEvent: false,
//       },
//     );
//   }

//   private toInputTime(
//     time: string,
//   ): string {
//     return time
//       ?.substring(0, 5);
//   }

//   private toBackendTime(
//     time: string,
//   ): string {
//     return time.length === 5
//       ? `${time}:00`
//       : time;
//   }

//   private resetForm(): void {
//     if (!this.formPatrullaje) {
//       return;
//     }

//     this.formPatrullaje.reset(
//       {
//         id: null,
//         tipo_patrullaje: 'MOTORIZADO',
//         modalidad_patrullaje: 'MUNICIPAL',
//         detalle_tipo_patrullaje: null,
//         unidad_id: null,
//         zona_id: null,
//         fecha: '',
//         hora_inicio: '',
//         hora_fin: '',
//         descripcion: '',
//         serenos: [],
//         policias: [],
//       },
//       {
//         emitEvent: false,
//       },
//     );

//     this.updateUnidadValidators('MOTORIZADO');
//     this.updatePoliciaValidators('MUNICIPAL');
//     this.initFechaHoraActual();
//   }

//   cerrarModal(): void {
//     if (this.isSaving) {
//       return;
//     }

//     this.catalogsSubscription?.unsubscribe();

//     this.resetForm();
//     this.modalCerrado.emit();
//   }
// }
