import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, user, User } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Storage } from '@ionic/storage-angular';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

// Define the UserProfile interface for Firestore data
export interface UserProfile {
  id: string;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  fcmToken?: string; // Field to store FCM token for push notifications
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Observable to track the current Firebase authenticated user
  currentUser: Observable<User | null>;
  private _storage: Storage | null = null;
  private EXTERNAL_API_TOKEN_KEY = 'external_api_token'; // Key for storing external API token

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private storage: Storage,
    private http: HttpClient
  ) {
    this.currentUser = user(this.auth); // Listen to Firebase auth state changes
    this.initStorage(); // Initialize Ionic Storage
  }

  // Initialize Ionic Storage asynchronously
  private async initStorage() {
    this._storage = await this.storage.create();
  }

  /**
   * Registers a new user with Firebase Authentication and stores additional profile data in Firestore.
   */
  async register(name: string, lastName: string, email: string, phone: string, password: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      const userProfile: UserProfile = {
        id: user.uid,
        name,
        lastName,
        email,
        phone
      };

      // Store user's profile data in Firestore under 'users' collection
      const userDocRef = doc(this.firestore, `users/${user.uid}`);
      await setDoc(userDocRef, userProfile);

      return user;
    } catch (e: any) {
      console.error('Registration error:', e);
      throw new Error(e.message || 'Error during registration.');
    }
  }

  /**
   * Logs in a user with Firebase Authentication and attempts to log into the external API.
   */
  async login(email: string, password: string): Promise<User | null> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      // Attempt to log in to the external API after successful Firebase login
      await this.loginToExternalApi(email, password); // Adjust credentials as per external API
      return userCredential.user;
    } catch (e: any) {
      console.error('Login error:', e);
      throw new Error(e.message || 'Error during login. Check your credentials.');
    }
  }

  /**
   * Logs out the user from Firebase and clears the external API token from storage.
   */
  async logout(): Promise<void> {
    await this.auth.signOut();
    await this._storage?.remove(this.EXTERNAL_API_TOKEN_KEY);
    console.log('User logged out and external token cleared.');
  }

  /**
   * Logs into the external notification platform API to obtain an access token.
   * NOTE: The external API might require specific app credentials or a different login mechanism.
   * Adjust the `credentials` object and HTTP request as per the platform's documentation.
   */
  private async loginToExternalApi(email: string, password: string): Promise<void> {
    // For demonstration, using email/password. This might be fixed app credentials in production.
    const credentials = { email, password };
    try {
      const response: any = await this.http.post(`${environment.externalApiUrl}/user/login`, credentials).toPromise();
      if (response && response.token) {
        await this.setExternalApiToken(response.token);
        console.log('External API token obtained and stored.');
      } else {
        console.warn('External API login successful, but no token received.');
      }
    } catch (error) {
      console.error('Error logging into external API:', error);
      // You might want to handle this error more gracefully, e.g., show a warning to the user
    }
  }

  /**
   * Retrieves the external API token from Ionic Storage.
   */
  async getExternalApiToken(): Promise<string | null> {
    return await this._storage?.get(this.EXTERNAL_API_TOKEN_KEY) || null;
  }

  /**
   * Stores the external API token in Ionic Storage.
   */
  async setExternalApiToken(token: string): Promise<void> {
    await this._storage?.set(this.EXTERNAL_API_TOKEN_KEY, token);
  }

  /**
   * Retrieves the Firebase ID token for the current authenticated user.
   * Useful for authenticating with your own backend services that verify Firebase tokens.
   */
  getFirebaseIdToken(): Observable<string | null> {
    return this.currentUser.pipe(
      switchMap(user => {
        if (user) {
          return from(user.getIdToken());
        }
        return from(Promise.resolve(null)); // Return null if no user is logged in
      })
    );
  }

  /**
   * Fetches a user's profile from Firestore by their UID.
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDocRef = doc(this.firestore, `users/${uid}`);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }
}