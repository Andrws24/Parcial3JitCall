import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard'; // Import your AuthGuard

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule),
    canActivate: [AuthGuard] // Use the guard here
  },
  {
    path: 'register',
    loadChildren: () => import('./register/register.module').then( m => m.RegisterPageModule),
    canActivate: [AuthGuard] // Use the guard here
  },
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule),
    canActivate: [AuthGuard] // Protect the home page
  },
  {
    path: '',
    redirectTo: 'home', // Default route, will be redirected by guard if not logged in
    pathMatch: 'full'
  },
  {
    path: 'add-contact',
    loadChildren: () => import('./add-contact/add-contact.module').then( m => mm.AddContactPageModule),
    canActivate: [AuthGuard] // Protect adding contacts
  },
  {
    path: 'user-profile',
    loadChildren: () => import('./user-profile/user-profile.module').then( m => m.UserProfilePageModule)
  }
  // You will add more routes here as you develop more features
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }