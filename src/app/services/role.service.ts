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
  private apiUrl = `${environment.apiUrl}/api/roles/`;

  constructor(private http: HttpClient, private authService: AuthService) { }

  getRoleList(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}`);
  }
}
