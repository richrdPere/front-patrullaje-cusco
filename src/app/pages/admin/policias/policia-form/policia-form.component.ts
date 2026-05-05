import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/pages/shared/directives/uppercase.directive';

// Interfaces
import { Policia } from 'src/app/interfaces/policia/IPolicia';
import { CrearPoliciaResponse, UpdatePoliciaResponse } from 'src/app/interfaces/policia/policia_response';

// Services
import { PoliciasService } from 'src/app/services/policias.service';
import { UbigeoService } from 'src/app/services/ubigeo.service';


@Component({
  selector: 'policia-form',
  imports: [ReactiveFormsModule, CommonModule, UppercaseDirective],
  templateUrl: './policia-form.component.html',
  styles: ``
})
export class PoliciaFormComponent implements OnInit, OnChanges {

  @Input() mostrarModal = false;
  @Input() modoEdicion = false;
  @Input() policiaSeleccionado: Policia | null = null;

  @Output() modalCerrado = new EventEmitter<void>();
  @Output() policiaCreado = new EventEmitter<void>();

  formPolicia!: FormGroup;
  isLoading = false;

  // Selectores
  departamentos: any[] = [];
  provincias: any[] = [];
  distritos: any[] = [];

  distritosFiltrados: any[] = [];

  grados = [
    { id: 'SUBOFICIAL', nombre: 'Suboficial' },
    { id: 'OFICIAL', nombre: 'Oficial' },
    { id: 'CABO', nombre: 'Cabo' },
    { id: 'TENIENTE', nombre: 'Teniente' },
    { id: 'CAPITAN', nombre: 'Capitán' },
    { id: 'MAYOR', nombre: 'Mayor' },
    { id: 'COMANDANTE', nombre: 'Comandante' }
  ];

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

  constructor(
    private fb: FormBuilder,
    private policiasService: PoliciasService,
    private ubigeoService: UbigeoService
  ) { }

  ngOnInit(): void {
    this.initFormPolicias();
    this.setModalWidth('lg');

    // - listen
    this.initUbigeo();
    this.listenUbigeoChanges();
  }

  initUbigeo() {
    this.ubigeoService.loadData().subscribe(data => {
      this.departamentos = data;

      console.log('Departamentos cargados:', this.departamentos);
    });
  }


  listenUbigeoChanges() {
    // Departamento → Provincias
    this.formPolicia.get('departamento')?.valueChanges.subscribe(depUbigeo => {
      if (!depUbigeo) return;

      this.provincias = this.ubigeoService.getProvincias(depUbigeo);
      this.distritos = [];

      this.formPolicia.patchValue({
        provincia: null,
        distrito: null
      }, { emitEvent: false });
    });

    // Provincia → Distritos
    this.formPolicia.get('provincia')?.valueChanges.subscribe(provUbigeo => {
      const depUbigeo = this.formPolicia.value.departamento;
      if (!depUbigeo || !provUbigeo) return;

      console.log('Provincia seleccionada:', provUbigeo, 'en departamento:', depUbigeo);
      this.distritos = this.ubigeoService.getDistritos(depUbigeo, provUbigeo);
      console.log('Distritos cargados:', this.distritos);
      this.formPolicia.patchValue({
        distrito: null
      }, { emitEvent: false });
    });
  }



  onDepartamentoChange(depUbigeo: string) {
    this.provincias = this.ubigeoService.getProvincias(depUbigeo);
    this.distritos = [];
  }

  onProvinciaChange(depUbigeo: string, provUbigeo: string) {
    this.distritos = this.ubigeoService.getDistritos(depUbigeo, provUbigeo);
  }


  // ====================================
  // Formulario
  // ====================================
  initFormPolicias() {
    this.formPolicia = this.fb.group({
      id: [null],
      nombres: ['', Validators.required],
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

      const depUbigeo = this.mapNombreToUbigeo(poli.persona?.departamento, 'dep');
      const provUbigeo = this.mapNombreToUbigeo(poli.persona?.provincia, 'prov');
      const distUbigeo = this.mapNombreToUbigeo(poli.persona?.distrito, 'dist');

      // Cargar cascada
      this.provincias = depUbigeo
        ? this.ubigeoService.getProvincias(depUbigeo)
        : [];

      this.distritos = (depUbigeo && provUbigeo)
        ? this.ubigeoService.getDistritos(depUbigeo, provUbigeo)
        : [];

      this.formPolicia.patchValue({
        id: poli.id,
        nombres: poli.persona?.nombres ?? '',
        apellidos: poli.persona?.apellidos ?? '',
        telefono: poli.persona?.telefono ?? '',
        documento_identidad: poli.persona?.documento_identidad ?? '',
        direccion: poli.persona?.direccion ?? '',
        departamento: depUbigeo,
        provincia: provUbigeo,
        distrito: distUbigeo,
        grado: poli.grado,
        comisaria: poli.comisaria,
        codigo_institucional: poli.codigo_institucional,
      });
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
    const formValue = this.formPolicia.value;

    const dep = this.ubigeoService.findByUbigeo(formValue.departamento);
    const prov = this.ubigeoService.findByUbigeo(formValue.provincia);
    const dist = this.ubigeoService.findByUbigeo(formValue.distrito);

    const payload = {
      nombres: formValue.nombres,
      apellidos: formValue.apellidos,
      documento_identidad: formValue.documento_identidad,
      telefono: formValue.telefono,
      direccion: formValue.direccion,
      departamento: dep.departamento?.departamento,
      provincia: prov.provincia?.nombre,
      distrito: dist.distrito?.nombre,
      grado: formValue.grado,
      comisaria: formValue.comisaria,
      codigo_institucional: formValue.codigo_institucional,
    };

    // ============================
    // MODO EDICIÓN
    // ============================
    if (this.modoEdicion && formValue.id) {

      this.policiasService.updatePolicia(formValue.id, payload).subscribe({
        next: (res: UpdatePoliciaResponse) => {
          Swal.fire({ icon: 'success', title: res.message });
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
    this.policiasService.newPolicia(payload).subscribe({
      next: (resp: CrearPoliciaResponse) => {
        Swal.fire({
          icon: 'success',
          title: 'Policía creado correctamente',
          text: resp.message,
        });

        this.policiaCreado.emit(); // refrescar tabla
        this.cerrarModal();
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error al crear policia',
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

  mapNombreToUbigeo(nombre: string | undefined, tipo: 'dep' | 'prov' | 'dist'): string | null {
    for (const dep of this.ubigeoService.getDepartamentos()) {

      if (tipo === 'dep' && dep.departamento === nombre) {
        return dep.departamento_id;
      }

      for (const prov of dep.provincias) {

        if (tipo === 'prov' && prov.nombre === nombre) {
          return prov.provincia_id;
        }

        for (const dist of prov.distritos) {
          if (tipo === 'dist' && dist.nombre === nombre) {
            return dist.id;
          }
        }
      }
    }

    return null;
  }
}
