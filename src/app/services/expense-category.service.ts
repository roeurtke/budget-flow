import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ExpenseCategory } from '../interfaces/fetch-data.interface';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ExpenseCategoryService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) { }

  getExpenseCategories(): Observable<ExpenseCategory[]> {
    return this.http.get<{ results?: ExpenseCategory[] } | ExpenseCategory[]>(`${this.apiUrl}/api/expense-categories/`).pipe(
      map((response: { results?: ExpenseCategory[] } | ExpenseCategory[]) => {
        if (Array.isArray(response)) return response;
        if (response.results) return response.results;
        return [response as ExpenseCategory];
      })
    );
  }

  getExpenseCategoryList(page: number = 1, pageSize: number = 10, searchTerm: string = '', ordering: string = ''): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/expense-categories/`, {
      params: {
        page: page.toString(),
        page_size: pageSize.toString(),
        search: searchTerm,
        ordering
      }
    });
  }

  getExpenseCategoriesForDataTables(dtParams: any): Observable<any> {
    const page = (dtParams.start / dtParams.length) + 1;
    const pageSize = dtParams.length;
    const searchTerm = dtParams.search.value;

    let ordering = '';
    if (dtParams.order && dtParams.order.length > 0) {
      const order = dtParams.order[0];
      const columnName = dtParams.columns[order.column].data;
      ordering = order.dir === 'desc' ? `-${columnName}` : columnName;
    }

    return this.getExpenseCategoryList(page, pageSize, searchTerm, ordering);
  }

  getExpenseCategoryById(expenseCategoryId: string): Observable<ExpenseCategory> {
    return this.http.get<ExpenseCategory>(`${this.apiUrl}/api/expense-categories/${expenseCategoryId}/`);
  }

  createExpenseCategory(expenseCategoryData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/expense-categories/`, expenseCategoryData);
  }

  updateExpenseCategory(expenseCategoryId: string, expenseCategoryData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/expense-categories/${expenseCategoryId}/`, expenseCategoryData);
  }

  deleteExpenseCategory(expenseCategoryId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/expense-categories/${expenseCategoryId}/`);
  }
}
