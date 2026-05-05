import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { ReactiveFormsModule, } from '@angular/forms';

// Interface
import { Policia } from 'src/app/interfaces/policia/IPolicia';

// Service
import { PoliciasService } from 'src/app/services/policias.service';


@Component({
  selector: 'policia-info',
  imports: [ReactiveFormsModule, CommonModule], // DatePipe
  templateUrl: './policia-info.component.html',
  styles: ``
})
export class PoliciaInfoComponent {
  @Input() mostrarModal = false;
  @Input() policia_id: number | null = null;

  @Output() modalCerrado = new EventEmitter<void>();

  policia!: Policia;
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

  constructor(private policiaService: PoliciasService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['policia_id'] && this.policia_id) {
      this.cargarDatosPolicia();
      this.setModalWidth('lg');
    }
  }


  cargarDatosPolicia() {
    this.loading = true;

    this.policiaService.getPoliciaById(this.policia_id!).subscribe({
      next: (data) => {

        console.log("GET POLICIA: ", data);
        this.policia = data;
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
