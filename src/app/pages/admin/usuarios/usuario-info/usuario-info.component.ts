import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/pages/shared/directives/uppercase.directive';

// Services

@Component({
  selector: 'app-usuario-info',
  imports: [ReactiveFormsModule, CommonModule, UppercaseDirective],
  templateUrl: './usuario-info.component.html',
  styles: ``
})
export class UsuarioInfoComponent {

  @Input() mostrarModal = false;
  @Input() modoEdicion = false;
  @Input() usuarioSeleccionado: any = null;

  @Output() modalCerrado = new EventEmitter<void>();
  @Output() usuarioCreado = new EventEmitter<void>();


  formUsuario!: FormGroup;
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

}
