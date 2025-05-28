import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, UserProfile } from '../services/auth.service';
import { LoadingController, AlertController, ToastController } from '@ionic/angular';
import { Firestore, collection, query, where, getDocs, doc, setDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-add-contact',
  templateUrl: './add-contact.page.html',
  styleUrls: ['./add-contact.page.scss'],
})
export class AddContactPage implements OnInit {
  addContactForm: FormGroup;
  currentUserId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private toastController: ToastController,
    private firestore: Firestore
  ) {
    this.addContactForm = this.fb.group({
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10,}$')]]
    });

    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.currentUserId = user.uid;
      } else {
        this.currentUserId = null;
      }
    });
  }

  ngOnInit() {}

  async addContact() {
    if (this.addContactForm.invalid) {
      this.presentToast('Por favor, ingresa un número de teléfono válido.');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Buscando contacto...',
    });
    await loading.present();

    try {
      const { phoneNumber } = this.addContactForm.value;

      if (!this.currentUserId) {
        throw new Error('No se pudo obtener el ID del usuario actual.');
      }

      // 1. Validate if the contact exists in Firebase 'users' collection
      const usersRef = collection(this.firestore, 'users');
      const q = query(usersRef, where('phone', '==', phoneNumber));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        await loading.dismiss();
        this.presentAlert('Contacto no encontrado', 'No se encontró ningún usuario con ese número de teléfono en jitCall.');
        return;
      }

      const foundUser = querySnapshot.docs[0].data() as UserProfile;

      // Prevent adding self as contact
      if (foundUser.id === this.currentUserId) {
        await loading.dismiss();
        this.presentAlert('Error', 'No puedes añadirte a ti mismo como contacto.');
        return;
      }

      // 2. Add the found user to the current user's contacts subcollection
      const contactDocRef = doc(this.firestore, `users/${this.currentUserId}/contacts/${foundUser.id}`);
      // Check if contact already exists
      const existingContact = await getDocs(query(collection(this.firestore, `users/${this.currentUserId}/contacts`), where('id', '==', foundUser.id)));

      if (!existingContact.empty) {
        await loading.dismiss();
        this.presentAlert('Contacto ya añadido', 'Este usuario ya se encuentra en tu lista de contactos.');
        return;
      }


      await setDoc(contactDocRef, {
        id: foundUser.id,
        name: foundUser.name,
        lastName: foundUser.lastName,
        phone: foundUser.phone
        // Optionally, store foundUser.fcmToken if it exists and you want to use it directly
      });

      await loading.dismiss();
      this.presentToast(`¡${foundUser.name} añadido a tus contactos!`);
      this.router.navigateByUrl('/home'); // Navigate back to home
    } catch (e: any) {
      await loading.dismiss();
      this.presentAlert('Error', e.message || 'Hubo un error al añadir el contacto.');
      console.error('Error adding contact:', e);
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

  async presentToast(message: string, duration: number = 2000) {
    const toast = await this.toastController.create({
      message,
      duration,
      position: 'bottom'
    });
    toast.present();
  }
}