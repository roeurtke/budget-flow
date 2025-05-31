import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, Observable, throwError, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Permission } from '../interfaces/fetch-data.interface';
import { PermissionCode, PermissionMap } from '../shared/permissions/permissions.constants';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private apiUrl = environment.apiUrl;
  private userPermissions = new BehaviorSubject<string[]>([]);

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.authService.getCurrentUser().pipe(
      tap(user => {
        const permissions = this.extractPermissionsFromUser(user);
        this.userPermissions.next(permissions);
      })
    ).subscribe();

    this.authService.onLogin().pipe(
      tap(response => {
        const permissions = this.extractPermissionsFromUser(response.user);
        this.userPermissions.next(permissions);
      })
    ).subscribe();
  }

  private extractPermissionsFromUser(user: any): string[] {
    if (!user) return [];

    const permissions = new Set<string>();

    if (Array.isArray(user.permissions)) {
      user.permissions.forEach((p: any) => {
        if (typeof p === 'string') permissions.add(p);
        else if (p.codename) permissions.add(p.codename);
      });
    }

    if (Array.isArray(user.role?.permissions)) {
      user.role.permissions.forEach((p: any) => {
        if (typeof p === 'string') permissions.add(p);
        else if (p.codename) permissions.add(p.codename);
      });
    }

    if (Array.isArray(user.role?.role_permissions)) {
      user.role.role_permissions.forEach((rp: any) => {
        if (rp.permission?.codename) permissions.add(rp.permission.codename);
        if (rp.status !== false && rp.codename) permissions.add(rp.codename);
      });
    }

    return Array.from(permissions);
  }

  getUserPermissions(): Observable<string[]> {
    return this.userPermissions.asObservable();
  }

  hasPermission(permission: string): Observable<boolean> {
    return this.userPermissions.pipe(
      map(perms => perms.includes(permission))
    );
  }

  hasAnyPermission(permissions: string[]): Observable<boolean> {
    return this.userPermissions.pipe(
      map(userPerms => permissions.some(p => userPerms.includes(p)))
    );
  }

  hasAllPermissions(permissions: string[]): Observable<boolean> {
    return this.userPermissions.pipe(
      map(userPerms => permissions.every(p => userPerms.includes(p)))
    );
  }

  /**
   * Generic check using PermissionMap: canPerform('income', 'create')
   */
  canPerform(module: keyof typeof PermissionMap, action: keyof typeof PermissionMap[keyof typeof PermissionMap]): Observable<boolean> {
    const permission = PermissionMap[module]?.[action];
    if (!permission) {
      console.warn(`Permission not defined for ${module}.${action}`);
      return of(false);
    }
    return this.hasPermission(permission);
  }

  getPermissions(): Observable<Permission[]> {
    return this.http.get<{ results?: Permission[] } | Permission[]>(`${this.apiUrl}/api/permissions/`, {
      params: { page_size: '100' }
    }).pipe(
      map(response => {
        let permissions: Permission[] = [];
        if (Array.isArray(response)) return response;
        else if (response.results) permissions = response.results;
        else permissions = [response as Permission];
        return permissions.filter(permission => permission.status === true);
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

  getPermissionById(permissionId: number): Observable<Permission | null> {
    return this.http.get<Permission>(`${this.apiUrl}/api/permissions/${permissionId}/`).pipe(
      catchError(err => err.status === 404 ? of(null) : throwError(() => err))
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
      catchError(err => err.status === 404 ? of(null) : throwError(() => err))
    );
  }

  updatePermission(permissionId: number, permission: Permission): Observable<Permission | null> {
    return this.http.put<Permission>(`${this.apiUrl}/api/permissions/${permissionId}/`, permission).pipe(
      catchError(err => err.status === 404 ? of(null) : throwError(() => err))
    );
  }

  deletePermission(permissionId: number): Observable<Permission | null> {
    return this.http.delete<Permission>(`${this.apiUrl}/api/permissions/${permissionId}/`).pipe(
      catchError(err => err.status === 404 ? of(null) : throwError(() => err))
    );
  }

  canViewDashboard(): Observable<boolean> {
    return this.hasAnyPermission([
      PermissionCode.CAN_VIEW_LIST_INCOME,
      PermissionCode.CAN_VIEW_LIST_EXPENSE,
      PermissionCode.CAN_VIEW_LIST_INCOME_CATEGORY,
      PermissionCode.CAN_VIEW_LIST_EXPENSE_CATEGORY
    ]);
  }

  canViewIncomeList(): Observable<boolean> {
    return this.canPerform('income', 'list');
  }

  canViewExpenseList(): Observable<boolean> {
    return this.canPerform('expense', 'list');
  }

  canViewIncomeCategoryList(): Observable<boolean> {
    return this.canPerform('incomeCategory', 'list');
  }

  canViewExpenseCategoryList(): Observable<boolean> {
    return this.canPerform('expenseCategory', 'list');
  }

  canViewUserList(): Observable<boolean> {
    return this.canPerform('user', 'list');
  }

  canViewRoleList(): Observable<boolean> {
    return this.canPerform('role', 'list');
  }

  canViewPermissionList(): Observable<boolean> {
    return this.canPerform('permission', 'list');
  }

  canViewAbilityList(): Observable<boolean> {
    return this.canPerform('ability', 'list');
  }
}
