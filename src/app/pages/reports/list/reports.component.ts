import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { DataTableDirective } from 'angular-datatables';
import { dataTablesConfig } from '../../../shared/datatables/datatables-config';
import { Subject } from 'rxjs';
import { format, getMonth, getYear } from 'date-fns';
import { ReportService } from '../../../services/report.service';
import { PermissionService } from '../../../services/permission.service';
import { PermissionCode } from '../../../shared/permissions/permissions.constants';
import { MonthlySummary } from '../../../interfaces/report.interface';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IncomeService } from '../../../services/income.service';
import { ExpenseService } from '../../../services/expense.service';
import { Income, Expense } from '../../../interfaces/fetch-data.interface';

// Define a type for the daily data structure
type DailyFinancialEntry = {
  date: Date;
  incomes: (Income & { amount: number })[];
  expenses: (Expense & { amount: number })[];
};

@Component({
  selector: 'app-reports',
  imports: [CommonModule, DataTablesModule, ReactiveFormsModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  @ViewChild(DataTableDirective, { static: false }) dtElement!: DataTableDirective;

  filterForm: FormGroup;
  financialSummary: MonthlySummary[] = [];
  filteredData: MonthlySummary[] = [];
  year: number = new Date().getFullYear();
  loading = false;
  error: string | null = null;
  totalIncome: number = 0;
  totalExpense: number = 0;

  canviewReport = false;

  dtOptions: any = {};
  dtTrigger: Subject<any> = new Subject<any>();

  availableMonths: { month: number, year: number }[] = [];

  dailyData: DailyFinancialEntry[] = [];

  constructor(
    private reportService: ReportService,
    private permissionService: PermissionService,
    private incomeService: IncomeService,
    private expenseService: ExpenseService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      start_month: [''],
      end_month: ['']
    });
  }

  ngOnInit(): void {
    this.loadAvailableMonths();
    this.initializeDataTable();
    this.permissionService.hasPermission(PermissionCode.CAN_VIEW_REPORT).subscribe(has => this.canviewReport = has);
  }

  loadAvailableMonths(): void {
    // Load income dates
    this.incomeService.getIncomes().subscribe({
      next: (incomes) => {
        const incomeMonths = incomes.map(income => {
          const date = new Date(income.date);
          return {
            month: getMonth(date),
            year: getYear(date)
          };
        });
        this.updateAvailableMonths(incomeMonths);
      },
      error: (err) => console.error('Error loading income dates:', err)
    });

    // Load expense dates
    this.expenseService.getExpenses().subscribe({
      next: (expenses) => {
        const expenseMonths = expenses.map(expense => {
          const date = new Date(expense.date);
          return {
            month: getMonth(date),
            year: getYear(date)
          };
        });
        this.updateAvailableMonths(expenseMonths);
      },
      error: (err) => console.error('Error loading expense dates:', err)
    });
  }

  private updateAvailableMonths(newMonths: { month: number, year: number }[]): void {
    // Combine existing months with new months and remove duplicates
    const allMonths = [...new Set([...this.availableMonths, ...newMonths].map(m => `${m.year}-${m.month}`))]
      .map(str => {
        const [year, month] = str.split('-').map(Number);
        return { month, year };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
    
    this.availableMonths = allMonths;
  }

  applyFilter(): void {
    const startMonth = this.filterForm.get('start_month')?.value;
    const endMonth = this.filterForm.get('end_month')?.value;

    if (startMonth && endMonth) {
      const [startYear, startMonthNum] = startMonth.split('-').map(Number);
      const [endYear, endMonthNum] = endMonth.split('-').map(Number);
      
      this.filteredData = this.financialSummary.filter(item => {
        const itemDate = new Date(this.year, item.month - 1, 1);
        const startDate = new Date(startYear, startMonthNum, 1);
        const endDate = new Date(endYear, endMonthNum + 1, 0); // Last day of the end month
        
        return itemDate >= startDate && itemDate <= endDate;
      });
    } else {
      // If no months selected, show no data
      this.filteredData = [];
    }

    // Update totals
    this.totalIncome = this.calculateTotalIncome(this.filteredData);
    this.totalExpense = this.calculateTotalExpense(this.filteredData);

    // Refresh the DataTable
    if (this.dtElement) {
      this.dtElement.dtInstance.then((dtInstance: any) => {
        dtInstance.clear();
        dtInstance.rows.add(this.filteredData);
        dtInstance.draw();
      });
    }
  }

  async exportToExcel(): Promise<void> {
    const startMonth = this.filterForm.get('start_month')?.value;
    const endMonth = this.filterForm.get('end_month')?.value;
  
    try {
      await this.reportService.exportToExcel(startMonth, endMonth);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  }

  async printReport(): Promise<void> {
    const startMonth = this.filterForm.get('start_month')?.value;
    const endMonth = this.filterForm.get('end_month')?.value;
  
    try {
      await this.reportService.printReport(startMonth, endMonth);
    } catch (error) {
      console.error('Error generating report:', error);
    }
  }

  // Calculate total income for all months
  calculateTotalIncome(data: any[]): number {
    return data.reduce((sum, item) => sum + (item.total_income || 0), 0);
  }

  // Calculate total expense for all months
  calculateTotalExpense(data: any[]): number {
    return data.reduce((sum, item) => sum + (item.total_expense || 0), 0);
  }

  initializeDataTable(): void {
    this.dtOptions = {
      ...dataTablesConfig,
      serverSide: false,
      processing: true,
      order: [[1, 'asc']],
      ajax: (dataTablesParameters: any, callback: any) => {
        // Initially load all data into financialSummary
        this.reportService.getFinancialSummaryForDataTables(dataTablesParameters).subscribe({
          next: (response) => {
            this.financialSummary = response.monthly_summary
              .filter((item: any) => item.total_income !== 0 || item.total_expense !== 0)
              .map((item: any) => ({
                ...item,
                year: response.year
              }));

            // Initially show no data in the table
            this.filteredData = [];

            // Do not call callback with initial data
            callback({
              recordsTotal: 0,
              recordsFiltered: 0,
              data: []
            });
            this.loading = false;
          },
          error: (err) => {
            this.error = err.message;
            callback({
              recordsTotal: 0,
              recordsFiltered: 0,
              data: []
            });
            this.loading = false;
          }
        });
      },
      columns: [
        {
          data: null,
          title: 'ID',
          orderable: false,
          render: (data: any, type: any, row: any, meta: any) => type === 'display' ? meta.row + 1 : ''
        },
        {
          data: 'month',
          title: 'Month',
          render: (data: number, type: any, row: any) => {
            if (type === 'display' && data) {
              // Construct a date using the year from the response and the month data (subtract 1 as months are 0-indexed)
              const date = new Date(row.year, data - 1, 1);
              return format(date, 'MMMM yyyy');
            } else if (data) {
               // For sorting or filtering, return a sortable string like 'YYYY-MM'
              return `${row.year}-${data.toString().padStart(2, '0')}`;
            }
            return '';
          }
        },
        { data: 'total_income',
          title: 'Total Income (USD)',
          type: 'number',
          render: (data: number) => data || '-'
        },
        { data: 'total_expense',
          title: 'Total Expense (USD)',
          type: 'number',
          render: (data: number) => data || '-'
        },
        { data: 'net_income',
          title: 'Remaining Income',
          type: 'number',
          render: (data: number) => data || '-'
        }
      ]
    };
  }

  formatMonthDisplay(month: number, year: number): string {
    return format(new Date(year, month, 1), 'MMMM yyyy');
  }
}