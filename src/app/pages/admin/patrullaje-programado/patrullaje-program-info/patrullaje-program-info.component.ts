import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

// Interface
import { IPatrullajeDetalle } from 'src/app/interfaces/patrullaje_programado/IPatrullajeProgramadoInfo';

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

  p: IPatrullajeDetalle | null = null;
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
      this.p = null;
      this.cargarDatosPatrullaje();
      this.setModalWidth('lg');
    }
  }
  cargarDatosPatrullaje() {
    this.loading = true;

    this.patrullajeService.getPatrullajeProgramadoById(this.patrullaje_id!).subscribe({
      next: (data) => {
        this.p = data;
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

  formatearHora(hora: string ): string {
    if (!hora) return '';

    const partes = hora.split(':'); // HH:mm:ss
    if (partes.length < 2) return hora;
    let [hh, mm] = partes;

    let horas = parseInt(hh, 10);
    const minutos = mm;
    const ampm = horas >= 12 ? 'PM' : 'AM';

    horas = horas % 12;
    if (horas === 0) horas = 12;
    const horasStr = horas < 10 ? '0' + horas : horas;
    return `${horasStr}:${minutos} ${ampm}`;
  }

  formatearFecha(fecha: string ): string {
    if (!fecha) return '';

    const partes = fecha.split('-'); // YYYY-MM-DD
    if (partes.length !== 3) return fecha; // fallback
    const [anio, mes, dia] = partes;
    return `${dia}/${mes}/${anio}`;
  }

}
