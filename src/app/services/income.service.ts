import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Income } from '../interfaces/fetch-data.interface';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class IncomeService {
  private apiUrl = `${environment.apiUrl}/api/incomes/`;

  constructor(private http: HttpClient, private authService: AuthService) { }

  getIncomeList(): Observable<Income[]> {
    return this.http.get<Income[]>(`${this.apiUrl}`);
  }
}
