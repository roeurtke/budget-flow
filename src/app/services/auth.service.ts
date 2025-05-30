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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly loginUrl = `${environment.apiUrl}/api/login/`;
  private readonly registerUrl = `${environment.apiUrl}/api/register/`;
  private readonly refreshApiUrl = `${environment.apiUrl}/api/token/refresh/`;
  private readonly currentUserUrl = `${environment.apiUrl}/api/users/me/`;
  private readonly isAuthenticated = signal<boolean>(false);
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private refreshTokenSubject = new BehaviorSubject<RefreshResponse | null>(null);
  private refreshInProgress = false;
  private loginSubject = new Subject<LoginResponse>();
  private refreshObservable: Observable<RefreshResponse> | null = null;

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
          // console.log('Access token expired during initialization, attempting refresh...');
          this.refreshToken().subscribe({
            next: (response) => {
              // console.log('Initial token refresh successful');
              this.isAuthenticated.set(true);
            },
            error: (error) => {
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
    if (this.refreshInProgress && this.refreshObservable) {
      console.debug('Reusing existing refresh attempt');
      return this.refreshObservable;
    }

    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) {
      console.warn('No refresh token available');
      this.logout();
      return throwError(() => new AuthenticationError(
        'NO_REFRESH_TOKEN',
        'No refresh token available'
      ));
    }

    const isExpired = this.tokenService.isTokenExpired(refreshToken);
    if (isExpired) {
      console.warn('Refresh token is expired');
      this.logout();
      return throwError(() => new TokenExpiredError('Refresh token is expired'));
    }

    this.refreshInProgress = true;
    this.refreshTokenSubject.next(null);
    console.debug('Starting new token refresh process');

    this.refreshObservable = this.http.post<RefreshResponse>(this.refreshApiUrl, { refresh: refreshToken }).pipe(
      tap({
        next: (response) => {
          console.debug('Token refresh successful');
          if (!response.access) {
            console.error('Invalid refresh response: no access token received');
            throw new InvalidTokenError('Invalid refresh response: no access token received');
          }
          this.tokenService.setAccessToken(response.access);
          if (response.refresh) {
            this.tokenService.setRefreshToken(response.refresh);
          }
          this.isAuthenticated.set(true);
          this.refreshTokenSubject.next(response);
        },
        error: (error) => {
          console.error('Refresh token error:', error);
          if (error instanceof HttpErrorResponse) {
            if (error.status === 401) {
              console.warn('Refresh token rejected by server - logging out');
              this.logout();
            } else {
              console.error(`Refresh token request failed with status ${error.status}:`, error.error);
            }
          }
          this.refreshTokenSubject.next(null);
        },
        finalize: () => {
          this.refreshInProgress = false;
          this.refreshObservable = null;
          console.debug('Token refresh process completed');
        }
      }),
      catchError((error) => {
        if (error instanceof HttpErrorResponse) {
          if (error.status === 401) {
            return throwError(() => new TokenExpiredError('Refresh token was rejected by the server'));
          }
          if (error.status === 400) {
            return throwError(() => new AuthenticationError(
              'INVALID_REFRESH_TOKEN',
              'Invalid refresh token format or content'
            ));
          }
        }
        return throwError(() => new AuthenticationError(
          'REFRESH_FAILED',
          'Token refresh failed',
          error
        ));
      }),
      shareReplay(1)
    );

    return this.refreshObservable;
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
        console.log('User Details:', userDetails); // Debug user info
        console.log('User Permissions:', permissions); // Debug permissions
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