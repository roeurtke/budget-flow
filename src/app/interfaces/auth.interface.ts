export interface TokenPayload {
    user_id: number;
    exp: number;
    iat: number;
    username: string;
}

export interface LoginResponse {
    access: string; // JWT access token
    refresh: string; // JWT refresh token
    user: UserDetails;
}

export interface RegisterResponse {
    message: string;
    user: UserDetails;
}
  
export interface RefreshResponse {
    access: string; // New JWT access token
    refresh?: string;
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

export interface UserDetails {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: {
        id: number;
        name: string;
    };
    permissions?: string[];
}

export interface AuthError {
    code: string;
    message: string;
    details?: unknown;
}

export class AuthenticationError extends Error {
    constructor(
        public code: string,
        message: string,
        public details?: unknown
    ) {
        super(message);
        this.name = 'AuthenticationError';
    }
}

export class TokenExpiredError extends AuthenticationError {
    constructor(message = 'Token has expired') {
        super('TOKEN_EXPIRED', message);
    }
}

export class InvalidTokenError extends AuthenticationError {
    constructor(message = 'Invalid token') {
        super('INVALID_TOKEN', message);
    }
}