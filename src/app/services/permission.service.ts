import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, Observable, throwError } from 'rxjs';
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

  getPermissions(): Observable<Permission[]> {
    return this.http.get<{ results?: Permission[] } | Permission[]>(`${this.apiUrl}/api/permissions/`, { params: { page_size: '100' } }).pipe(
      map((response: { results?: Permission[] } | Permission[]) => {
        let permissions: Permission[] = [];
        if (Array.isArray(response)) return response;
        else if (response.results) permissions = response.results;
        else permissions = [response as Permission];
        return permissions.filter(permission => permission.status == true);
      })
    );
  }

  getPermissionList(page: number = 1, pageSize: number = 10, searchTerm: string = '', ordering: string = ''): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/permissions/`, {
      params: {
        page: page.toString(),
        page_size: pageSize.toString(),
        search: searchTerm,
        ordering
      }
    });
  }

  getPermissionById(permissionId: Number): Observable<Permission | null> {
    return this.http.get<Permission>(`${this.apiUrl}/api/permissions/${permissionId}/`).pipe(
      catchError(err => {
        if (err.status === 404) return of(null);
        return throwError(() => err);
      })
    );
  }

  getPermissionForDataTables(dtParams: any): Observable<any> {
    const page = (dtParams.start / dtParams.length) + 1;
    const pageSize = dtParams.length;
    const searchTerm = dtParams.search.value;

    let ordering = '';
    if (dtParams.order && dtParams.order.length > 0) {
      const order = dtParams.order[0];
      const columnName = dtParams.columns[order.column].data;
      ordering = order.dir === 'desc' ? `-${columnName}` : columnName;
    }

    return this.getPermissionList(page, pageSize, searchTerm, ordering);
  }

  createPermission(permission: Permission): Observable<Permission | null> {
    return this.http.post<Permission>(`${this.apiUrl}/api/permissions/`, permission).pipe(
      catchError(err => {
        if (err.status === 404) return of(null);
        return throwError(() => err);
      })
    );
  }

  updatePermission(permissionId: Number, permission: Permission): Observable<Permission | null> {
    return this.http.put<Permission>(`${this.apiUrl}/api/permissions/${permissionId}/`, permission).pipe(
      catchError(err => {
        if (err.status === 404) return of(null);
        return throwError(() => err);
      })
    );
  }

  deletePermission(permissionId: Number): Observable<Permission | null> {
    return this.http.delete<Permission>(`${this.apiUrl}/api/permissions/${permissionId}/`).pipe(
      catchError(err => {
        if (err.status === 404) return of(null);
        return throwError(() => err);
      })
    );
  }

  // Optional: cache permissions
  // getPermissions(): Observable<string[]> {
  //   if (!this.cachedPermissions$) {
  //     this.cachedPermissions$ = this.http.get<string[]>(`${this.apiUrl}/api/permissions/`).pipe(
  //       shareReplay(1),
  //       catchError(() => of([]))
  //     );
  //   }
  //   return this.cachedPermissions$;
  // }

  // hasPermission(permission: string): Observable<boolean> {
  //   return this.getPermissions().pipe(
  //     map(perms => perms.includes(permission))
  //   );
  // }
}
