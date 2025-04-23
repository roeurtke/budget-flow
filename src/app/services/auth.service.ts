import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

interface LoginResponse {
  access: string;
  refresh: string;
}

interface RefreshResponse {
  access: string; // New access token
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/login/`;
  private refreshApiUrl = `${environment.apiUrl}/api/refresh-token/`;
  private isAuthenticated = signal<boolean>(false);
  private accessToken = signal<string | null>(null);
  private refreshTokenSignal = signal<string | null>(null);

  constructor(private http: HttpClient) {
    // Check if tokens exist on initialization
    const storedAccessToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (storedAccessToken && storedRefreshToken) {
      this.accessToken.set(storedAccessToken);
      this.refreshTokenSignal.set(storedRefreshToken);
      this.isAuthenticated.set(true);
    }
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.apiUrl, { username, password }).pipe(
      tap((response) => {
        localStorage.setItem('accessToken', response.access);
        localStorage.setItem('refreshToken', response.refresh);
        this.accessToken.set(response.access);
        this.refreshTokenSignal.set(response.refresh);
        this.isAuthenticated.set(true);
      })
    );
  }

  refreshToken(): Observable<RefreshResponse> {
    const refresh = this.refreshTokenSignal();
    if (!refresh) {
      return new Observable((observer) => {
        observer.error(new Error('No refresh token available'));
      });
    }
    return this.http.post<RefreshResponse>(this.refreshApiUrl, { refresh }).pipe(
      tap((response) => {
        localStorage.setItem('accessToken', response.access);
        this.accessToken.set(response.access);
        this.isAuthenticated.set(true);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.accessToken.set(null);
    this.refreshTokenSignal.set(null);
    this.isAuthenticated.set(false);
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  getAccessToken(): string | null {
    return this.accessToken();
  }
}