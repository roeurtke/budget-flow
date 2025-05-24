import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, forkJoin } from 'rxjs';
import {RolePermission, RoleWithPermissionCount } from '../interfaces/fetch-data.interface';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { catchError, map } from 'rxjs/operators';
import { RoleService } from './role.service';

@Injectable({
  providedIn: 'root'
})
export class AbilityService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService, private roleService: RoleService) { }

  getRolePermissions(): Observable<RolePermission[]> {
    return this.http.get<{ results?: RolePermission[] } | RolePermission[]>(`${this.apiUrl}/api/role-permissions/`, { params: { page_size: '100' } }).pipe(
      map((response: { results?: RolePermission[] } | RolePermission[]) => {
        let rolePermissions: RolePermission[] = [];
        if (Array.isArray(response)) return response;
        else if (response.results) rolePermissions = response.results;
        else rolePermissions = [response as RolePermission];
        return rolePermissions.filter(rolePermission => rolePermission.status == true);
      })
    );
  }

  getRolePermissonForUpdate(): Observable<RolePermission[]> {
    return this.http.get<{ results?: RolePermission[] } | RolePermission[]>(`${this.apiUrl}/api/role-permissions/`, { params: { page_size: '100' } }).pipe(
      map((response: { results?: RolePermission[] } | RolePermission[]) => {
        let rolePermissions: RolePermission[] = [];
        if (Array.isArray(response)) return response;
        else if (response.results) rolePermissions = response.results;
        else rolePermissions = [response as RolePermission];
        return rolePermissions;
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

  getRolesWithPermissionCountForDataTables(): Observable<{ count: number, results: RoleWithPermissionCount[] }> {
    return forkJoin([
      this.roleService.getRoles(),
      this.getRolePermissions()
    ]).pipe(
      map(([roles, rolePermissions]) => {
        // Step 1: Count permissions per role
        const permissionCountMap = new Map<number, number>();

        rolePermissions.forEach((rp) => {
          const roleId = rp.role.id;
          permissionCountMap.set(roleId, (permissionCountMap.get(roleId) || 0) + 1);
        });

        // Step 2: Merge roles with their permission count
        const results: RoleWithPermissionCount[] = roles.map((role) => ({
          ...role,
          permission_count: permissionCountMap.get(role.id) || 0
        }));

        return {
          count: results.length,
          results
        };
      })
    );
  }

  createRolePermission(rolePermission: { role: number; permission: number }): Observable<RolePermission | null> {
    return this.http.post<RolePermission>(`${this.apiUrl}/api/role-permissions/`, rolePermission);
  }

  updateRolePermission(rolePermissionId: number, rolePermission: { role: number; permission: number; status: boolean }): Observable<RolePermission | null> {
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
