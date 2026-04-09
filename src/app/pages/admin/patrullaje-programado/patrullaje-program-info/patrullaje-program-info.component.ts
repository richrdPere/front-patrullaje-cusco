import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

// Service
import { PatrullajeProgramadoService } from 'src/app/services/patrullaje_programado.service';

@Component({
  selector: 'patrullaje-program-info',
  imports: [ReactiveFormsModule, CommonModule, DatePipe],
  templateUrl: './patrullaje-program-info.component.html',
  styles: ``
})
export class PatrullajeProgramInfoComponent {

  @Input() mostrarModal = false;
  @Input() patrullaje_id: number | null = null;

  @Output() modalCerrado = new EventEmitter<void>();

  patrullaje!: any;
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

  constructor(private patrullajeService: PatrullajeProgramadoService) { }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patrullaje_id'] && this.patrullaje_id) {
      this.cargarDatosPatrullaje();
      this.setModalWidth('lg');
    }
  }
  cargarDatosPatrullaje() {
    this.loading = true;

    this.patrullajeService.getPatrullajeProgramadoById(this.patrullaje_id!).subscribe({
      next: (data) => {

        console.log("GET PATRULLAJE: ", data);
        this.patrullaje = data;
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
