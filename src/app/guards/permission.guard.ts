import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take } from 'rxjs/operators';
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
      return of(true);
    }

    return this.permissionService.hasPermission(requiredPermission).pipe(
      take(1),
      map(hasPermission => {
        if (hasPermission) {
          return true;
        }
        
        this.router.navigate(['/unauthorized']);
        return false;
      })
    );
  }
}
