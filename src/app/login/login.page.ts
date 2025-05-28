import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LoadingController, AlertController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {}

  async login() {
    if (this.loginForm.invalid) {
      this.presentAlert('Formulario inválido', 'Por favor, rellena todos los campos correctamente.');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Iniciando sesión...',
    });
    await loading.present();

    try {
      const { email, password } = this.loginForm.value;
      await this.authService.login(email, password);
      await loading.dismiss();
      this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (e: any) {
      await loading.dismiss();
      let errorMessage = 'Error al iniciar sesión. Por favor, verifica tus credenciales.';
      if (e.message.includes('auth/invalid-credential') || e.message.includes('auth/wrong-password')) {
          errorMessage = 'Contraseña incorrecta o usuario no encontrado.';
      } else if (e.message.includes('auth/user-not-found')) {
          errorMessage = 'Usuario no encontrado.';
      } else if (e.message.includes('auth/invalid-email')) {
          errorMessage = 'Formato de correo electrónico inválido.';
      }
      this.presentAlert('Error de inicio de sesión', errorMessage);
      console.error('Login error:', e);
    }
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}