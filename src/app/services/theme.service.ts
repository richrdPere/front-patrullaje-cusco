import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'theme';
  private readonly DEFAULT_THEME = 'light'; // light

  constructor() {
    this.initTheme();
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private initTheme(): void {
    if (this.isBrowser()) {
      const savedTheme = localStorage.getItem(this.STORAGE_KEY);
      if (savedTheme) {
        this.setTheme(savedTheme);
      } else {
        this.setTheme(this.DEFAULT_THEME);
      }
    }
  }

  setTheme(theme: string): void {
    if (this.isBrowser()) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem(this.STORAGE_KEY, theme);
    }
  }

  getTheme(): string {
    if (this.isBrowser()) {
      return localStorage.getItem(this.STORAGE_KEY) || this.DEFAULT_THEME;
    }
    return this.DEFAULT_THEME;
  }

  toggleTheme(): void {
    const currentTheme = this.getTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }
}
