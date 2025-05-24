import { Injectable, signal } from '@angular/core';
import { TokenPayload } from '../interfaces/auth.interface';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private accessToken = signal<string | null>(null);
  private refreshToken = signal<string | null>(null);

  constructor() {
    this.initializeTokens();
  }

  private initializeTokens(): void {
    const storedAccessToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    
    if (storedAccessToken) {
      this.accessToken.set(storedAccessToken);
    }
    if (storedRefreshToken) {
      this.refreshToken.set(storedRefreshToken);
    }
  }

  getAccessToken(): string | null {
    return this.accessToken();
  }

  getRefreshToken(): string | null {
    return this.refreshToken();
  }

  setAccessToken(token: string): void {
    this.accessToken.set(token);
    localStorage.setItem('accessToken', token);
  }

  setRefreshToken(token: string): void {
    this.refreshToken.set(token);
    localStorage.setItem('refreshToken', token);
  }

  clearTokens(): void {
    this.accessToken.set(null);
    this.refreshToken.set(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      if (!payload?.exp) {
        console.warn('Token has no expiration claim');
        return true;
      }

      const isExpired = Date.now() >= payload.exp * 1000;
      if (isExpired) {
        console.debug('Token expired at:', new Date(payload.exp * 1000).toISOString());
      }
      return isExpired;
    } catch (e) {
      console.error('Error checking token expiration:', e);
      return true;
    }
  }

  decodeToken(token: string): TokenPayload | null {
    try {
      const [, payloadBase64] = token.split('.');
      if (!payloadBase64) {
        console.warn('Invalid token format: no payload found');
        return null;
      }
      return JSON.parse(atob(payloadBase64));
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  extractUserIdFromToken(token: string): number | null {
    const payload = this.decodeToken(token);
    return payload?.user_id || null;
  }
} 