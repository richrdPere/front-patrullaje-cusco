import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

// Subcomponentes
import { ReporteIncidenciasComponent } from './reporte-incidencias/reporte-incidencias.component';
import { ReporteRecorridosComponent } from './reporte-recorridos/reporte-recorridos.component';
import { ReporteActividadOperativaComponent } from './reporte-actividad-operativa/reporte-actividad-operativa.component';
import { ReporteZonasCriticasComponent } from './reporte-zonas-criticas/reporte-zonas-criticas.component';

// Tipos
export type ReporteTab =
  | 'INCIDENCIAS'
  | 'RECORRIDOS'
  | 'ACTIVIDAD_OPERATIVA'
  | 'ZONAS_CRITICAS';

export interface ReporteTabOption {
  value: ReporteTab;
  label: string;
  descripcion: string;
  icono: string;
  colorClass: string;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    CommonModule,

    ReporteIncidenciasComponent,
    ReporteRecorridosComponent,
    ReporteActividadOperativaComponent,
    ReporteZonasCriticasComponent,
  ],
  templateUrl: './reportes.component.html',
  styles: ``
})
export class ReportesComponent implements OnInit {

  // TAB ACTIVA
  tabActiva: ReporteTab = 'INCIDENCIAS';


  // OPCIONES
  readonly tabs: ReporteTabOption[] = [
    {
      value: 'INCIDENCIAS',
      label: 'Incidencias',
      descripcion:
        'Frecuencia, estados, tipos, zonas y evidencias.',
      icono:
        'fa-solid fa-triangle-exclamation',
      colorClass:
        'text-error bg-error/10',
    },
    {
      value: 'RECORRIDOS',
      label: 'Recorridos',
      descripcion:
        'Distancias, tiempos, velocidades y puntos GPS.',
      icono:
        'fa-solid fa-route',
      colorClass:
        'text-info bg-info/10',
    },
    {
      value: 'ACTIVIDAD_OPERATIVA',
      label: 'Actividad operativa',
      descripcion:
        'Patrullajes, personal, unidades y productividad.',
      icono:
        'fa-solid fa-chart-line',
      colorClass:
        'text-primary bg-primary/10',
    },
    {
      value: 'ZONAS_CRITICAS',
      label: 'Zonas críticas',
      descripcion:
        'Ranking, criticidad y distribución geográfica.',
      icono:
        'fa-solid fa-map-location-dot',
      colorClass:
        'text-warning bg-warning/10',
    },
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) { }

  // =========================================================
  // CICLO DE VIDA
  // =========================================================
  ngOnInit(): void {
    this.obtenerTabDesdeUrl();
  }

  // =========================================================
  // NAVEGACIÓN
  // =========================================================
  seleccionarTab(
    tab: ReporteTab,
  ): void {

    if (this.tabActiva === tab) {
      return;
    }

    this.tabActiva = tab;

    void this.router.navigate([], {
      relativeTo: this.route,

      queryParams: {
        reporte: this.getTabQueryParam(tab),
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    },
    );
  }

  esTabActiva(tab: ReporteTab,): boolean {
    return this.tabActiva === tab;
  }

  // =========================================================
  // TAB DESDE URL
  // =========================================================
  private obtenerTabDesdeUrl(): void {
    const reporte = this.route.snapshot.queryParamMap.get('reporte');
    this.tabActiva = this.getTabFromQueryParam(reporte,);
  }

  private getTabFromQueryParam(
    value: string | null,
  ): ReporteTab {

    switch (
    value
      ?.trim()
      .toLowerCase()
    ) {
      case 'recorridos':
        return 'RECORRIDOS';

      case 'actividad-operativa':
        return 'ACTIVIDAD_OPERATIVA';

      case 'zonas-criticas':
        return 'ZONAS_CRITICAS';

      case 'incidencias':
      default:
        return 'INCIDENCIAS';
    }
  }

  private getTabQueryParam(tab: ReporteTab,): string {

    switch (tab) {
      case 'RECORRIDOS':
        return 'recorridos';

      case 'ACTIVIDAD_OPERATIVA':
        return 'actividad-operativa';

      case 'ZONAS_CRITICAS':
        return 'zonas-criticas';

      case 'INCIDENCIAS':
      default:
        return 'incidencias';
    }
  }

  // =========================================================
  // INFORMACIÓN DE LA TAB ACTIVA
  // =========================================================
  get tabSeleccionada(): ReporteTabOption {
    return (
      this.tabs.find(
        tab =>
          tab.value ===
          this.tabActiva,
      ) ??
      this.tabs[0]
    );
  }

  trackByTab(index: number, tab: ReporteTabOption,): ReporteTab {
    return tab.value;
  }
}
