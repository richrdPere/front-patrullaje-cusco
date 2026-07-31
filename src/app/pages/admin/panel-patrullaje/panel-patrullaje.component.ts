import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

// Interfaces
import { DashboardSummary } from 'src/app/interfaces/dashboardSummary';

// Service
import { DashboardService } from 'src/app/services/dashboard.service';

@Component({
  selector: 'app-panel-patrullaje',
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './panel-patrullaje.component.html',
  styles: ``
})
export class PanelPatrullajeComponent implements OnInit {

  summary: DashboardSummary | null = null;

  loading = false;
  errorMessage = '';

  lastUpdate: Date | null = null;

  constructor(
    private dashboardService: DashboardService
  ) { }



  ngOnInit(): void {
    this.loadResumen();
  }


  loadResumen(): void {
    this.loading = true;
    this.errorMessage = '';

    this.dashboardService.getResumen().subscribe({
      next: response => {
        this.summary = response.data;
        this.lastUpdate = new Date();
      },

      error: error => {
        this.errorMessage =
          error.error?.message ??
          'No se pudo cargar el resumen operativo.';
      },

      complete: () => {
        this.loading = false;
      }
    });
  }

}
