import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ExpenseCategory } from '../interfaces/fetch-data.interface';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ExpenseCategoryService {
  private apiUrl = `${environment.apiUrl}/api/expense-categories/`;

  constructor(private http: HttpClient, private authService: AuthService) { }

  getExpenseCategoryList(): Observable<ExpenseCategory[]> {
    return this.http.get<ExpenseCategory[]>(`${this.apiUrl}`);
  }
}
