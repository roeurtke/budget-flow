import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, switchMap, catchError, BehaviorSubject } from 'rxjs';
import { TokenService } from '../services/token.service';
import { Router } from '@angular/router';
import { TokenExpiredError } from '../interfaces/auth.interface';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

// Keep track of refresh attempts
const refreshSubject = new BehaviorSubject<boolean>(false);

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  const http = inject(HttpClient);

  // Skip auth endpoints
  if (isAuthEndpoint(req.url)) {
    return next(req);
  }

  const accessToken = tokenService.getAccessToken();
  const refreshToken = tokenService.getRefreshToken();

  // If we have a valid access token, use it
  if (accessToken && !tokenService.isTokenExpired(accessToken)) {
    return next(addAuthHeader(req, accessToken)).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return handleUnauthorizedError(req, next, http, tokenService, router);
        }
        return throwError(() => error);
      })
    );
  }

  // If we have a valid refresh token, try to refresh
  if (refreshToken && !tokenService.isTokenExpired(refreshToken)) {
    return handleTokenRefresh(req, next, http, tokenService, router);
  }

  // No valid tokens, redirect to login
  handleSessionExpired(tokenService, router);
  return throwError(() => new TokenExpiredError('Session expired. Please log in again.'));
};

function isAuthEndpoint(url: string): boolean {
  return url.includes('/api/login/') || 
         url.includes('/api/register/') || 
         url.includes('/api/token/refresh/');
}

function addAuthHeader(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

function handleTokenRefresh(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  http: HttpClient,
  tokenService: TokenService,
  router: Router
): Observable<HttpEvent<unknown>> {
  const refreshToken = tokenService.getRefreshToken();
  if (!refreshToken) {
    handleSessionExpired(tokenService, router);
    return throwError(() => new TokenExpiredError('No refresh token available'));
  }

  return http.post<{access: string}>(`${environment.apiUrl}/api/token/refresh/`, { refresh: refreshToken }).pipe(
    switchMap((response) => {
      if (!response.access) {
        throw new Error('Invalid refresh response: no access token received');
      }
      tokenService.setAccessToken(response.access);
      refreshSubject.next(true);
      return next(addAuthHeader(req, response.access));
    }),
    catchError((error) => {
      refreshSubject.next(false);
      handleSessionExpired(tokenService, router);
      return throwError(() => error);
    })
  );
}

function handleUnauthorizedError(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  http: HttpClient,
  tokenService: TokenService,
  router: Router
): Observable<HttpEvent<unknown>> {
  const refreshToken = tokenService.getRefreshToken();
  
  if (!refreshToken || tokenService.isTokenExpired(refreshToken)) {
    handleSessionExpired(tokenService, router);
    return throwError(() => new TokenExpiredError('Session expired. Please log in again.'));
  }

  return handleTokenRefresh(req, next, http, tokenService, router);
}

function handleSessionExpired(tokenService: TokenService, router: Router): void {
  tokenService.clearTokens();
  const currentUrl = router.url;
  if (!currentUrl.includes('/login')) {
    router.navigate(['/login'], {
      queryParams: {
        returnUrl: currentUrl,
        reason: 'session_expired'
      }
    });
  }
}
