import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Izitoast
import iziToast from 'izitoast';

// Service
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styles: ``
})
export class LoginComponent implements OnInit {

  formLogin!: FormGroup;
  resultado: any = null;

  public user: any = {};
  public token: any = '';

  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private _router: Router) {


  }

  ngOnInit(): void {

    this.initLoginForm();

    console.log(this.token);
    if (this.token) {
      this._router.navigate(['/admin']);
    }
    else {
      // Mantener en el componente login
    }
  }

  // Methods
  initLoginForm(): void {
    this.formLogin = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', Validators.required]     //  ahora sí existe

    });
  }


  login() {
    if (this.formLogin.invalid) return;
    this.loading = true;

    const { username, password } = this.formLogin.value;

    this.authService.login(username!, password!).subscribe({

      next: (res) => {
        // console.log('Login exitoso:', res);

        // Save token & user
        iziToast.success({
          title: 'Exito',
          message: res.message || 'Inicio de sesión exitoso',
          position: 'bottomRight',
        });
        // Redirección según rol
        this._router.navigate(['/admin']);

      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error en el inicio de sesión';
        this.loading = false;
      },
      complete: () => this.loading = false
    });
  }

}
