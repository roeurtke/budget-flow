import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, tap, catchError, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';
import { RefreshResponse, TokenExpiredError, AuthenticationError } from '../interfaces/auth.interface';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class TokenRefreshService {
  private readonly refreshApiUrl = `${environment.apiUrl}/api/token/refresh/`;
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private refreshInProgress = false;
  private refreshObservable: Observable<RefreshResponse> | null = null;

  refreshToken(): Observable<RefreshResponse> {
    if (this.refreshInProgress && this.refreshObservable) {
      return this.refreshObservable;
    }

    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new AuthenticationError(
        'NO_REFRESH_TOKEN',
        'No refresh token available'
      ));
    }

    const isExpired = this.tokenService.isTokenExpired(refreshToken);
    if (isExpired) {
      return throwError(() => new TokenExpiredError('Refresh token is expired'));
    }

    this.refreshInProgress = true;

    this.refreshObservable = this.http.post<RefreshResponse>(this.refreshApiUrl, { refresh: refreshToken }).pipe(
      tap({
        next: (response) => {
          if (!response.access) {
            throw new Error('Invalid refresh response: no access token received');
          }
          this.tokenService.setAccessToken(response.access);
          if (response.refresh) {
            this.tokenService.setRefreshToken(response.refresh);
          }
        },
        error: (error) => {
          if (error.status === 401) {
            this.tokenService.clearTokens();
          }
        },
        finalize: () => {
          this.refreshInProgress = false;
          this.refreshObservable = null;
        }
      }),
      catchError((error) => {
        if (error.status === 401) {
          return throwError(() => new TokenExpiredError('Refresh token was rejected by the server'));
        }
        if (error.status === 400) {
          return throwError(() => new AuthenticationError(
            'INVALID_REFRESH_TOKEN',
            'Invalid refresh token format or content'
          ));
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
} 