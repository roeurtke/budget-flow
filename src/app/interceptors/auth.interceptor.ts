import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, switchMap, catchError, from } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TokenResponse } from '../interfaces/auth.interface';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);

  const isAuthEndpoint =
    req.url.includes('/api/login/') || req.url.includes('/api/token/refresh/');

  if (isAuthEndpoint) {
    return next(req);
  }

  const accessToken = authService.getAccessToken();

  if (accessToken && !authService.isTokenExpired(accessToken)) {
    // Token is valid — proceed with request
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !isAuthEndpoint) {
          const refreshToken = authService.getRefreshToken();

          if (!refreshToken || authService.isTokenExpired(refreshToken)) {
            authService.logout();
            return throwError(() => new Error('Session expired. Please log in again.'));
          }

          return authService.refreshToken().pipe(
            switchMap((response: TokenResponse) => {
              authService.setAccessToken(response.access);
              if (response.refresh) {
                authService.setRefreshToken(response.refresh);
              }

              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${response.access}`,
                },
              });

              return next(retryReq);
            }),
            catchError((refreshError: any) => {
              authService.logout();
              return throwError(() => new Error('Session expired. Please log in again.'));
            })
          );
        }

        return throwError(() => error);
      })
    );
  }

  // If token is expired or missing, try refreshing it
  const refreshToken = authService.getRefreshToken();

  if (!refreshToken || authService.isTokenExpired(refreshToken)) {
    // No valid refresh token — logout
    authService.logout();
    return throwError(() => new Error('Session expired. Please log in again.'));
  }

  // Refresh token and retry original request
  return from(authService.refreshToken()).pipe(
    switchMap((response: TokenResponse) => {
      authService.setAccessToken(response.access);
      if (response.refresh) {
        authService.setRefreshToken(response.refresh);
      }

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
};
