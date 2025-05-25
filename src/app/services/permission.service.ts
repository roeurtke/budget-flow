import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, Observable, throwError, BehaviorSubject } from 'rxjs';
import { Permission } from '../interfaces/fetch-data.interface';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { map, catchError, shareReplay } from 'rxjs/operators';

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
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user.permissions) {
          this.userPermissions.next(user.permissions);
        }
      },
      error: () => {
        this.userPermissions.next([]);
      }
    });
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

    // Helper methods for common permission checks
    canViewDashboard(): Observable<boolean> {
      return this.hasPermission('can_view_dashboard');
    }
  
  // Cash Flow permissions
  canViewIncome(): Observable<boolean> {
    return this.hasPermission('can_view_income');
  }

  canManageIncome(): Observable<boolean> {
    return this.hasAnyPermission([
      'can_create_income',
      'can_update_income',
      'can_delete_income'
    ]);
  }

  canViewExpense(): Observable<boolean> {
    return this.hasPermission('can_view_expense');
  }

  canManageExpense(): Observable<boolean> {
    return this.hasAnyPermission([
      'can_create_expense',
      'can_update_expense',
      'can_delete_expense'
    ]);
  }

  // Category permissions
  canViewIncomeCategory(): Observable<boolean> {
    return this.hasPermission('can_view_income_category');
  }

  canManageIncomeCategory(): Observable<boolean> {
    return this.hasAnyPermission([
      'can_create_income_category',
      'can_update_income_category',
      'can_delete_income_category'
    ]);
  }

  canViewExpenseCategory(): Observable<boolean> {
    return this.hasPermission('can_view_expense_category');
  }

  canManageExpenseCategory(): Observable<boolean> {
    return this.hasAnyPermission([
      'can_create_expense_category',
      'can_update_expense_category',
      'can_delete_expense_category'
    ]);
  }

  // User management permissions
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

  // Role management permissions
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

  // Permission management permissions
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

  // Ability management permissions
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
