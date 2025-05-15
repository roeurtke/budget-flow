import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../interfaces/fetch-data.interface';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // private apiUrl = `${environment.apiUrl}/api/users/`;
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) { } // Inject AuthService

  getUserList(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/api/users/`);
  }
  
  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/api/users/${userId}/`);
  }

  createUser(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/users/`, userData);
  }

  updateUser(userId: number, userData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/users/${userId}/`, userData);
  }

  updatePassword(userId: number, passwordData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/users/${userId}/`, passwordData);
  }
}