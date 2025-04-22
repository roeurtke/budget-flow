import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { map, Observable, of } from 'rxjs';

export const authGuard: CanActivateFn = (
  route,
  state
): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check authentication synchronously first for quick response
  if (authService.isAuthenticated) {
    return true;
  }

  // Optional: Add automatic token refresh attempt before final rejection
  const token = authService.getToken();
  if (token) {
    // If token exists but user isn't authenticated, try refreshing
    return authService.refreshToken().pipe(
      map(success => {
        if (success) {
          return true;
        }
        return redirectToLogin(router, state.url);
      })
    );
  }

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
      queryParams: { returnUrl },
      queryParamsHandling: 'merge'
    }
  );
}