import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [
    CommonModule,
    // RouterLink
  ],
  templateUrl: './not-found.component.html',
  styles: ``
})
export class NotFoundComponent {
  constructor(
    private router: Router
  ) { }

  volver(): void {
    window.history.back();
  }

  irAlInicio(): void {

    this.router.navigate(['/admin']);

  }
}
