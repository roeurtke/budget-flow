import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { DataTableDirective } from 'angular-datatables';
import { dataTablesConfig } from '../../../shared/datatables/datatables-config';
import { Subject } from 'rxjs';
import { format } from 'date-fns';
import { ReportService } from '../../../services/report.service';
import { PermissionService } from '../../../services/permission.service';
import { PermissionCode } from '../../../shared/permissions/permissions.constants';
import { MonthlySummary } from '../../../interfaces/report.interface';

@Component({
  selector: 'app-reports',
  imports: [CommonModule, DataTablesModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent {
  @ViewChild(DataTableDirective, { static: false }) dtElement!: DataTableDirective;

  financialSummary: MonthlySummary[] = [];
  year: number = new Date().getFullYear();
  loading = false;
  error: string | null = null;
  totalIncome: number = 0;
  totalExpense: number = 0;

  canviewReport = false;

  dtOptions: any = {};
  dtTrigger: Subject<any> = new Subject<any>();

  constructor(
    private reportService: ReportService,
    private permissionService: PermissionService,
  ) {}

  // Calculate total income for all months
  calculateTotalIncome(data: any[]): number {
    return data.reduce((sum, item) => sum + (item.total_income || 0), 0);
  }

  // Calculate total expense for all months
  calculateTotalExpense(data: any[]): number {
    return data.reduce((sum, item) => sum + (item.total_expense || 0), 0);
  }

  ngOnInit(): void {
    this.initializeDataTable();
    this.permissionService.hasPermission(PermissionCode.CAN_VIEW_REPORT).subscribe(has => this.canviewReport = has);
  }

  initializeDataTable(): void {
    this.dtOptions = {
      ...dataTablesConfig,
      serverSide: false,
      processing: true,
      order: [[1, 'asc']],
      ajax: (dataTablesParameters: any, callback: any) => {
        this.loading = true;
        this.reportService.getFinancialSummaryForDataTables(dataTablesParameters).subscribe({
          next: (response) => {
            // Add the year from the response to each monthly summary item and filter out records with no income or expense
            const dataWithYearAndFiltered = response.monthly_summary
              .filter((item: any) => item.total_income !== 0 || item.total_expense !== 0)
              .map((item: any) => ({
                ...item,
                year: response.year
              }));

            // Calculate totals
            this.totalIncome = this.calculateTotalIncome(dataWithYearAndFiltered);
            this.totalExpense = this.calculateTotalExpense(dataWithYearAndFiltered);

            callback({
              recordsTotal: dataWithYearAndFiltered.length,
              recordsFiltered: dataWithYearAndFiltered.length,
              data: dataWithYearAndFiltered
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
}