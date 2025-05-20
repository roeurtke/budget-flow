import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Income } from '../interfaces/fetch-data.interface';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class IncomeService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) { }

  getIncomes(): Observable<Income[]> {
    return this.http.get<{ results?: Income[] } | Income[]>(`${this.apiUrl}/api/incomes/`).pipe(
      map((response: { results?: Income[] } | Income[]) => {
        if (Array.isArray(response)) return response;
        if (response.results) return response.results;
        return [response as Income];
      })
    );
  }

  getIncomeList(page: number = 1, pageSize: number = 10, searchTerm: string = '', ordering: string = ''): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/incomes/`, {
      params: {
        page: page.toString(),
        page_size: pageSize.toString(),
        search: searchTerm,
        ordering
      }
    });
  }

  getIncomesForDataTables(dtParams: any): Observable<any> {
    const page = (dtParams.start / dtParams.length) + 1;
    const pageSize = dtParams.length;
    const searchTerm = dtParams.search.value;

    let ordering = '';
    if (dtParams.order && dtParams.order.length > 0) {
      const order = dtParams.order[0];
      const columnName = dtParams.columns[order.column].data;
      ordering = order.dir === 'desc' ? `-${columnName}` : columnName;
    }

    return this.getIncomeList(page, pageSize, searchTerm, ordering);
  }

  getIncomeById(incomeId: string): Observable<Income> {
    return this.http.get<Income>(`${this.apiUrl}/api/incomes/${incomeId}/`);
  }

  createIncome(incomeData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/incomes/`, incomeData);
  }

  updateIncome(incomeId: string, incomeData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/incomes/${incomeId}/`, incomeData);
  }

  deleteIncome(incomeId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/incomes/${incomeId}/`);
  }
}
