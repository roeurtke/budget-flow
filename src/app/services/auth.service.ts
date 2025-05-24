import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, map, throwError, catchError } from 'rxjs';
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
  private readonly isAuthenticated = signal<boolean>(false);
  private readonly isRefreshing = signal<boolean>(false);
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);

  constructor() {
    this.initializeAuthState();
  }

  private initializeAuthState(): void {
    try {
      const accessToken = this.tokenService.getAccessToken();
      const refreshToken = this.tokenService.getRefreshToken();
      
      if (accessToken && refreshToken) {
        this.isAuthenticated.set(!this.tokenService.isTokenExpired(accessToken));
      } else {
        this.logout();
      }
    } catch (error) {
      console.error('Error initializing auth state:', error);
      this.logout();
    }
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.loginUrl, { username, password }).pipe(
      tap((response) => {
        this.tokenService.setAccessToken(response.access);
        this.tokenService.setRefreshToken(response.refresh);
        this.isAuthenticated.set(true);
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
    if (this.isRefreshing()) {
      console.debug('Token refresh already in progress');
      return throwError(() => new AuthenticationError(
        'REFRESH_IN_PROGRESS',
        'Token refresh already in progress'
      ));
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

    this.isRefreshing.set(true);
    console.debug('Attempting to refresh token');

    return this.http.post<RefreshResponse>(this.refreshApiUrl, { refresh: refreshToken }).pipe(
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
        },
        finalize: () => {
          this.isRefreshing.set(false);
          console.debug('Token refresh attempt completed');
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
        return this.handleAuthError(error);
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

    const userId = this.tokenService.extractUserIdFromToken(accessToken);
    if (!userId) {
      return throwError(() => new AuthenticationError(
        'INVALID_TOKEN',
        'User ID is missing in the token'
      ));
    }

    return this.fetchUserDetails(userId);
  }

  private fetchUserDetails(userId: number): Observable<UserDetails> {
    const userDetailsUrl = `${environment.apiUrl}/api/users/${userId}/`;
    return this.http.get<UserDetails>(userDetailsUrl).pipe(
      catchError(this.handleAuthError)
    );
  }

  private handleAuthError = (error: HttpErrorResponse): Observable<never> => {
    if (error.status === 401) {
      return throwError(() => new TokenExpiredError());
    }
    if (error.status === 400) {
      return throwError(() => new AuthenticationError(
        'INVALID_CREDENTIALS',
        'Invalid credentials provided'
      ));
    }
    return throwError(() => new AuthenticationError(
      'AUTH_ERROR',
      'Authentication error occurred',
      error
    ));
  };
}