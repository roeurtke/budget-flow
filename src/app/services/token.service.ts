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
      if (!token || typeof token !== 'string') {
        console.warn('Invalid token: not a string or empty');
        return true;
      }

      const payload = this.decodeToken(token);
      if (!payload) {
        console.warn('Token payload could not be decoded');
        return true;
      }

      if (!payload.exp) {
        console.warn('Token has no expiration claim');
        return true;
      }

      // Add a small buffer (30 seconds) to prevent edge cases
      const bufferTime = 30 * 1000;
      const isExpired = Date.now() + bufferTime >= payload.exp * 1000;
      
      if (isExpired) {
        console.debug('Token expired at:', new Date(payload.exp * 1000).toISOString());
      } else {
        const expiresIn = Math.floor((payload.exp * 1000 - Date.now()) / 1000);
        console.debug(`Token valid for ${expiresIn} more seconds`);
      }
      
      return isExpired;
    } catch (e) {
      console.error('Error checking token expiration:', e);
      return true;
    }
  }

  decodeToken(token: string): TokenPayload | null {
    try {
      if (!token || typeof token !== 'string') {
        console.warn('Invalid token: not a string or empty');
        return null;
      }

      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('Invalid token format: expected 3 parts');
        return null;
      }

      const [, payloadBase64] = parts;
      if (!payloadBase64) {
        console.warn('Invalid token format: no payload found');
        return null;
      }

      // Add padding if needed
      const paddedPayload = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
      const padding = '='.repeat((4 - paddedPayload.length % 4) % 4);
      const base64 = paddedPayload + padding;

      try {
        const decoded = atob(base64);
        const payload = JSON.parse(decoded);
        
        // Validate required claims
        if (!payload.exp || !payload.user_id) {
          console.warn('Token missing required claims (exp or user_id)');
          return null;
        }

        return payload;
      } catch (e) {
        console.error('Failed to decode token payload:', e);
        return null;
      }
    } catch (error) {
      console.error('Failed to process token:', error);
      return null;
    }
  }

  extractUserIdFromToken(token: string): number | null {
    const payload = this.decodeToken(token);
    return payload?.user_id || null;
  }
} 