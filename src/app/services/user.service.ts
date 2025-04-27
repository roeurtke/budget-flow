import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { User } from '../interfaces/fetch-data.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/api/users/`;

  constructor(private http: HttpClient) { }

  // Fetches the list of users
  getUserList(): Observable<User[]> {
    const headers = { Authorization: `Bearer your-token` }; // Replace with actual token
    return this.http.get<User[]>(this.apiUrl, { headers }).pipe(
      catchError((error) => {
        console.error('Error fetching user list:', error);
        return throwError(() => new Error('Failed to fetch users. Please try again later.'));
      })
    );
  }
}
