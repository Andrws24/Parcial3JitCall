import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LoadingController, AlertController } from '@ionic/angular';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10,}$')]], // Basic phone number validation
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {}

  // Custom validator to check if passwords match
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  async register() {
    if (this.registerForm.invalid) {
      this.presentAlert('Formulario inválido', 'Por favor, rellena todos los campos correctamente y asegúrate de que las contraseñas coincidan.');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Registrando usuario...',
    });
    await loading.present();

    try {
      const { name, lastName, email, phone, password } = this.registerForm.value;
      await this.authService.register(name, lastName, email, phone, password);
      await loading.dismiss();
      this.presentAlert('Registro Exitoso', 'Tu cuenta ha sido creada. ¡Ahora puedes iniciar sesión!');
      this.router.navigateByUrl('/login', { replaceUrl: true });
    } catch (e: any) {
      await loading.dismiss();
      let errorMessage = 'Error al registrar usuario. Por favor, inténtalo de nuevo.';
      if (e.message.includes('auth/email-already-in-use')) {
        errorMessage = 'El correo electrónico ya está registrado.';
      }
      this.presentAlert('Error de Registro', errorMessage);
      console.error('Register error:', e);
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