import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'policia-info',
  imports: [ReactiveFormsModule, CommonModule, ], // DatePipe
  templateUrl: './policia-info.component.html',
  styles: ``
})
export class PoliciaInfoComponent {
  @Input() mostrarModal = false;
  @Input() policia_id: number | null = null;

  @Output() modalCerrado = new EventEmitter<void>();
}
