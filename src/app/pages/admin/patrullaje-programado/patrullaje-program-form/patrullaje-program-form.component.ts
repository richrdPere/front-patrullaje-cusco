import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Subject, Subscription, finalize, forkJoin, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/pages/shared/directives/uppercase.directive';

// Services
import { UnidadPatrullajeService } from 'src/app/services/unidad/unidad-patrullaje.service';
import { ZonaService } from 'src/app/services/zona/zona.service';
import { PatrullajeProgramadoService } from 'src/app/services/patrullaje/patrullaje_programado.service';
import { UsuarioService } from 'src/app/services/usuarios/usuarios.service';
import { PoliciasService } from 'src/app/services/usuarios/policias.service';

// Interfaces
import { UnidadPatrullajeSelectItem } from 'src/app/interfaces/unidad-patrullaje/get-unidades-select.model';
import { ZonaSelectItem } from 'src/app/interfaces/zona/get-zonas-select.model';

import { ApiErrorData } from 'src/app/pages/shared/interfaces/api-error-data.model';
import { PatrullajeByIdData } from 'src/app/interfaces/patrullaje_programado/get-patrullaje-by-id.model';
import { PoliciaSelectItem } from 'src/app/interfaces/policia/selected-policia.model';
import { CreatePatrullajeProgramadoRequest, TipoPatrullaje } from 'src/app/interfaces/patrullaje_programado/create-patrullaje-programado.model';
import { UpdatePatrullajeProgramadoRequest } from 'src/app/interfaces/patrullaje_programado/update-patrullaje-programado.model';

// type TipoPatrullaje =
//   | 'A_PIE'
//   | 'MOTORIZADO';

type ModalidadPatrullaje =
  | 'MUNICIPAL'
  | 'INTEGRADO';

interface SerenoSelectItem {
  id?: number;
  value?: number;
  label?: string;
  descripcion?: string;

  persona?: {
    nombres?: string;
    apellidos?: string;
  };

  roles?: Array<string | { nombre: string; }
  >;
}

//  Validar cantidad mínima de elementos
const minArrayLength = (minimum: number): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!Array.isArray(value) || value.length < minimum) {
      return {
        minArrayLength: {
          requiredLength: minimum,
          actualLength:
            Array.isArray(value)
              ? value.length
              : 0,
        },
      };
    }

    return null;
  };
};

