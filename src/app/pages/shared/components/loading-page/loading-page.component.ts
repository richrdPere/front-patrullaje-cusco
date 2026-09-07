// loading-page.component.ts

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main
      class="flex min-h-screen items-center justify-center
             bg-base-200 px-6"
      role="status"
      aria-live="polite"
    >
      <section
        class="flex w-full max-w-sm flex-col items-center
               rounded-2xl border border-base-300
               bg-base-100 p-8 text-center shadow-sm"
      >
        <span
          class="loading loading-spinner loading-lg
                 text-primary"
          aria-hidden="true"
        ></span>

        <h1
          class="mt-5 text-lg font-semibold
                 text-base-content"
        >
          {{ title }}
        </h1>

        <p
          *ngIf="message"
          class="mt-2 text-sm leading-6
                 text-base-content/65"
        >
          {{ message }}
        </p>
      </section>
    </main>
  `,
})
export class LoadingPageComponent {

  @Input()
  title = 'Cargando sistema';

  @Input()
  message =
    'Estamos preparando la información necesaria.';
}
