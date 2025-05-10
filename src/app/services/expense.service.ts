import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Expense } from '../interfaces/fetch-data.interface';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private apiUrl = `${environment.apiUrl}/api/expenses/`;

  constructor(private http: HttpClient, private authService: AuthService) { }

  getExpenseList(): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.apiUrl}`);
  }
}
