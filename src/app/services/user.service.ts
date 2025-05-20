import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../interfaces/fetch-data.interface';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) { } // Inject AuthService

  // Fetch the current user's permissions
  getUsers(): Observable<User[]> {
    return this.http.get<{ results?: User[] } | User[]>(`${this.apiUrl}/api/users/`).pipe(
      map((response: { results?: User[] } | User[]) => {
        if (Array.isArray(response)) return response;
        if (response.results) return response.results;
        return [response as User];
      })
    );
  }

  getUserList(page: number = 1, pageSize: number = 10, searchTerm: string = '', ordering: string = ''): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/users/`, {
      params: {
        page: page.toString(),
        page_size: pageSize.toString(),
        search: searchTerm,
        ordering
      }
    });
  }

  // DataTables specific version
  getUsersForDataTables(dtParams: any): Observable<any> {
    const page = (dtParams.start / dtParams.length) + 1;
    const pageSize = dtParams.length;
    const searchTerm = dtParams.search.value;
    
    let ordering = '';
    if (dtParams.order && dtParams.order.length > 0) {
      const order = dtParams.order[0];
      const columnName = dtParams.columns[order.column].data;
      ordering = order.dir === 'desc' ? `-${columnName}` : columnName;
    }

    return this.getUserList(page, pageSize, searchTerm, ordering);
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

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/users/${userId}/`);
  }
}