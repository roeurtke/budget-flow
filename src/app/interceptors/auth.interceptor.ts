import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

// Define the token response type
interface TokenResponse {
  access: string;
  refresh?: string;  // Make refresh optional if your backend doesn't always return it
}

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);

  // Skip endpoints that don't need authorization
  if (
    req.url.includes('/api/login/') ||
    req.url.includes('/api/refresh-token/')
  ) {
    return next(req);
  }

  // Add authorization header if token exists
  const token = authService.getAccessToken();
  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only handle 401 errors and skip login/refresh endpoints
      if (error.status === 401 && !req.url.includes('/api/login/')) {
        const refreshToken = authService.getRefreshToken();
        
        // Attempt token refresh if we have a refresh token
        if (refreshToken) {
          return authService.refreshToken().pipe(
            switchMap((response: TokenResponse) => {
              // Store new tokens
              authService.setAccessToken(response.access);
              if (response.refresh) {
                authService.setRefreshToken(response.refresh);
              }
              
              // Retry the original request with new token
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${response.access}`,
                },
              });
              
              return next(retryReq);
            }),
            catchError((refreshError: any) => {
              // If refresh fails, clear auth state and redirect to login
              authService.logout();
              return throwError(() => refreshError);
            })
          );
        }
        
        // If no refresh token, clear auth state
        authService.logout();
      }
      
      // Re-throw other errors
      return throwError(() => error);
    })
  );
};