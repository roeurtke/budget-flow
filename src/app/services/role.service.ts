import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Role } from '../interfaces/fetch-data.interface';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) { }

  getRoleList(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/api/roles/`);
  }

  getRoleById(roleId: string): Observable<Role> {
    return this.http.get<Role>(`${this.apiUrl}/api/roles/${roleId}/`);
  }

  createRole(roleData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/roles/`, roleData);
  }

  updateRole(roleId: number, roleData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/roles/${roleId}/`, roleData);
  }

  deleteRole(roleId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/roles/${roleId}/`);
  }
}
