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
  private apiUrl = `${environment.apiUrl}/api/users/`;

  constructor(private http: HttpClient, private authService: AuthService) { } // Inject AuthService

  // Fetches the list of users
  getUserList(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}`);
  }
}