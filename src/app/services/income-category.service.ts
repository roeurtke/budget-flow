import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IncomeCategory } from '../interfaces/fetch-data.interface';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class IncomeCategoryService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) { }

  getIcomeCategories(): Observable<IncomeCategory[]> {
    return this.http.get<{ results?: IncomeCategory[] } | IncomeCategory[]>(`${this.apiUrl}/api/income-categories/`).pipe(
      map((response: { results?: IncomeCategory[] } | IncomeCategory[]) => {
        if (Array.isArray(response)) return response;
        if (response.results) return response.results;
        return [response as IncomeCategory];
      })
    );
  }

  getIncomeCategoryList(page: number = 1, pageSize: number = 10, searchTerm: string = '', ordering: string = ''): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/income-categories/`, {
      params: {
        page: page.toString(),
        page_size: pageSize.toString(),
        search: searchTerm,
        ordering
      }
    });
  }

  getIncomeCategoriesForDataTables(dtParams: any): Observable<any> {
    const page = (dtParams.start / dtParams.length) + 1;
    const pageSize = dtParams.length;
    const searchTerm = dtParams.search.value;

    let ordering = '';
    if (dtParams.order && dtParams.order.length > 0) {
      const order = dtParams.order[0];
      const columnName = dtParams.columns[order.column].data;
      ordering = order.dir === 'desc' ? `-${columnName}` : columnName;
    }

    return this.getIncomeCategoryList(page, pageSize, searchTerm, ordering);
  }

  getIncomeCategoryById(incomeCategoryId: string): Observable<IncomeCategory> {
    return this.http.get<IncomeCategory>(`${this.apiUrl}/api/income-categories/${incomeCategoryId}/`);
  }

  createIncomeCategory(incomeCategoryData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/income-categories/`, incomeCategoryData);
  }

  updateIncomeCategory(incomeCategoryId: number, incomeCategoryData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/income-categories/${incomeCategoryId}/`, incomeCategoryData);
  }

  deleteIncomeCategory(incomeCategoryId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/income-categories/${incomeCategoryId}/`);
  }
}
