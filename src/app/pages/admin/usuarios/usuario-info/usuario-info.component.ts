import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

// Interface
import { UsuarioDetalleData } from 'src/app/interfaces/usuarios/usuario-detalle.model';
import { ApiErrorData } from 'src/app/pages/shared/interfaces/api-error-data.model';

// Services
import { UsuarioService } from 'src/app/services/usuarios/usuarios.service';
import { UbigeoService } from 'src/app/services/ubigeo.service';

@Component({
  selector: 'usuario-info',
  imports: [ReactiveFormsModule, CommonModule, DatePipe],
  templateUrl: './usuario-info.component.html',
  styles: ``
})
export class UsuarioInfoComponent {

  @Input() mostrarModal = false;
  @Input() usuario_id: number | null = null;

  @Output() modalCerrado = new EventEmitter<void>();

  usuario!: UsuarioDetalleData;
  loading = false;

  departamentoNombre = 'No registrado';
  provinciaNombre = 'No registrado';
  distritoNombre = 'No registrado';

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
    private usuarioService: UsuarioService,
    private ubigeoService: UbigeoService
  ) { }

  // CICLO DE VIDA
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usuario_id'] && this.usuario_id) {
      this.cargarDatosUsuario();
      this.setModalWidth('lg');
    }
  }

  // *********************************************************
  // 1. CARGAR INFORMACIÓN DEL USUARIO
  // *********************************************************
  cargarDatosUsuario() {
    if (!this.usuario_id || this.loading) {
      return;
    }

    this.loading = true;

    forkJoin({
      response: this.usuarioService.getUsuarioById(this.usuario_id),
      ubigeos: this.ubigeoService.loadData(),
    })
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: ({ response }) => {
          this.usuario = response.data;
          this.resolverNombresUbigeo(response.data);
        },

        error: (error: ApiErrorData) => {
          this.limpiarDatos();

          void Swal.fire({
            icon: 'error',
            title: 'No se pudo obtener el policía',
            text: error.message || 'Ocurrió un error al cargar la información.',
          });
        },
      });
  }

  // *********************************************************
  // 2. RESOLVER NOMBRES DEL UBIGEO
  // *********************************************************
  private resolverNombresUbigeo(usuario: UsuarioDetalleData): void {
    const persona = usuario.persona;

    this.departamentoNombre = this.getUbigeoNombre(persona.departamento, 'departamento',);
    this.provinciaNombre = this.getUbigeoNombre(persona.provincia, 'provincia',);
    this.distritoNombre = this.getUbigeoNombre(persona.distrito, 'distrito',);
  }

  // *********************************************************
  // 3. OBTENER NOMBRE POR CÓDIGO
  // *********************************************************
  private getUbigeoNombre(
    codigo:
      | string
      | null
      | undefined,

    tipo:
      | 'departamento'
      | 'provincia'
      | 'distrito',
  ): string {
    if (!codigo) {
      return 'No registrado';
    }

    const resultado = this.ubigeoService.findByUbigeo(codigo);

    switch (tipo) {
      case 'departamento':
        return (resultado?.departamento?.departamento ?? codigo);

      case 'provincia':
        return (resultado?.provincia?.nombre ?? codigo);

      case 'distrito':
        return (resultado?.distrito?.nombre ?? codigo);

      default:
        return codigo;
    }
  }
  cerrarModal(): void {
    this.mostrarModal = false;
    this.modalCerrado.emit();
  }

  // *********************************************************
  // 4. LIMPIAR INFORMACIÓN
  // *********************************************************
  private limpiarDatos(): void {
    this.departamentoNombre = 'No registrado';
    this.provinciaNombre = 'No registrado';
    this.distritoNombre = 'No registrado';
  }
}
