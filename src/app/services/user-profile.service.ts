import { Injectable } from '@angular/core';
import { Firestore, doc, updateDoc, getDoc } from '@angular/fire/firestore';
import { SupabaseClient } from '@supabase/supabase-js';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AuthService, UserProfile } from './auth.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {

  constructor(
    private firestore: Firestore,
    private supabase: SupabaseClient,
    private authService: AuthService
  ) { }

  /**
   * Actualiza el nombre y apellido del usuario en Firestore.
   * @param userId El ID del usuario.
   * @param name El nuevo nombre.
   * @param lastName El nuevo apellido.
   */
  async updateUserName(userId: string, name: string, lastName: string): Promise<void> {
    try {
      const userDocRef = doc(this.firestore, `users/${userId}`);
      await updateDoc(userDocRef, { name, lastName });
      console.log('Nombre y apellido del usuario actualizados en Firestore.');
    } catch (error) {
      console.error('Error al actualizar nombre y apellido en Firestore:', error);
      throw error;
    }
  }

  /**
   * Permite al usuario seleccionar o tomar una foto de perfil.
   * @returns La foto en formato base64 o null si se cancela.
   */
  async selectProfilePhoto(): Promise<string | null> {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64, // Obtener la imagen como base64
        source: CameraSource.Prompt // Preguntar al usuario si desea tomar foto o seleccionar de galería
      });

      return image.base64String ? `data:image/jpeg;base64,${image.base64String}` : null;
    } catch (error) {
      console.error('Error al seleccionar la foto:', error);
      return null;
    }
  }

  /**
   * Sube una foto de perfil a Supabase Storage y actualiza la URL en Firestore.
   * @param userId El ID del usuario.
   * @param base64Photo La foto en formato base64 (incluyendo el prefijo 'data:image/jpeg;base64,').
   * @returns La URL pública de la foto subida.
   */
  async uploadProfilePhoto(userId: string, base64Photo: string): Promise<string> {
    try {
      const fileName = `${userId}_profile_${Date.now()}.jpeg`;
      const bucketName = 'profile-photos'; // Nombre del bucket en Supabase Storage

      // Decodificar base64 a un Blob
      const byteCharacters = atob(base64Photo.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      // Subir el Blob a Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false, // No sobrescribir si ya existe
          contentType: 'image/jpeg'
        });

      if (error) {
        throw error;
      }

      // Obtener la URL pública de la foto
      const { data: publicUrlData } = this.supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error('No se pudo obtener la URL pública de la foto.');
      }

      const photoUrl = publicUrlData.publicUrl;

      // Actualizar la URL de la foto en el documento del usuario en Firestore
      const userDocRef = doc(this.firestore, `users/${userId}`);
      await updateDoc(userDocRef, { photoUrl: photoUrl });

      console.log('Foto de perfil subida a Supabase y URL actualizada en Firestore:', photoUrl);
      return photoUrl;

    } catch (error) {
      console.error('Error al subir la foto de perfil a Supabase o actualizar Firestore:', error);
      throw error;
    }
  }

  /**
   * Obtiene el perfil completo del usuario, incluyendo la URL de la foto.
   * @param userId El ID del usuario.
   * @returns El perfil del usuario o null.
   */
  async getUserProfileWithPhoto(userId: string): Promise<UserProfile | null> {
    const userDocRef = doc(this.firestore, `users/${userId}`);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  }
}