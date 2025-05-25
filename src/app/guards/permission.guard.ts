import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take, tap, catchError, filter, first, switchMap } from 'rxjs/operators';
import { PermissionService } from '../services/permission.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {
  constructor(
    private permissionService: PermissionService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const requiredPermission = route.data['permission'];
    
    if (!requiredPermission) {
      console.log('No permission required for route:', state.url);
      return of(true);
    }

    // console.log('Checking permission:', requiredPermission, 'for route:', state.url);
    
    // Wait for permissions to be loaded (non-empty array) before checking
    return this.permissionService.getUserPermissions().pipe(
      // Wait until we have permissions
      filter((permissions: string[]) => permissions.length > 0),
      // Take the first emission after we have permissions
      first(),
      // Now check the permission
      switchMap(() => {
        // console.log('Permissions loaded, checking permission:', requiredPermission);
        return this.permissionService.hasPermission(requiredPermission);
      }),
      take(1),
      // tap(hasPermission => {
      //   console.log('Permission check result:', {
      //     permission: requiredPermission,
      //     hasPermission,
      //     route: state.url
      //   });
      // }),
      map(hasPermission => {
        if (hasPermission) {
          return true;
        }
        
        console.log('Permission denied, redirecting to unauthorized');
        this.router.navigate(['/unauthorized'], {
          queryParams: {
            requiredPermission,
            returnUrl: state.url
          }
        });
        return false;
      }),
      catchError(error => {
        console.error('Error checking permission:', error);
        this.router.navigate(['/unauthorized'], {
          queryParams: {
            requiredPermission,
            returnUrl: state.url,
            error: 'permission_check_failed'
          }
        });
        return of(false);
      })
    );
  }
}
