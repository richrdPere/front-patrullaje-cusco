import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';


// Directives
import { UppercaseDirective } from 'src/app/pages/shared/directives/uppercase.directive';
import { PoliciasService } from 'src/app/services/policias.service';
import { Policia } from 'src/app/interfaces/policia/IPolicia';



@Component({
  selector: 'policia-form',
  imports: [ReactiveFormsModule, CommonModule, UppercaseDirective],
  templateUrl: './policia-form.component.html',
  styles: ``
})
export class PoliciaFormComponent implements OnInit, OnChanges {

  @Input() mostrarModal = false;
  @Input() modoEdicion = false;
  @Input() policiaSeleccionado: Policia | any = null;

  @Output() modalCerrado = new EventEmitter<void>();
  @Output() policiaCreado = new EventEmitter<void>();

  formPolicia!: FormGroup;
  isLoading = false;

  modalWidthClass = 'max-w-4xl'; // default

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

  distritosFiltrados: any[] = [];

  departamentos = [
    { id: 'CUSCO', nombre: 'Cusco' },
    { id: 'LIMA', nombre: 'Lima' },
    { id: 'AREQUIPA', nombre: 'Arequipa' }
  ];

  provinciasCusco = [
    { id: 'CUSCO', nombre: 'Cusco' },
    { id: 'ACOMAYO', nombre: 'Acomayo' },
    { id: 'ANTA', nombre: 'Anta' },
    { id: 'CALCA', nombre: 'Calca' },
    { id: 'CANAS', nombre: 'Canas' },
    { id: 'CANCHIS', nombre: 'Canchis' },
    { id: 'CHUMBIVILCAS', nombre: 'Chumbivilcas' },
    { id: 'ESPINAR', nombre: 'Espinar' },
    { id: 'LA_CONVENCION', nombre: 'La Convención' },
    { id: 'PARURO', nombre: 'Paruro' },
    { id: 'PAUCARTAMBO', nombre: 'Paucartambo' },
    { id: 'QUISPICANCHI', nombre: 'Quispicanchi' },
    { id: 'URUBAMBA', nombre: 'Urubamba' }
  ];

  distritosCusco = [
    // Provincia: Cusco
    { id: 'CUSCO', nombre: 'Cusco', provinciaId: 'CUSCO' },
    { id: 'CCORCA', nombre: 'Ccorca', provinciaId: 'CUSCO' },
    { id: 'POROY', nombre: 'Poroy', provinciaId: 'CUSCO' },
    { id: 'SAN_JERONIMO', nombre: 'San Jerónimo', provinciaId: 'CUSCO' },
    { id: 'SAN_SEBASTIAN', nombre: 'San Sebastián', provinciaId: 'CUSCO' },
    { id: 'SANTIAGO', nombre: 'Santiago', provinciaId: 'CUSCO' },
    { id: 'SAYLLA', nombre: 'Saylla', provinciaId: 'CUSCO' },
    { id: 'WANCHAQ', nombre: 'Wanchaq', provinciaId: 'CUSCO' },

    // Provincia: Urubamba
    { id: 'URUBAMBA', nombre: 'Urubamba', provinciaId: 'URUBAMBA' },
    { id: 'CHINCHERO', nombre: 'Chinchero', provinciaId: 'URUBAMBA' },
    { id: 'HUAYLLABAMBA', nombre: 'Huayllabamba', provinciaId: 'URUBAMBA' },
    { id: 'MACHUPICCHU', nombre: 'Machupicchu', provinciaId: 'URUBAMBA' },
    { id: 'MARAS', nombre: 'Maras', provinciaId: 'URUBAMBA' },
    { id: 'OLLANTAYTAMBO', nombre: 'Ollantaytambo', provinciaId: 'URUBAMBA' },
    { id: 'YUCAY', nombre: 'Yucay', provinciaId: 'URUBAMBA' },

    // Provincia: Canchis
    { id: 'SICUANI', nombre: 'Sicuani', provinciaId: 'CANCHIS' },
    { id: 'CHECACUPE', nombre: 'Checacupe', provinciaId: 'CANCHIS' },
    { id: 'COMBAPATA', nombre: 'Combapata', provinciaId: 'CANCHIS' },
    { id: 'MARANGANI', nombre: 'Marangani', provinciaId: 'CANCHIS' },
    { id: 'PITUMARCA', nombre: 'Pitumarca', provinciaId: 'CANCHIS' },
    { id: 'SAN_PABLO', nombre: 'San Pablo', provinciaId: 'CANCHIS' },
    { id: 'SAN_PEDRO', nombre: 'San Pedro', provinciaId: 'CANCHIS' },
    { id: 'TINTA', nombre: 'Tinta', provinciaId: 'CANCHIS' }
  ];

