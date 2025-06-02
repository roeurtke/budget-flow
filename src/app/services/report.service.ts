import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReportResponse } from '../interfaces/report.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = `${environment.apiUrl}/api/financial-summary/`;

  constructor(private http: HttpClient) { }

  getFinancialSummary(): Observable<ReportResponse> {
    return this.http.get<ReportResponse>(this.apiUrl);
  }
} 