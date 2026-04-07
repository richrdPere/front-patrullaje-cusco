import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

// Directives
import { Usuario } from 'src/app/interfaces/login/usuarioResponse';
import { UsuarioService } from 'src/app/services/usuarios.service';

// Services

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

  usuario!: Usuario;
  loading = false;

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

  constructor(private usuarioService: UsuarioService) { }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usuario_id'] && this.usuario_id) {
      this.cargarDatosUsuario();
      this.setModalWidth('lg');
    }
  }


  cargarDatosUsuario() {
    this.loading = true;

    this.usuarioService.getUsuarioById(this.usuario_id!).subscribe({
      next: (data) => {

        console.log("GET USUARIO: ", data);
        this.usuario = data;
        this.loading = false;

      },
      error: (err) => {

        this.loading = false;
      },
    });
  }



  cerrarModal(): void {
    this.mostrarModal = false;
    this.modalCerrado.emit();

  }


}
