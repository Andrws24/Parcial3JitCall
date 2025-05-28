import { Component, OnInit } from '@angular/core';
import { AuthService, UserProfile } from '../services/auth.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Firestore, collection, doc, collectionData, query, where, getDocs } from '@angular/fire/firestore';
import { User } from '@angular/fire/auth';
import { LoadingController, AlertController, ToastController } from '@ionic/angular';

interface Contact {
  id: string;
  name: string;
  lastName: string;
  phone: string;
  // Potentially include FCM token here for direct calls
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  currentUserProfile$: Observable<UserProfile | null>;
  contacts$: Observable<Contact[]>;
  currentUserId: string | null = null; // To store the current user's UID

  constructor(
    private authService: AuthService,
    private router: Router,
    private firestore: Firestore,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    // Get the current user's profile
    this.currentUserProfile$ = this.authService.currentUser.pipe(
      switchMap(user => {
        if (user) {
          this.currentUserId = user.uid; // Store the UID
          return this.authService.getUserProfile(user.uid);
        }
        this.currentUserId = null;
        return new Observable<UserProfile | null>(observer => observer.next(null));
      })
    );

    // Get the contacts for the current user
    this.contacts$ = this.authService.currentUser.pipe(
      switchMap(user => {
        if (user) {
          // Path to the contacts subcollection for the current user
          const contactsCollection = collection(this.firestore, `users/${user.uid}/contacts`);
          return collectionData(contactsCollection, { idField: 'id' }) as Observable<Contact[]>;
        }
        return new Observable<Contact[]>(observer => observer.next([])); // Return empty array if no user
      })
    );
  }

  ngOnInit() {
    // You can add logic here to fetch initial data or set up push notifications
    // once the user is logged in.
  }

  async logout() {
    const loading = await this.loadingController.create({
      message: 'Cerrando sesión...',
    });
    await loading.present();

    try {
      await this.authService.logout();
      await loading.dismiss();
      this.router.navigateByUrl('/login', { replaceUrl: true });
    } catch (e) {
      await loading.dismiss();
      this.presentAlert('Error', 'No se pudo cerrar sesión. Por favor, inténtalo de nuevo.');
      console.error('Logout error:', e);
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

  // Placeholder for initiating a call
  async callContact(contact: Contact) {
    // In a real scenario, this would trigger the push notification for the call
    // and then navigate to a Jitsi call screen.
    // Example:
    // const meetingId = this.jitsiService.generateMeetingId();
    // await this.notificationService.sendCallNotification(contact.id, contact.fcmToken, meetingId, this.currentUserProfile.name);
    // this.router.navigate(['/call', meetingId]);

    this.presentToast(`Llamando a ${contact.name} ${contact.lastName}... (Funcionalidad de llamada no implementada aún)`);
    console.log('Call initiated for:', contact);
  }

  // Placeholder for navigating to add contact page
  navigateToAddContact() {
    this.router.navigateByUrl('/add-contact');
  }
}