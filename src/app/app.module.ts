import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

// Firebase imports
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';

// Ionic Storage imports
import { IonicStorageModule } from '@ionic/storage-angular';
import { Drivers } from '@ionic/storage';

// Custom Interceptor
import { AuthInterceptor } from './interceptors/auth.interceptor';

// Supabase imports
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig } from './supabase.config'; // Importa tu archivo de configuración de Supabase

// Proveedor de Supabase
export function initializeSupabase(): SupabaseClient {
  return createClient(supabaseConfig.supabaseUrl, supabaseConfig.supabaseAnonKey);
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,

    // Firebase Module Initialization
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),

    // Ionic Storage Module Initialization
    IonicStorageModule.forRoot({
      name: 'jitcall_db',
      driverOrder: [Drivers.IndexedDB, Drivers.LocalStorage]
    })
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    // Proveedor de Supabase
    {
      provide: SupabaseClient,
      useFactory: initializeSupabase
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}