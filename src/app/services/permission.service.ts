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
        // console.log('Fetched role permissions:', permissions);
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
    // First get the role details
    return this.http.get<any>(`${this.apiUrl}/api/roles/${roleId}/`).pipe(
      // tap(role => console.log('Role details:', role)),
      // Then fetch all role permissions and filter for this role
      switchMap(role => 
        this.http.get<any>(`${this.apiUrl}/api/role-permissions/`, { params: { role: roleId.toString(), page_size: '100' } }).pipe(
          map(response => {
            // console.log('Role permissions response:', response);
            let permissions: any[] = [];
            
            // Handle different possible response formats
            if (Array.isArray(response)) {
              permissions = response;
            } else if (response.results && Array.isArray(response.results)) {
              permissions = response.results;
            } else if (response.permission) {
              permissions = [response];
            }

            // Extract permission codenames and filter by status
            return permissions
              .filter(p => p.status !== false)
              .map(p => p.permission?.codename || p.codename)
              .filter(Boolean);
          }),
          catchError(error => {
            console.error('Error fetching role permissions:', error);
            // If permissions endpoint fails, try to get permissions from role details
            if (role.permissions && Array.isArray(role.permissions)) {
              return of(role.permissions.map((p: any) => p.codename || p));
            }
            // If still no permissions, try the alternative endpoint with pagination
            return this.fetchAllPaginatedPermissions(roleId);
          })
        )
      )
    );
  }

  private fetchAllPaginatedPermissions(roleId: number): Observable<string[]> {
    return this.http.get<any>(`${this.apiUrl}/api/permissions/?role=${roleId}&page_size=100`).pipe(
      switchMap(response => {
        // console.log('Initial permissions response:', response);
        const allPermissions: string[] = [];
        
        // Add permissions from first page
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
        console.error('Error fetching paginated permissions:', error);
        return of([]);
      })
    );
  }

  private fetchRemainingPages(nextUrl: string, currentPermissions: string[]): Observable<string[]> {
    if (!nextUrl) {
      return of(currentPermissions);
    }

    return this.http.get<any>(nextUrl).pipe(
      switchMap(response => {
        console.log('Fetching next page of permissions:', response);
        if (response.results && Array.isArray(response.results)) {
          currentPermissions.push(...response.results.map((p: any) => p.codename || p));
        }

        if (response.next) {
          return this.fetchRemainingPages(response.next, currentPermissions);
        }

        return of(currentPermissions);
      }),
      catchError(error => {
        console.error('Error fetching next page of permissions:', error);
        return of(currentPermissions);
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
