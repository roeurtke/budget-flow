import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, Observable } from 'rxjs';
import { Permission } from '../interfaces/fetch-data.interface';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { map, catchError, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private apiUrl = environment.apiUrl;
  private cachedPermissions$?: Observable<string[]>;

  constructor(private http: HttpClient, private authService: AuthService) { }

  getPermissionList(): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.apiUrl}/api/permissions/`).pipe(
      catchError(err => {
        console.error('Error fetching permissions:', err);
        return of([]);
      })
    );
  }

  // Optional: cache permissions
  getPermissions(): Observable<string[]> {
    if (!this.cachedPermissions$) {
      this.cachedPermissions$ = this.http.get<string[]>(`${this.apiUrl}/api/permissions/`).pipe(
        shareReplay(1),
        catchError(() => of([]))
      );
    }
    return this.cachedPermissions$;
  }

  hasPermission(permission: string): Observable<boolean> {
    return this.getPermissions().pipe(
      map(perms => perms.includes(permission))
    );
  }

  createPermission(permission: Permission): Observable<Permission | null> {
    return this.http.post<Permission>(`${this.apiUrl}/api/permissions/`, permission).pipe(
      catchError(err => {
        console.error('Error creating permission:', err);
        return of(null);
      })
    );
  }
}
