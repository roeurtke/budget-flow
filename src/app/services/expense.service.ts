import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Expense } from '../interfaces/fetch-data.interface';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) { }

  getExpenses(): Observable<Expense[]> {
    return this.http.get<{ results?: Expense[] } | Expense[]>(`${this.apiUrl}/api/expenses/`).pipe(
      map((response: { results?: Expense[] } | Expense[]) => {
        if (Array.isArray(response)) return response;
        if (response.results) return response.results;
        return [response as Expense];
      })
    );
  }

  getExpensesList(page: number = 1, pageSize: number = 10, searchTerm: string = '', ordering: string = ''): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/expenses/`, {
      params: {
        page: page.toString(),
        page_size: pageSize.toString(),
        search: searchTerm,
        ordering
      }
    });
  }

  getExpensesForDataTables(dtParams: any): Observable<any> {
    const page = (dtParams.start / dtParams.length) + 1;
    const pageSize = dtParams.length;
    const searchTerm = dtParams.search.value;

    let ordering = '';
    if (dtParams.order && dtParams.order.length > 0) {
      const order = dtParams.order[0];
      const columnName = dtParams.columns[order.column].data;
      ordering = order.dir === 'desc' ? `-${columnName}` : columnName;
    }

    return this.getExpensesList(page, pageSize, searchTerm, ordering);
  }

  getExpenseById(expenseId: string): Observable<Expense> {
    return this.http.get<Expense>(`${this.apiUrl}/api/expenses/${expenseId}/`);
  }

  createExpense(expenseData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/expenses/`, expenseData);
  }

  updateExpense(expenseId: string, expenseData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/expenses/${expenseId}/`, expenseData);
  }

  deleteExpense(expenseId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/expenses/${expenseId}/`);
  }
}
