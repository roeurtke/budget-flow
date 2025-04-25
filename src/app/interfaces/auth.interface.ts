export interface LoginResponse {
    access: string; // JWT access token
    refresh: string; // JWT refresh token
}
  
export interface RefreshResponse {
    access: string; // New JWT access token
}
  
export interface User {
    id: number;
    name: string;
}

// Define the token response type
export interface TokenResponse {
    access: string;
    refresh?: string;  // Make refresh optional if your backend doesn't always return it
}