  grados = [
    { id: 'SUBOFICIAL', nombre: 'Suboficial' },
    { id: 'OFICIAL', nombre: 'Oficial' },
    { id: 'CABO', nombre: 'Cabo' },
    { id: 'TENIENTE', nombre: 'Teniente' },
    { id: 'CAPITAN', nombre: 'Capitán' },
    { id: 'MAYOR', nombre: 'Mayor' },
    { id: 'COMANDANTE', nombre: 'Comandante' }
  ];

  constructor(
    private fb: FormBuilder,
    private policiasService: PoliciasService,
  ) { }

  ngOnInit(): void {
    this.initFormPolicias();
    this.setModalWidth('lg');

    // - listen
    this.listenProvincia();
  }

  // ====================================
  // Formulario
  // ====================================
  initFormPolicias() {
    this.formPolicia = this.fb.group({
      id: [null],
      nombre: ['', Validators.required],
      apellidos: ['', Validators.required],
      documento_identidad: [
        '',
        [
          Validators.required,
          Validators.pattern('^[0-9]+$'),
        ],
      ],
      telefono: [
        '',
        [
          Validators.required,
          Validators.pattern('^[0-9]+$'),
        ],
      ],
      direccion: ['', Validators.required],
      departamento: [null, Validators.required],
      provincia: [null, Validators.required],
      distrito: [null, Validators.required],
      // Campos opcionales (dependen del rol)

      grado: [null, Validators.required],
      comisaria: ['', Validators.required],
      codigo_institucional: ['', Validators.required],

    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    //  Si el formulario aún no está creado, salir
    if (!this.formPolicia) return;

    // EDITAR
    if (changes['policiaSeleccionado'] && this.policiaSeleccionado) {
      this.modoEdicion = true;

      const poli = this.policiaSeleccionado;

      // Campos comunes
      let formData: any = {
        id: poli.id,
        nombre: poli.usuario.nombre,
        apellidos: poli.usuario.apellidos,
        correo: poli.usuario.correo,
        telefono: poli.usuario.telefono,
        documento_identidad: poli.usuario.documento_identidad,
        direccion: poli.usuario.direccion,
        departamento: poli.usuario.departamento,
        provincia: poli.usuario.provincia,
        distrito: poli.usuario.distrito,
        grado: poli.grado,
        comisaria: poli.comisaria,
        codigo_institucional: poli.codigo_institucional,
      };

      // Aplicar al formulario
      this.formPolicia.patchValue(formData);

    }

    // CREAR / CERRAR MODAL
    if (changes['mostrarModal'] && !this.mostrarModal) {
      this.formPolicia.reset();
      this.modoEdicion = false;
    }
  }

  // ====================================
  // Methods
  // ====================================

  crearOEditarPolicia() {
    // Clonamos el value para poder manipularlo
    const policia: any = { ...this.formPolicia.value };

    // ============================
    // MODO EDICIÓN
    // ============================
    if (this.modoEdicion && policia.id) {

      this.policiasService.updatePolicia(policia.id, policia).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Policia actualizado correctamente' });
          this.policiaCreado.emit(); // refrescar tabla
          this.cerrarModal();
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error al actualizar policia',
            text: err.error?.message || 'Error desconocido.',
          });
        },
      });

      return;
    }

    // ============================
    // MODO CREACIÓN
    // ============================
    this.policiasService.newPolicia(policia).subscribe({
      next: (resp) => {
        Swal.fire({
          icon: 'success',
          title: 'Usuario creado correctamente',
          text: resp.message
        });

        this.policiaCreado.emit(); // refrescar tabla
        this.cerrarModal();
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error al crear usuario',
          text: err.error?.message || 'Error desconocido',
        });
      }
    });
  }


  // ====================================
  // Helpers methods
  // ====================================
  soloNumeros(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  cerrarModal() {
    this.formPolicia.reset();
    this.modoEdicion = false;
    this.policiaSeleccionado = null;
    this.modalCerrado.emit();
  }


  esRequerido(campo: string): boolean {
    const control = this.formPolicia.get(campo);
    return control?.hasValidator(Validators.required) ?? false;
  }

  listenProvincia() {
    this.formPolicia.get('provincia')?.valueChanges.subscribe(value => {
      this.onProvinciaChange(value);
    });
  }

  onProvinciaChange(provinciaId: string) {
    this.distritosFiltrados = this.distritosCusco.filter(
      d => d.provinciaId === provinciaId
    );

    // reset distrito
    this.formPolicia.patchValue({ distrito: null });
  }
}
