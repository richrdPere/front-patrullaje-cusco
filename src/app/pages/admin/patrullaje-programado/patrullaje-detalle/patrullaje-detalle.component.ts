import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, forkJoin, takeUntil } from 'rxjs';

// Services
import { PatrullajeProgramadoService } from 'src/app/services/patrullaje_programado.service';
import { HistorialPatrullajeService } from 'src/app/services/historial-patrullaje.service';


@Component({
  selector: 'patrullaje-detalle',
  imports: [CommonModule],
  templateUrl: './patrullaje-detalle.component.html',
  styles: ``
})
export class PatrullajeDetalleComponent implements OnInit, OnDestroy {

  constructor(
    private patrullajeService: PatrullajeProgramadoService,
    private historialService: HistorialPatrullajeService,
    private router: Router,
    private route: ActivatedRoute
  ) {

  }

  private destroy$ = new Subject<void>();

  // VARIABLES
  patrullajeId!: number;
  loading = false;
  patrullaje: any = null;
  historial: any[] = [];

  // CICLO DE VIDA
  ngOnInit(): void {

    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {

        this.patrullajeId = Number(params.get('id'));

        if (this.patrullajeId) {
          this.cargarDatos();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // CARGAR INFORMACIÓN

  cargarDatos(): void {
    this.loading = true;
    forkJoin({
      patrullaje: this.patrullajeService.getPatrullajeProgramadoById(this.patrullajeId),
      historial: this.historialService.getHistorialByIdPatrullaje(this.patrullajeId)
      // historial: this.historialService.getHistorialDetalle(this.patrullajeId)

    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ patrullaje, historial }) => {
          this.patrullaje = patrullaje.data;
          this.historial = historial.data;
          this.loading = false;
        },
        error: (error) => {
          console.error(error);
          this.loading = false;
        }
      });
  }


  // RECARGAR SOLO HISTORIAL
  recargarHistorial(): void {
    this.historialService
      .getHistorialByIdPatrullaje(this.patrullajeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.historial = response.data;
        },
        error: console.error
      });
  }

  // VOLVER
  volver(): void {
    this.router.navigate([
      '/admin',
      'patrullaje-programado'
    ]);
  }
}
