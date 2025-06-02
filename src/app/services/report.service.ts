import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReportResponse } from '../interfaces/report.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = `${environment.apiUrl}/api/reports/financial-summary/`;

  constructor(private http: HttpClient) { }

  getFinancialSummary(): Observable<ReportResponse> {
    return this.http.get<ReportResponse>(this.apiUrl);
  }

  getFinancialSummaryForDataTables(dtParams: any): Observable<any> {
    // Since the backend doesn't support pagination, we'll just get all data
    return this.http.get<any>(this.apiUrl);
  }
} 