import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map, tap, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

interface LoginResponse {
  token: string;
  permissions?: string[];
  user?: any;
}

interface TokenPayload {
  exp?: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/api/login/`;
  private readonly refreshTokenUrl = `${environment.apiUrl}/api/refresh-token/`;
  private readonly tokenStorageKey = 'auth_token';
  private readonly permissionsStorageKey = 'auth_permissions';
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private userPermissionsSubject = new BehaviorSubject<string[]>([]);
  private tokenExpirationTimer: ReturnType<typeof setTimeout> | null = null;
  
  // Public observables
  public readonly isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public readonly userPermissions$ = this.userPermissionsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuthState();
  }

  /**
   * Logs in a user with the provided credentials
   * @param username User's username
   * @param password User's password
   * @returns Observable with login response
   */
  public login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.apiUrl, { username, password }).pipe(
      tap({
        next: (response) => this.handleLoginSuccess(response),
        error: (error) => this.handleLoginError(error)
      })
    );
  }

  /**
   * Logs out the current user and clears authentication data
   */
  public logout(): void {
    this.clearAuthData();
    this.isAuthenticatedSubject.next(false);
    this.userPermissionsSubject.next([]);
    this.router.navigate(['/login']);
  }

  /**
   * Checks if the user is authenticated (synchronous)
   */
  public get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value && !!this.getToken();
  }

  /**
   * Checks if the user has a specific permission
   * @param permission Permission to check
   * @returns boolean indicating if the permission is present
   */
  public hasPermission(permission: string): boolean {
    return this.userPermissionsSubject.value.includes(permission);
  }

  /**
   * Checks if the user has all required permissions
   * @param requiredPermissions Array of permissions to check
   * @returns Observable that emits boolean indicating permission status
   */
  public checkPermissions(requiredPermissions: string[]): Observable<boolean> {
    if (requiredPermissions.length === 0) {
      return of(true);
    }

    return this.userPermissions$.pipe(
      map(userPermissions => 
        requiredPermissions.every(perm => userPermissions.includes(perm))
      )
    );
  }

  /**
   * Refreshes the authentication token
   * @returns Observable with refresh response
   */
  public refreshToken(): Observable<LoginResponse> {
    const token = this.getToken();
    if (!token) {
      this.logout();
      return throwError(() => new Error('No token available for refresh'));
    }

    return this.http.post<LoginResponse>(this.refreshTokenUrl, { token }).pipe(
      tap({
        next: (response) => this.handleRefreshSuccess(response),
        error: () => this.logout()
      })
    );
  }

  /**
   * Gets the current authentication token
   * @returns The token or null if not available
   */
  public getToken(): string | null {
    return localStorage.getItem(this.tokenStorageKey);
  }

  // Private methods

  private initializeAuthState(): void {
    const token = this.getToken();
    const permissions = this.getStoredPermissions();
    
    this.isAuthenticatedSubject.next(!!token);
    this.userPermissionsSubject.next(permissions);
    
    if (token) {
      this.scheduleTokenRefresh();
    }
  }

  private handleLoginSuccess(response: LoginResponse): void {
    this.storeAuthData(response.token, response.permissions || []);
    this.isAuthenticatedSubject.next(true);
    this.userPermissionsSubject.next(response.permissions || []);
    this.router.navigate(['/dashboard']);
  }

  private handleLoginError(error: any): void {
    // You could add specific error handling here if needed
    console.error('Login failed:', error);
  }

  private handleRefreshSuccess(response: LoginResponse): void {
    this.storeAuthData(response.token, response.permissions || []);
    this.isAuthenticatedSubject.next(true);
    this.userPermissionsSubject.next(response.permissions || []);
  }

  private scheduleTokenRefresh(): void {
    const token = this.getToken();
    if (!token) return;

    const expirationDate = this.getTokenExpirationDate(token);
    if (!expirationDate) return;

    const now = new Date().getTime();
    const refreshTime = expirationDate.getTime() - now - 60000; // Refresh 1 minute before expiration

    if (refreshTime > 0) {
      this.clearTokenRefreshTimer();
      this.tokenExpirationTimer = setTimeout(() => {
        this.refreshToken().subscribe();
      }, refreshTime);
    }
  }

  private getTokenExpirationDate(token: string): Date | null {
    try {
      const payload = this.decodeTokenPayload(token);
      if (!payload.exp) return null;
      return new Date(payload.exp * 1000);
    } catch (e) {
      console.error('Error decoding token:', e);
      return null;
    }
  }

  private decodeTokenPayload(token: string): TokenPayload {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  }

  private storeAuthData(token: string, permissions: string[]): void {
    localStorage.setItem(this.tokenStorageKey, token);
    localStorage.setItem(this.permissionsStorageKey, JSON.stringify(permissions));
    this.scheduleTokenRefresh();
  }

  private clearAuthData(): void {
    localStorage.removeItem(this.tokenStorageKey);
    localStorage.removeItem(this.permissionsStorageKey);
    this.clearTokenRefreshTimer();
  }

  private clearTokenRefreshTimer(): void {
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }
  }

  private getStoredPermissions(): string[] {
    try {
      const permissions = localStorage.getItem(this.permissionsStorageKey);
      return permissions ? JSON.parse(permissions) : [];
    } catch (e) {
      console.error('Error parsing permissions:', e);
      return [];
    }
  }
}