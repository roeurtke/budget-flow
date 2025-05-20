import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  // getRoleList(): Observable<Role[]> {
  //   return this.http.get<Role[]>(`${this.apiUrl}/api/roles/`);
  // }
  getRoleList(page: number = 1, pageSize: number = 10, searchTerm: string = '', ordering: string = ''): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (searchTerm) params = params.set('search', searchTerm);
    if (ordering) params = params.set('ordering', ordering);

    return this.http.get<any>(`${this.apiUrl}/api/roles/`, { params });
  }

  getRolesForDataTables(dtParams: any): Observable<any> {
    const page = (dtParams.start / dtParams.length) + 1;
    const pageSize = dtParams.length;
    const searchTerm = dtParams.search.value;

    let ordering = '';
    if (dtParams.order && dtParams.order.length > 0) {
      const order = dtParams.order[0];
      const columnName = dtParams.columns[order.column].data;
      ordering = order.dir === 'desc' ? `-${columnName}` : columnName;
    }

    return this.getRoleList(page, pageSize, searchTerm, ordering);
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