// Validar rango de horas
const timeRangeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const horaInicio = control.get('hora_inicio')?.value;
  const horaFin = control.get('hora_fin')?.value;

  if (!horaInicio || !horaFin) {
    return null;
  }

  if (horaFin <= horaInicio) {
    return {
      invalidTimeRange: true,
    };
  }

  return null;
};

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

  @Input() mostrarModal = false;
  @Input() modoEdicion = false;
  @Input() patrullajeSeleccionado: PatrullajeByIdData | null = null;

  @Output() modalCerrado = new EventEmitter<void>();
  @Output() patrullajeCreado = new EventEmitter<void>();

  formPatrullaje!: FormGroup;

  zonas: ZonaSelectItem[] = [];
  unidades: UnidadPatrullajeSelectItem[] = [];
  serenos: SerenoSelectItem[] = [];
  policias: PoliciaSelectItem[] = [];

  isLoadingCatalogs = false;
  isSaving = false;

  modalWidthClass = 'max-w-6xl';

  setModalWidth(size: 'sm' | 'md' | 'lg' | 'xl' | 'full') {
    const map = {
      sm: 'max-w-md',
      md: 'max-w-xl',
      lg: 'max-w-4xl',
      xl: 'max-w-6xl',
      full: 'max-w-full w-[95vw]'
    };

    this.modalWidthClass = map[size];
  }

  fechaMinima = '';

  readonly tiposPatrullaje: Array<{
    value: TipoPatrullaje;
    label: string;
    descripcion: string;
    icon: string;
  }> = [
      {
        value: 'A_PIE',
        label: 'A pie',
        descripcion:
          'Patrullaje realizado mediante desplazamiento peatonal.',
        icon: 'fa-person-walking',
      },
      {
        value: 'MOTORIZADO',
        label: 'Motorizado',
        descripcion:
          'Patrullaje realizado utilizando una unidad vehicular.',
        icon: 'fa-car-side',
      },
    ];

  readonly modalidadesPatrullaje: Array<{
    value: ModalidadPatrullaje;
    label: string;
    descripcion: string;
    icon: string;
  }> = [
      {
        value: 'MUNICIPAL',
        label: 'Municipal',
        descripcion:
          'Participación exclusiva del personal de Serenazgo.',
        icon: 'fa-shield-halved',
      },
      {
        value: 'INTEGRADO',
        label: 'Integrado',
        descripcion:
          'Participación conjunta de serenos y Policía Nacional.',
        icon: 'fa-people-group',
      },
    ];

  private catalogsSubscription: Subscription | null = null;
  private saveSubscription: Subscription | null = null;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private unidadService: UnidadPatrullajeService,
    private zonaService: ZonaService,
    private usuarioService: UsuarioService,
    private policiaService: PoliciasService,
    private patrullajeService: PatrullajeProgramadoService,
  ) { }

  ngOnInit(): void {
    this.initFormPatrullaje();
    this.listenConditionalFields();
    this.setModalWidth('xl');

    if (this.mostrarModal) {
      this.prepareModal();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.formPatrullaje) {
      return;
    }

    const modalOpened = changes['mostrarModal']?.currentValue === true;
    const patrolChanged = Boolean(changes['patrullajeSeleccionado']);

    if (modalOpened || (this.mostrarModal && patrolChanged)) {
      this.prepareModal();
    }

    if (changes['mostrarModal'] && !this.mostrarModal) {
      this.resetForm();
    }
  }

  ngOnDestroy(): void {
    this.catalogsSubscription?.unsubscribe();
    this.saveSubscription?.unsubscribe();

    this.destroy$.next();
    this.destroy$.complete();
  }

  // ====================================
  // Inicializar formulario
  // ====================================
  private initFormPatrullaje(): void {
    this.formPatrullaje = this.fb.group({
      id: [null],

      tipo_patrullaje: ['MOTORIZADO', Validators.required],
      modalidad_patrullaje: ['MUNICIPAL', Validators.required],
      detalle_tipo_patrullaje: [null, Validators.maxLength(150)],
      unidad_id: [null, Validators.required],
      zona_id: [null, Validators.required],
      fecha: ['', Validators.required],
      hora_inicio: ['', Validators.required],
      hora_fin: ['', Validators.required],
      descripcion: ['', [Validators.required, Validators.maxLength(1000)]],
      serenos: [[], minArrayLength(1)],
      policias: [[]],
    },
      {
        validators:
          timeRangeValidator,
      },
    );
  }

  private listenConditionalFields(): void {
    this.formPatrullaje.get('tipo_patrullaje')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
      )
      .subscribe(
        (
          tipo: TipoPatrullaje,
        ) => {
          this.updateUnidadValidators(
            tipo,
          );
        },
      );

    this.formPatrullaje.get('modalidad_patrullaje')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
      )
      .subscribe(
        (
          modalidad: ModalidadPatrullaje,
        ) => {
          this.updatePoliciaValidators(modalidad);
        },
      );
  }

  private updateUnidadValidators(tipo: TipoPatrullaje): void {
    const control = this.formPatrullaje.get('unidad_id');

    if (!control) {
      return;
    }

    if (tipo === 'MOTORIZADO') {
      control.setValidators(
        Validators.required,
      );
    } else {
      control.clearValidators();

      control.setValue(
        null,
        {
          emitEvent: false,
        },
      );
    }

    control.updateValueAndValidity({ emitEvent: false });
  }

  private updatePoliciaValidators(modalidad: ModalidadPatrullaje): void {
    const control = this.formPatrullaje.get('policias');

    if (!control) {
      return;
    }

    if (modalidad === 'INTEGRADO') {
      control.setValidators(
        minArrayLength(1),
      );
    } else {
      control.clearValidators();

      control.setValue(
        [],
        {
          emitEvent: false,
        },
      );
    }

    control.updateValueAndValidity({
      emitEvent: false,
    });
  }

  // ====================================
  // Preparar modal
  // ====================================
  private prepareModal(): void {
    if (this.modoEdicion && this.patrullajeSeleccionado) {
      this.patchEditForm(this.patrullajeSeleccionado);
    } else {
      this.resetForm();
    }

    const unidadId = this.patrullajeSeleccionado?.unidad_id ?? undefined;

    this.getAllData(unidadId);
  }

  private patchEditForm(patrullaje: PatrullajeByIdData): void {
    const serenosIds = patrullaje.serenos.map(
      (sereno) =>
        sereno.usuario_id,
    );

    const policiasIds = patrullaje.policias.map(
      (policia) =>
        policia.policia_id,
    );

    this.formPatrullaje.reset(
      {
        id: patrullaje.id,
        unidad_id: patrullaje.unidad_id,
        zona_id: patrullaje.zona_id,
        tipo_patrullaje: patrullaje.tipo_patrullaje,
        modalidad_patrullaje: patrullaje.modalidad_patrullaje,
        detalle_tipo_patrullaje: patrullaje.detalle_tipo_patrullaje,
        fecha: patrullaje.fecha,
        hora_inicio: this.toInputTime(patrullaje.hora_inicio),
        hora_fin: this.toInputTime(patrullaje.hora_fin),
        descripcion: patrullaje.descripcion,
        serenos: serenosIds,
        policias: policiasIds,
      },
      {
        emitEvent: false,
      },
    );

    this.updateUnidadValidators(patrullaje.tipo_patrullaje);

    this.updatePoliciaValidators(patrullaje.modalidad_patrullaje);
  }

  /*
  |--------------------------------------------------------------------------
  | Cargar selectores
  |--------------------------------------------------------------------------
  */

  private getAllData(
    includeUnidadId?: number,
  ): void {
    this.catalogsSubscription
      ?.unsubscribe();

    this.isLoadingCatalogs = true;

    this.catalogsSubscription =
      forkJoin({
        zonas: this.zonaService.getZonasSelect({}),
        unidades: this.unidadService.getUnidadesSelect(),
        serenos: this.usuarioService.getSerenosAndConductores(),
        policias: this.policiaService.getPoliciasSelect(),
      })
        .pipe(
          finalize(() => {
            this.isLoadingCatalogs =
              false;
          }),
        )
        .subscribe({
          next: (responses) => {
            this.zonas =
              responses.zonas
                .data.items;

            this.unidades =
              responses.unidades
                .data.items;

            this.policias =
              responses.policias
                .data.items;

            const serenosData:
              any =
              responses.serenos
                .data;

            this.serenos =
              Array.isArray(
                serenosData,
              )
                ? serenosData
                : serenosData
                  ?.items ??
                [];
          },

          error: (
            error: ApiErrorData,
          ) => {
            this.zonas = [];
            this.unidades = [];
            this.serenos = [];
            this.policias = [];

            void Swal.fire({
              icon: 'error',

              title:
                'No se pudieron cargar los selectores',

              text:
                error.message ||
                'Ocurrió un error al cargar los datos del formulario.',
            });
          },
        });
  }

  /*
  |--------------------------------------------------------------------------
  | Serenos
  |--------------------------------------------------------------------------
  */

  getSerenoId(
    sereno:
      SerenoSelectItem,
  ): number {
    return Number(
      sereno.value ??
      sereno.id,
    );
  }

  getSerenoLabel(
    sereno:
      SerenoSelectItem,
  ): string {
    if (sereno.label) {
      return sereno.label;
    }

    return [
      sereno.persona?.nombres,
      sereno.persona?.apellidos,
    ]
      .filter(Boolean)
      .join(' ');
  }

  getSerenoRoles(
    sereno:
      SerenoSelectItem,
  ): string {
    return (
      sereno.roles
        ?.map((role) =>
          typeof role === 'string'
            ? role
            : role.nombre,
        )
        .join(', ') ||
      'SERENO'
    );
  }

  isSerenoSelected(
    id: number,
  ): boolean {
    const selected:
      number[] =
      this.formPatrullaje
        .get('serenos')
        ?.value ?? [];

    return selected.includes(
      id,
    );
  }

  toggleSereno(
    id: number,
    event: Event,
  ): void {
    const input =
      event.target as
      HTMLInputElement;

    this.toggleArrayControl(
      'serenos',
      id,
      input.checked,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Policías
  |--------------------------------------------------------------------------
  */

  isPoliciaSelected(
    id: number,
  ): boolean {
    const selected:
      number[] =
      this.formPatrullaje
        .get('policias')
        ?.value ?? [];

    return selected.includes(
      id,
    );
  }

  togglePolicia(
    id: number,
    event: Event,
  ): void {
    const input =
      event.target as
      HTMLInputElement;

    this.toggleArrayControl(
      'policias',
      id,
      input.checked,
    );
  }

  private toggleArrayControl(
    controlName:
      'serenos' | 'policias',
    id: number,
    checked: boolean,
  ): void {
    const control =
      this.formPatrullaje.get(
        controlName,
      );

    const current:
      number[] = [
        ...(
          control?.value ?? []
        ),
      ];

    const updated =
      checked
        ? [
          ...new Set([
            ...current,
            id,
          ]),
        ]
        : current.filter(
          (item) =>
            item !== id,
        );

    control?.setValue(updated);
    control?.markAsTouched();
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

  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */

  get tipoPatrullaje():
    TipoPatrullaje {
    return this.formPatrullaje
      .get('tipo_patrullaje')
      ?.value;
  }

  get modalidadPatrullaje():
    ModalidadPatrullaje {
    return this.formPatrullaje
      .get('modalidad_patrullaje')
      ?.value;
  }

  get selectedSerenosCount():
    number {
    return (
      this.formPatrullaje
        .get('serenos')
        ?.value?.length ??
      0
    );
  }

  get selectedPoliciasCount():
    number {
    return (
      this.formPatrullaje.get('policias')?.value?.length ?? 0
    );
  }

  get invalidTimeRange():
    boolean {
    return Boolean(
      this.formPatrullaje.hasError('invalidTimeRange') &&
      (
        this.formPatrullaje.get('hora_inicio')?.touched ||
        this.formPatrullaje.get('hora_fin')?.touched
      ),
    );
  }

  private initFechaHoraActual(): void {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    this.fechaMinima = `${year}-${month}-${day}`;

    this.formPatrullaje.patchValue(
      {
        fecha: this.fechaMinima,
        hora_inicio: `${hours}:${minutes}`,
        hora_fin: '',
      },
      {
        emitEvent: false,
      },
    );
  }

  private toInputTime(
    time: string,
  ): string {
    return time
      ?.substring(0, 5);
  }

  private toBackendTime(
    time: string,
  ): string {
    return time.length === 5
      ? `${time}:00`
      : time;
  }

  private resetForm(): void {
    if (!this.formPatrullaje) {
      return;
    }

    this.formPatrullaje.reset(
      {
        id: null,
        tipo_patrullaje: 'MOTORIZADO',
        modalidad_patrullaje: 'MUNICIPAL',
        detalle_tipo_patrullaje: null,
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

    this.updateUnidadValidators('MOTORIZADO');
    this.updatePoliciaValidators('MUNICIPAL');
    this.initFechaHoraActual();
  }

  cerrarModal(): void {
    if (this.isSaving) {
      return;
    }

    this.catalogsSubscription?.unsubscribe();

    this.resetForm();
    this.modalCerrado.emit();
  }
}


// import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { forkJoin } from 'rxjs';
// import Swal from 'sweetalert2';

// // Directives
// import { UppercaseDirective } from 'src/app/pages/shared/directives/uppercase.directive';

// // Services
// import { UnidadPatrullajeService } from 'src/app/services/unidad/unidad-patrullaje.service';
// import { ZonaService } from 'src/app/services/zona/zona.service';
// import { PatrullajeProgramadoService } from 'src/app/services/patrullaje/patrullaje_programado.service';
// import { UsuarioService } from 'src/app/services/usuarios/usuarios.service';
// import { PoliciasService } from 'src/app/services/usuarios/policias.service';

// @Component({
//   selector: 'patrullaje-program-form',
//   imports: [ReactiveFormsModule, CommonModule, UppercaseDirective],
//   templateUrl: './patrullaje-program-form.component.html',
//   styles: ``
// })
// export class PatrullajeProgramFormComponent implements OnInit, OnChanges {
//   @Input() mostrarModal = false;
//   @Input() modoEdicion = false;
//   @Input() patrullajeSeleccionado: any = null;

//   @Output() modalCerrado = new EventEmitter<void>();
//   @Output() patrullajeCreado = new EventEmitter<void>();

//   // listas dinamicas
//   zonas: any[] = [];
//   unidades: any[] = [];
//   serenos: any[] = [];
//   policias: any[] = [];

//   // Formulario
//   formPatrullaje!: FormGroup;

//   // Ancho del modal
//   modalWidthClass = 'max-w-4xl'; // default
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
//     this.initFechaHoraActual();
//     this.getAllData();

//     this.setModalWidth('lg');
//   }

//   // =====================================
//   // Form
//   // =====================================
//   initFormPatrullaje() {
//     this.formPatrullaje = this.fb.group({
//       id: [null],
//       unidad_id: [null, Validators.required],
//       zona_id: [null, Validators.required],
//       fecha: ['', Validators.required],
//       hora_inicio: ['', Validators.required],
//       hora_fin: ['', Validators.required],
//       descripcion: ['', Validators.required],
//       serenos: [[], Validators.required],
//       policias: [[], Validators.required],
//     });
//   }

//   toggleSereno(id: number, event: any) {
//     const control = this.formPatrullaje.get('serenos');
//     let selected = control?.value || [];

//     if (event.target.checked) {
//       selected = [...selected, id];
//     } else {
//       selected = selected.filter((item: number) => item !== id);
//     }

//     control?.setValue(selected);
//   }

//   togglePolicia(id: number, event: any) {
//     const control = this.formPatrullaje.get('policias');
//     let selected = control?.value || [];

//     if (event.target.checked) {
//       selected = [...selected, id];
//     } else {
//       selected = selected.filter((item: number) => item !== id);
//     }

//     control?.setValue(selected);
//   }

//   esRequerido(campo: string): boolean {
//     const control = this.formPatrullaje.get(campo);
//     return control?.hasValidator(Validators.required) ?? false;
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     //  Si el formulario aún no está creado, salir
//     if (!this.formPatrullaje) return;

//     // EDITAR
//     if (changes['patrullajeSeleccionado'] && this.patrullajeSeleccionado) {
//       this.modoEdicion = true;

//       const patrullaje = this.patrullajeSeleccionado;

//       console.log("PATRULLAJE UPDATE: ", patrullaje);

//       // Transformando a ids
//       const serenosIds = patrullaje.serenos.map((s: any) => s.id);
//       const policiasIds = patrullaje.policias.map((p: any) => p.id);

//       // Campos comunes
//       let formData: any = {
//         id: patrullaje.id,
//         unidad_id: patrullaje.unidad?.id || null,
//         zona_id: patrullaje.zona?.id || null,
//         fecha: patrullaje.fecha,
//         hora_inicio: patrullaje.hora_inicio,
//         hora_fin: patrullaje.hora_fin,
//         descripcion: patrullaje.descripcion,
//         serenos: serenosIds,
//         policias: policiasIds,
//       };

//       // Aplicar al formulario
//       this.formPatrullaje.patchValue(formData);

//     }

//     // CREAR / CERRAR MODAL
//     if (changes['mostrarModal'] && !this.mostrarModal) {
//       this.formPatrullaje.reset();
//       this.modoEdicion = false;
//     }
//   }

//   // =====================================
//   // Methods
//   // =====================================
//   // - Obtener todos los datos
//   getAllData() {
//     forkJoin({
//       zonas: this.zonaService.getZonasSelect({}),
//       unidades: this.unidadService.getUnidadesSelect(),
//       serenos: this.usuarioService.getSerenosAndConductores(),
//       policias: this.policiaService.getPoliciasSelect()
//     }).subscribe({
//       next: (resp: any) => {

//         console.log("SERENOS: ", resp.serenos.data);
//         console.log("POLICIAS: ", resp.policias.data);

//         this.zonas = resp.zonas.data.rows;
//         this.unidades = resp.unidades.data.unidades;
//         this.serenos = resp.serenos.data;
//         this.policias = resp.policias.data;
//       },
//       error: (err) => {
//         console.error('Error cargando datos', err);
//       }
//     });
//   }

//   onUnidadChange(event: any) {

//     const unidadId = event.target.value;

//     this.unidadService.getUnidadById(unidadId)
//       .subscribe({
//         next: (resp: any) => {

//           this.serenos = resp.unidad.serenos_unidad;

//         }
//       });
//   }

//   crearOEditarPatrullaje() {

//     const patrullaje: any = { ...this.formPatrullaje.value };

//     // ============================
//     // MODO EDICIÓN
//     // ============================
//     if (this.modoEdicion && patrullaje.id) {

//       this.patrullajeService.updatePatrullajeProgramado(patrullaje.id, patrullaje).subscribe({
//         next: () => {
//           Swal.fire({ icon: 'success', title: 'Policia actualizado correctamente' });
//           this.patrullajeCreado.emit(); // refrescar tabla
//           this.cerrarModal();
//         },
//         error: (err) => {
//           Swal.fire({
//             icon: 'error',
//             title: 'Error al actualizar policia',
//             text: err.error?.message || 'Error desconocido.',
//           });
//         },
//       });

//       return;
//     }

//     // ============================
//     // MODO CREACIÓN
//     // ============================
//     if (this.formPatrullaje.invalid) {
//       this.formPatrullaje.markAllAsTouched();
//       return;
//     }

//     this.patrullajeService.newPatrullajeProgramado(patrullaje).subscribe({
//       next: (resp) => {
//         Swal.fire({
//           icon: 'success',
//           title: 'Patrullaje programado correctamente',
//           text: resp.message
//         });

//         this.patrullajeCreado.emit(); // refrescar tabla
//         this.cerrarModal();
//       },
//       error: (err) => {
//         Swal.fire({
//           icon: 'error',
//           title: 'Error al crear el patrullaje',
//           text: err.error?.message || 'Error desconocido',
//         });
//       }
//     });
//   }

//   // ====================================
//   // Helpers methods
//   // ====================================
//   initFechaHoraActual(): void {
//     const ahora = new Date();

//     // FORMATO FECHA: YYYY-MM-DD
//     const fecha = ahora.toISOString().split('T')[0];

//     // FORMATO HORA: HH:mm
//     const horas = ahora.getHours().toString().padStart(2, '0');
//     const minutos = ahora.getMinutes().toString().padStart(2, '0');

//     const horaActual = `${horas}:${minutos}`;

//     this.formPatrullaje.patchValue({
//       fecha: fecha,
//       hora_inicio: horaActual,
//       // hora_fin: horaActual
//     });
//   }

//   cerrarModal() {
//     this.formPatrullaje.reset();
//     this.modoEdicion = false;
//     this.patrullajeSeleccionado = null;
//     this.modalCerrado.emit();
//   }
// }
