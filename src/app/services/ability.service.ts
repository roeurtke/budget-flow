import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RolePermission } from '../interfaces/fetch-data.interface';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AbilityService {
  private apiUrl = `${environment.apiUrl}/api/role-permissions/`;

  constructor(private http: HttpClient, private authService: AuthService) { }

  getRolePermissionList(): Observable<RolePermission[]> {
    return this.http.get<RolePermission[]>(`${this.apiUrl}`);
  }
}
