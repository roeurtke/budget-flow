import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, throwError, catchError, BehaviorSubject, switchMap, of, Subject, map, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  LoginResponse,
  RefreshResponse,
  RegisterResponse,
  UserDetails,
  AuthenticationError,
  TokenExpiredError,
  InvalidTokenError
} from '../interfaces/auth.interface';
import { TokenService } from './token.service';
import { TokenRefreshService } from './token-refresh.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly loginUrl = `${environment.apiUrl}/api/login/`;
  private readonly registerUrl = `${environment.apiUrl}/api/register/`;
  private readonly currentUserUrl = `${environment.apiUrl}/api/users/me/`;
  private readonly isAuthenticated = signal<boolean>(false);
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly tokenRefreshService = inject(TokenRefreshService);
  private loginSubject = new Subject<LoginResponse>();

  constructor() {
    this.initializeAuthState();
  }

  // Observable for login events
  onLogin(): Observable<LoginResponse> {
    return this.loginSubject.asObservable();
  }

  // Add method to expose access token
  getAccessToken(): string | null {
    return this.tokenService.getAccessToken();
  }

  private initializeAuthState(): void {
    try {
      const accessToken = this.tokenService.getAccessToken();
      const refreshToken = this.tokenService.getRefreshToken();
      
      if (accessToken && refreshToken) {
        const isExpired = this.tokenService.isTokenExpired(accessToken);
        this.isAuthenticated.set(!isExpired);
        
        // If access token is expired but we have a refresh token, try to refresh
        if (isExpired) {
          this.tokenRefreshService.refreshToken().subscribe({
            next: () => {
              this.isAuthenticated.set(true);
            },
            error: () => {
              this.logout();
            }
          });
        }
      } else {
        this.logout();
      }
    } catch (error) {
      this.logout();
    }
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<{access: string, refresh: string, username: string, message: string}>(this.loginUrl, { username, password }).pipe(
      switchMap(response => {
        this.tokenService.setAccessToken(response.access);
        this.tokenService.setRefreshToken(response.refresh);
        this.isAuthenticated.set(true);
        
        // Fetch user details after successful login
        return this.getCurrentUser().pipe(
          map(userDetails => ({
            access: response.access,
            refresh: response.refresh,
            user: userDetails
          }))
        );
      }),
      tap(response => {
        this.loginSubject.next(response);
      }),
      catchError(this.handleAuthError)
    );
  }

  register(userData: {
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    password: string;
    password2: string;
  }): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(this.registerUrl, userData).pipe(
      tap((response) => {
        console.log('Registration successful:', response.message);
        console.log('Registered user:', response.user);
      }),
      catchError(this.handleAuthError)
    );
  }

  refreshToken(): Observable<RefreshResponse> {
    return this.tokenRefreshService.refreshToken().pipe(
      tap(() => {
        this.isAuthenticated.set(true);
      }),
      catchError((error) => {
        this.isAuthenticated.set(false);
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    this.tokenService.clearTokens();
    this.isAuthenticated.set(false);
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  getCurrentUser(): Observable<UserDetails> {
    const accessToken = this.tokenService.getAccessToken();
    if (!accessToken) {
      return throwError(() => new AuthenticationError(
        'NO_ACCESS_TOKEN',
        'Access token is missing'
      ));
    }

    return this.http.get<UserDetails>(this.currentUserUrl).pipe(
      map(userDetails => {
        const permissions = this.extractPermissionsFromUser(userDetails);
        return {
          ...userDetails,
          permissions: permissions
        };
      })
    );
  }

  private extractPermissionsFromUser(user: any): string[] {
    if (!user) {
      return [];
    }

    const permissions = new Set<string>();
    
    if (user.permissions && Array.isArray(user.permissions)) {
      user.permissions.forEach((p: any) => {
        if (typeof p === 'string') {
          permissions.add(p);
        } else if (p.codename) {
          permissions.add(p.codename);
        }
      });
    }
    
    if (user.role?.permissions && Array.isArray(user.role.permissions)) {
      user.role.permissions.forEach((p: any) => {
        if (typeof p === 'string') {
          permissions.add(p);
        } else if (p.codename) {
          permissions.add(p.codename);
        }
      });
    }
    
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

  private handleAuthError = (error: HttpErrorResponse): Observable<never> => {
    if (error.status === 401) {
      return throwError(() => new TokenExpiredError());
    }
    if (error.status === 400 || error.status === 403) {
      return throwError(() => error);
    }
    return throwError(() => new AuthenticationError(
      'AUTH_ERROR',
      'Authentication error occurred',
      error
    ));
  };
}