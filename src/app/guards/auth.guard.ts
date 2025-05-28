import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // Observe the current user's authentication state
    return this.authService.currentUser.pipe(
      take(1), // Take only the first emission and complete
      map(user => {
        const isAuthenticated = !!user; // True if a user object exists, false otherwise
        const isLoginPage = state.url === '/login' || state.url === '/register';

        if (isAuthenticated && isLoginPage) {
          // If the user is logged in AND trying to access login/register, redirect to home
          console.log('AuthGuard: User logged in, redirecting from login/register to home.');
          return this.router.createUrlTree(['/home']);
        } else if (!isAuthenticated && !isLoginPage) {
          // If the user is NOT logged in AND trying to access a protected route, redirect to login
          console.log('AuthGuard: User not logged in, redirecting to login.');
          return this.router.createUrlTree(['/login']);
        }
        // Otherwise (e.g., logged in and accessing a protected route, or not logged in and accessing login/register), allow access
        console.log('AuthGuard: Access granted.');
        return true;
      })
    );
  }
}