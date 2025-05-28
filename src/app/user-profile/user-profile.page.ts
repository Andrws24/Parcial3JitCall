import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingController, AlertController, ToastController } from '@ionic/angular';
import { AuthService, UserProfile } from '../services/auth.service';
import { UserProfileService } from '../services/user-profile.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.page.html',
  styleUrls: ['./user-profile.page.scss'],
})
export class UserProfilePage implements OnInit {
  profileForm: FormGroup;
  currentUser: UserProfile | null = null;
  profilePhotoUrl: string | null = null;
  selectedPhotoBase64: string | null = null; // Para previsualizar la foto seleccionada

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userProfileService: UserProfileService,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required]],
      lastName: ['', [Validators.required]]
    });
  }

  async ngOnInit() {
    const loading = await this.loadingController.create({
      message: 'Cargando perfil...',
    });
    await loading.present();

    try {
      const firebaseUser = await firstValueFrom(this.authService.currentUser);
      if (firebaseUser) {
        this.currentUser = await this.userProfileService.getUserProfileWithPhoto(firebaseUser.uid);
        if (this.currentUser) {
          this.profileForm.patchValue({
            name: this.currentUser.name,
            lastName: this.currentUser.lastName
          });
          this.profilePhotoUrl = this.currentUser.photoUrl || 'https://placehold.co/150x150/cccccc/ffffff?text=No+Foto';
        }
      }
    } catch (error) {
      console.error('Error al cargar el perfil:', error);
      this.presentAlert('Error', 'No se pudo cargar el perfil del usuario.');
    } finally {
      await loading.dismiss();
    }
  }

  async updateProfile() {
    if (this.profileForm.invalid) {
      this.presentToast('Por favor, rellena todos los campos requeridos.', 'danger');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Actualizando perfil...',
    });
    await loading.present();

    try {
      if (this.currentUser) {
        const { name, lastName } = this.profileForm.value;
        await this.userProfileService.updateUserName(this.currentUser.id, name, lastName);

        // Si hay una foto seleccionada, subirla
        if (this.selectedPhotoBase64) {
          const newPhotoUrl = await this.userProfileService.uploadProfilePhoto(this.currentUser.id, this.selectedPhotoBase64);
          this.profilePhotoUrl = newPhotoUrl; // Actualiza la URL de la foto en la UI
          this.selectedPhotoBase64 = null; // Limpia la foto seleccionada
        }
        this.presentToast('Perfil actualizado exitosamente.', 'success');
      } else {
        this.presentAlert('Error', 'No se pudo obtener el usuario actual.');
      }
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      this.presentAlert('Error', 'Hubo un problema al actualizar el perfil.');
    } finally {
      await loading.dismiss();
    }
  }

  async selectPhoto() {
    const loading = await this.loadingController.create({
      message: 'Abriendo cámara/galería...',
    });
    await loading.present();

    try {
      const photo = await this.userProfileService.selectProfilePhoto();
      if (photo) {
        this.selectedPhotoBase64 = photo; // Guardar para previsualización
        // La subida real ocurre en updateProfile()
      }
    } catch (error) {
      console.error('Error al seleccionar la foto:', error);
      this.presentAlert('Error', 'No se pudo seleccionar la foto.');
    } finally {
      await loading.dismiss();
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

  async presentToast(message: string, color: string = 'primary', duration: number = 2000) {
    const toast = await this.toastController.create({
      message,
      duration,
      position: 'bottom',
      color: color
    });
    toast.present();
  }
}