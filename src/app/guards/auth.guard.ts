import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, catchError, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export const authGuard: CanActivateFn = (
  route,
  state
): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  const http = inject(HttpClient);

  const accessToken = tokenService.getAccessToken();
  const refreshToken = tokenService.getRefreshToken();

  // Debug logging
  console.log('Auth guard token state:', {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    isAccessTokenExpired: accessToken ? tokenService.isTokenExpired(accessToken) : true,
    isRefreshTokenExpired: refreshToken ? tokenService.isTokenExpired(refreshToken) : true,
    refreshTokenPayload: refreshToken ? tokenService.decodeToken(refreshToken) : null
  });

  // If no tokens exist, redirect to login
  if (!accessToken || !refreshToken) {
    console.log('No tokens found in auth guard');
    return redirectToLogin(router, state.url);
  }

  // If access token is valid, allow access
  if (!tokenService.isTokenExpired(accessToken)) {
    // console.log('Valid access token found');
    return true;
  }

  // If access token is expired but refresh token exists, try to refresh
  if (!tokenService.isTokenExpired(refreshToken)) {
    console.log('Access token expired, attempting refresh in auth guard');
    const refreshUrl = `${environment.apiUrl}/api/token/refresh/`;
    console.log('Refresh request details:', {
      url: refreshUrl,
      refreshToken: refreshToken.substring(0, 10) + '...' // Only log first 10 chars for security
    });

    return http.post<{access: string}>(refreshUrl, { refresh: refreshToken }).pipe(
      tap({
        next: (response) => {
          console.log('Refresh response received:', {
            hasAccessToken: !!response.access,
            accessTokenLength: response.access?.length
          });
        },
        error: (error) => {
          console.error('Refresh request failed:', {
            status: error.status,
            statusText: error.statusText,
            error: error.error,
            headers: error.headers?.keys()
          });
        }
      }),
      map(response => {
        if (!response.access) {
          throw new Error('Invalid refresh response: no access token received');
        }
        tokenService.setAccessToken(response.access);
        console.log('Token refresh successful in auth guard');
        return true;
      }),
      catchError(error => {
        console.error('Token refresh failed in auth guard:', error);
        tokenService.clearTokens();
        return of(redirectToLogin(router, state.url));
      })
    );
  }

  // If refresh token is also expired, redirect to login
  console.log('Refresh token expired in auth guard');
  tokenService.clearTokens();
  return redirectToLogin(router, state.url);
};

/**
 * Helper function to create login redirect with return URL
 * @param router Router instance
 * @param returnUrl URL to return to after login
 * @returns UrlTree to login page
 */
function redirectToLogin(router: Router, returnUrl: string): UrlTree {
  return router.createUrlTree(
    ['/login'],
    {
      queryParams: {
        returnUrl: returnUrl,
        reason: 'auth_required'
      }
    }
  );
}