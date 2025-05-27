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
      tap(user => {
        // Get permissions directly from user object
        const permissions = this.extractPermissionsFromUser(user);
        this.userPermissions.next(permissions);
      }),
      // Always fetch additional permissions without checking for 'can_view_permission'
      switchMap(user => {
        return this.fetchAdditionalPermissions(user.role.id).pipe(
          tap(additionalPermissions => {
            if (additionalPermissions.length > 0) {
              // Merge with existing permissions, avoiding duplicates
              const allPermissions = [...new Set([...this.userPermissions.value, ...additionalPermissions])];
              this.userPermissions.next(allPermissions);
            }
          }),
          catchError(error => {
            console.warn('Error fetching additional permissions:', error);
            return of([]);
          })
        );
      })
    ).subscribe();

    // Also handle permissions from login response
    this.authService.onLogin().pipe(
      tap(response => {
        const permissions = this.extractPermissionsFromUser(response.user);
        this.userPermissions.next(permissions);
      }),
      // Always fetch additional permissions without checking for 'can_view_permission'
      switchMap(response => {
        return this.fetchAdditionalPermissions(response.user.role.id).pipe(
          tap(additionalPermissions => {
            if (additionalPermissions.length > 0) {
              // Merge with existing permissions, avoiding duplicates
              const allPermissions = [...new Set([...this.userPermissions.value, ...additionalPermissions])];
              this.userPermissions.next(allPermissions);
            }
          }),
          catchError(error => {
            console.warn('Error fetching additional permissions from login:', error);
            return of([]);
          })
        );
      })
    ).subscribe();
  }

  private extractPermissionsFromUser(user: any): string[] {
    if (!user) {
      console.warn('No user object provided to extractPermissionsFromUser');
      return [];
    }

    // Try to get permissions from different possible locations in the user object
    const permissions = new Set<string>();
    
    // Check user.permissions (direct permissions array)
    if (user.permissions && Array.isArray(user.permissions)) {
      user.permissions.forEach((p: any) => {
        if (typeof p === 'string') {
          permissions.add(p);
        } else if (p.codename) {
          permissions.add(p.codename);
        }
      });
    }
    
    // Check role.permissions
    if (user.role?.permissions && Array.isArray(user.role.permissions)) {
      user.role.permissions.forEach((p: any) => {
        if (typeof p === 'string') {
          permissions.add(p);
        } else if (p.codename) {
          permissions.add(p.codename);
        }
      });
    }
    
    // Check role.role_permissions
    if (user.role?.role_permissions && Array.isArray(user.role.role_permissions)) {
      user.role.role_permissions.forEach((rp: any) => {
        if (rp.permission?.codename) {
          permissions.add(rp.permission.codename);
        }
        if (rp.status !== false && rp.codename) {
          permissions.add(rp.codename);
        }
      });
    }

    return Array.from(permissions);
  }

  private fetchAdditionalPermissions(roleId: number): Observable<string[]> {
    console.log('Fetching role permissions for role ID:', roleId); // Debug log
    return this.http.get<any>(`${this.apiUrl}/api/role-permissions/`, { 
      params: { 
        role: roleId.toString(), 
        page_size: '100' 
      } 
    }).pipe(
      map(response => {
        let permissions: any[] = [];
        
        if (Array.isArray(response)) {
          permissions = response;
        } else if (response.results && Array.isArray(response.results)) {
          permissions = response.results;
        } else if (response.permission) {
          permissions = [response];
        }

        const extractedPermissions = permissions
          .filter(p => p.status !== false)
          .map(p => p.permission?.codename || p.codename)
          .filter(Boolean);

        console.log('Fetched permissions from API:', extractedPermissions); // Debug log
        return extractedPermissions;
      }),
      catchError(error => {
        if (error.status === 403) {
          console.warn('Access denied: User does not have permission to fetch role permissions.');
        } else {
          console.warn('Error fetching role permissions:', error);
        }
        return of([]); // Return an empty array to avoid breaking the flow
      })
    );
  }

  private fetchAllPaginatedPermissions(roleId: number): Observable<string[]> {
    console.log('Fetching paginated permissions for role ID:', roleId); // Debug log
    return this.http.get<any>(`${this.apiUrl}/api/permissions/?role=${roleId}&page_size=100`).pipe(
      switchMap(response => {
        const allPermissions: string[] = [];
        
        // Add permissions from the first page
        if (response.results && Array.isArray(response.results)) {
          allPermissions.push(...response.results.map((p: any) => p.codename || p));
        }

        // If there are more pages, fetch them
        if (response.next) {
          return this.fetchRemainingPages(response.next, allPermissions);
        }

        return of(allPermissions);
      }),
      catchError(error => {
        if (error.status === 403) {
          console.warn('Access denied: User does not have permission to fetch paginated permissions.');
        } else {
          console.warn('Error fetching paginated permissions:', error);
        }
        return of([]); // Return an empty array to avoid breaking the flow
      })
    );
  }

  private fetchRemainingPages(nextUrl: string, currentPermissions: string[]): Observable<string[]> {
    if (!nextUrl) {
      return of(currentPermissions);
    }

    return this.http.get<any>(nextUrl).pipe(
      switchMap(response => {
        if (response.results && Array.isArray(response.results)) {
          currentPermissions.push(...response.results.map((p: any) => p.codename || p));
        }

        if (response.next) {
          return this.fetchRemainingPages(response.next, currentPermissions);
        }

        return of(currentPermissions);
      }),
      catchError(error => {
        return of(currentPermissions);
      })
    );
  }

  // Get current user permissions as an Observable
  getUserPermissions(): Observable<string[]> {
    return this.userPermissions.asObservable();
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
    return this.hasPermission('can_view_role_permission');
  }

  canViewAbilityList(): Observable<boolean> {
    return this.hasPermission('can_view_list_role_permission');
  }

  canCreateAbility(): Observable<boolean> {
    return this.hasPermission('can_create_role_permission');
  }

  canUpdateAbility(): Observable<boolean> {
    return this.hasPermission('can_update_role_permission');
  }

  canDeleteAbility(): Observable<boolean> {
    return this.hasPermission('can_delete_role_permission');
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
