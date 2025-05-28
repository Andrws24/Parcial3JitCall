import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { from, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { environment } from 'src/environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Use 'from' to convert the async operation of getting the token into an observable
    return from(this.authService.getExternalApiToken()).pipe(
      switchMap(externalApiToken => {
        let authReq = request; // Start with the original request

        // Check if the request's URL starts with the external API URL
        // AND if an external API token is available
        if (request.url.startsWith(environment.externalApiUrl) && externalApiToken) {
          console.log('AuthInterceptor: Adding external API token to request to', request.url);
          // Clone the request and add the Authorization header
          authReq = request.clone({
            setHeaders: {
              Authorization: `Bearer ${externalApiToken}` // Standard Bearer token format
            }
          });
        }
        // You could add logic here for Firebase ID token if you had specific Firebase Cloud Functions or other APIs that require it.
        // For this project, the requirement specifies the external API token for the notification service.

        // Pass the modified (or original) request to the next handler in the chain
        return next.handle(authReq);
      })
    );
  }
}