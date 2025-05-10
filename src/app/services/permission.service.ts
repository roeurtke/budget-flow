import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Permission } from '../interfaces/fetch-data.interface';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private apiUrl = `${environment.apiUrl}/api/permissions/`;

  constructor(private http: HttpClient, private authService: AuthService) { }

  getPermissionList(): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.apiUrl}`);
  }
}
