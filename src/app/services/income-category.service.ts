import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IncomeCategory } from '../interfaces/fetch-data.interface';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class IncomeCategoryService {
  private apiUrl = `${environment.apiUrl}/api/income-categories/`;

  constructor(private http: HttpClient, private authService: AuthService) { }

  getIncomeCategoryList(): Observable<IncomeCategory[]> {
    return this.http.get<IncomeCategory[]>(`${this.apiUrl}`);
  }
}
