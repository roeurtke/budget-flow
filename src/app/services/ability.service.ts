import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { RolePermission } from '../interfaces/fetch-data.interface';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AbilityService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) { }

  getRolePermissions(): Observable<RolePermission[]> {
    return this.http.get<{ results?: RolePermission[] } | RolePermission[]>(this.apiUrl).pipe(
      map((response: { results?: RolePermission[] } | RolePermission[]) => {
        if (Array.isArray(response)) return response;
        if (response.results) return response.results;
        return [response as RolePermission];
      })
    );
  }

  getRolePermissionById(rolePermissionId: number): Observable<RolePermission | null> {
    return this.http.get<RolePermission>(`${this.apiUrl}/api/role-permissions/${rolePermissionId}/`).pipe(
      map((response: RolePermission) => {
        return response;
      }),
      catchError((error) => {
        if (error.status === 404) return of(null);
        return throwError(() => error)
      })
    );
  }

  getRolePermissionList(page: number = 1, pageSize: number = 10, searchTerm: string = '', ordering: string = ''): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/role-permissions/`, {
      params: {
        page: page.toString(),
        page_size: pageSize.toString(),
        search: searchTerm,
        ordering
      }
    });
  }

  getRolePermissionsForDataTables(dtParams: any): Observable<any> {
    const page = (dtParams.start / dtParams.length) + 1;
    const pageSize = dtParams.length;
    const searchTerm = dtParams.search.value;

    let ordering = '';
    if (dtParams.order && dtParams.order.length > 0) {
      const order = dtParams.order[0];
      const columnName = dtParams.columns[order.column].data;
      ordering = order.dir === 'desc' ? `-${columnName}` : columnName;
    }

    return this.getRolePermissionList(page, pageSize, searchTerm, ordering);
  }

  createRolePermission(rolePermission: RolePermission): Observable<RolePermission | null> {
    return this.http.post<RolePermission>(`${this.apiUrl}/api/role-permissions/`, rolePermission).pipe(
      catchError((err) => {
        if (err.status === 404) return of(null);
        return throwError(() => err);
      })
    );
  }

  updateRolePermission(rolePermissionId: number, rolePermission: RolePermission): Observable<RolePermission | null> {
    return this.http.put<RolePermission>(`${this.apiUrl}/api/role-permissions/${rolePermissionId}/`, rolePermission).pipe(
      catchError((err) => {
        if (err.status === 404) return of(null);
        return throwError(() => err);
      })
    );
  }

  deleteRolePermission(rolePermissionId: number): Observable<RolePermission | null> {
    return this.http.delete<RolePermission>(`${this.apiUrl}/api/role-permissions/${rolePermissionId}/`).pipe(
      catchError((err) => {
        if (err.status === 404) return of(null);
        return throwError(() => err);
      })
    );
  }
}
