export interface MonthlySummary {
  month: number;
  total_income: number;
  total_expense: number;
  net_income: number;
}

export interface ReportResponse {
  year: number;
  monthly_summary: MonthlySummary[];
} 