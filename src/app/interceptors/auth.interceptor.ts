import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, switchMap, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TokenResponse } from '../interfaces/auth.interface';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);

  // Skip login and refresh token endpoints from attaching token
  const isAuthEndpoint =
    req.url.includes('/api/login/') || req.url.includes('/api/token/refresh/');

  if (isAuthEndpoint) {
    return next(req); // Do not attach tokens to auth endpoints
  }

  // Add access token if available
  const accessToken = authService.getAccessToken();
  const authReq = accessToken
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthEndpoint) {
        const refreshToken = authService.getRefreshToken();

        if (!refreshToken) {
          authService.logout();
          return throwError(() => new Error('No refresh token. Logging out.'));
        }

        return authService.refreshToken().pipe(
          switchMap((response: TokenResponse) => {
            authService.setAccessToken(response.access);
            if (response.refresh) {
              authService.setRefreshToken(response.refresh);
            }

            // Retry original request with new access token
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${response.access}`,
              },
            });

            return next(retryReq);
          }),
          catchError((refreshError: any) => {
            console.error('Refresh token failed', refreshError);
            authService.logout();
            return throwError(() => new Error('Session expired. Please log in again.'));
          })
        );
      }

      return throwError(() => error);
      // Suppress the error log for the original 401 response
      // return of();
    })
  );
};
