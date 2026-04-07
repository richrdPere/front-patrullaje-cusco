import { Component } from '@angular/core';

// Service
import { ThemeService } from 'src/app/services/theme.service';

@Component({
  selector: 'navbar-menu-options',
  imports: [],
  templateUrl: './navbar-menu-options.component.html',
  styles: ``
})
export class NavbarMenuOptionsComponent {
  theme: string = 'light';

  constructor(private themeService: ThemeService) { }

  ngOnInit(): void {
    this.theme = this.themeService.getTheme();
  }

  toggleTheme() {
    this.themeService.toggleTheme();
    this.theme = this.themeService.getTheme();
  }
}
