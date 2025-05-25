import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, Observable, throwError, BehaviorSubject } from 'rxjs';
import { Permission } from '../interfaces/fetch-data.interface';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { map, catchError, tap, switchMap } from 'rxjs/operators';

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
    // Subscribe to auth state changes to update permissions
    this.authService.getCurrentUser().pipe(
      switchMap(user => this.fetchUserRolePermissions(user.role.id)),
      tap(permissions => {
        console.log('Fetched role permissions:', permissions);
        this.userPermissions.next(permissions);
      }),
      catchError(error => {
        console.error('Error getting role permissions:', error);
        this.userPermissions.next([]);
        return throwError(() => error);
      })
    ).subscribe();

    // Also handle permissions from login response
    this.authService.onLogin().pipe(
      switchMap(response => this.fetchUserRolePermissions(response.user.role.id)),
      tap(permissions => {
        console.log('Login role permissions:', permissions);
        this.userPermissions.next(permissions);
      })
    ).subscribe();
  }

  private fetchUserRolePermissions(roleId: number): Observable<string[]> {
    // Try different possible endpoints for role permissions
    return this.http.get<any>(`${this.apiUrl}/api/roles/${roleId}/`).pipe(
      map(response => {
        console.log('Role response:', response);
        // Check if permissions are in different possible locations in the response
        if (response.permissions) {
          return Array.isArray(response.permissions) 
            ? response.permissions.map((p: any) => p.codename || p)
            : [];
        }
        if (response.role_permissions) {
          return Array.isArray(response.role_permissions)
            ? response.role_permissions.map((p: any) => p.codename || p)
            : [];
        }
        // If no permissions found, return empty array
        console.warn('No permissions found in role response');
        return [];
      }),
      catchError(error => {
        console.error('Error fetching role:', error);
        // If the first endpoint fails, try the alternative endpoint
        return this.http.get<any>(`${this.apiUrl}/api/permissions/role/${roleId}/`).pipe(
          map(response => {
            console.log('Alternative role permissions response:', response);
            if (Array.isArray(response)) {
              return response.map(p => p.codename || p);
            }
            if (response.permissions) {
              return Array.isArray(response.permissions)
                ? response.permissions.map((p: any) => p.codename || p)
                : [];
            }
            return [];
          }),
          catchError(secondError => {
            console.error('Error fetching role permissions from alternative endpoint:', secondError);
            return of([]);
          })
        );
      })
    );
  }

  // Check if user has specific permission
  hasPermission(permission: string): Observable<boolean> {
    return this.userPermissions.pipe(
      map(permissions => permissions.includes(permission))
    );
  }

  // Check if user has any of the given permissions
  hasAnyPermission(permissions: string[]): Observable<boolean> {
    return this.userPermissions.pipe(
      map(userPermissions => 
        permissions.some(permission => userPermissions.includes(permission))
      )
    );
  }

  // Check if user has all of the given permissions
  hasAllPermissions(permissions: string[]): Observable<boolean> {
    return this.userPermissions.pipe(
      map(userPermissions => 
        permissions.every(permission => userPermissions.includes(permission))
      )
    );
  }

  // Dashboard permissions
  canViewDashboard(): Observable<boolean> {
    return of(true); // Dashboard is accessible to all authenticated users
  }

  // Income Management permissions
  canViewIncome(): Observable<boolean> {
    return this.hasPermission('can_view_income');
  }

  canViewIncomeList(): Observable<boolean> {
    return this.hasPermission('can_view_list_income');
  }

  canCreateIncome(): Observable<boolean> {
    return this.hasPermission('can_create_income');
  }

  canUpdateIncome(): Observable<boolean> {
    return this.hasPermission('can_update_income');
  }

  canDeleteIncome(): Observable<boolean> {
    return this.hasPermission('can_delete_income');
  }

  // Expense Management permissions
  canViewExpense(): Observable<boolean> {
    return this.hasPermission('can_view_expense');
  }

  canViewExpenseList(): Observable<boolean> {
    return this.hasPermission('can_view_list_expense');
  }

  canCreateExpense(): Observable<boolean> {
    return this.hasPermission('can_create_expense');
  }

  canUpdateExpense(): Observable<boolean> {
    return this.hasPermission('can_update_expense');
  }

  canDeleteExpense(): Observable<boolean> {
    return this.hasPermission('can_delete_expense');
  }

  // Income Category Management permissions
  canViewIncomeCategory(): Observable<boolean> {
    return this.hasPermission('can_view_income_category');
  }

  canViewIncomeCategoryList(): Observable<boolean> {
    return this.hasPermission('can_view_list_income_category');
  }

  canCreateIncomeCategory(): Observable<boolean> {
    return this.hasPermission('can_create_income_category');
  }

  canUpdateIncomeCategory(): Observable<boolean> {
    return this.hasPermission('can_update_income_category');
  }

  canDeleteIncomeCategory(): Observable<boolean> {
    return this.hasPermission('can_delete_income_category');
  }

  // Expense Category Management permissions
  canViewExpenseCategory(): Observable<boolean> {
    return this.hasPermission('can_view_expense_category');
  }

  canViewExpenseCategoryList(): Observable<boolean> {
    return this.hasPermission('can_view_list_expense_category');
  }

  canCreateExpenseCategory(): Observable<boolean> {
    return this.hasPermission('can_create_expense_category');
  }

  canUpdateExpenseCategory(): Observable<boolean> {
    return this.hasPermission('can_update_expense_category');
  }

  canDeleteExpenseCategory(): Observable<boolean> {
    return this.hasPermission('can_delete_expense_category');
  }

  // User Management permissions
  canViewUser(): Observable<boolean> {
    return this.hasPermission('can_view_user');
  }

  canViewUserList(): Observable<boolean> {
    return this.hasPermission('can_view_list_user');
  }

  canCreateUser(): Observable<boolean> {
    return this.hasPermission('can_create_user');
  }

  canUpdateUser(): Observable<boolean> {
    return this.hasPermission('can_update_user');
  }

  canDeleteUser(): Observable<boolean> {
    return this.hasPermission('can_delete_user');
  }

  // Role Management permissions
  canViewRole(): Observable<boolean> {
    return this.hasPermission('can_view_role');
  }

  canViewRoleList(): Observable<boolean> {
    return this.hasPermission('can_view_list_role');
  }

  canCreateRole(): Observable<boolean> {
    return this.hasPermission('can_create_role');
  }

  canUpdateRole(): Observable<boolean> {
    return this.hasPermission('can_update_role');
  }

  canDeleteRole(): Observable<boolean> {
    return this.hasPermission('can_delete_role');
  }

  // Permission Management permissions
  canViewPermission(): Observable<boolean> {
    return this.hasPermission('can_view_permission');
  }

  canViewPermissionList(): Observable<boolean> {
    return this.hasPermission('can_view_list_permission');
  }

  canCreatePermission(): Observable<boolean> {
    return this.hasPermission('can_create_permission');
  }

  canUpdatePermission(): Observable<boolean> {
    return this.hasPermission('can_update_permission');
  }

  canDeletePermission(): Observable<boolean> {
    return this.hasPermission('can_delete_permission');
  }

  // Ability Management permissions
  canViewAbility(): Observable<boolean> {
    return this.hasPermission('can_view_ability');
  }

  canViewAbilityList(): Observable<boolean> {
    return this.hasPermission('can_view_list_ability');
  }

  canCreateAbility(): Observable<boolean> {
    return this.hasPermission('can_create_ability');
  }

  canUpdateAbility(): Observable<boolean> {
    return this.hasPermission('can_update_ability');
  }

  canDeleteAbility(): Observable<boolean> {
    return this.hasPermission('can_delete_ability');
  }

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
}
