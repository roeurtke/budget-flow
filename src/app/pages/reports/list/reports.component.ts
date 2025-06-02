import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { DataTableDirective } from 'angular-datatables';
import { dataTablesConfig } from '../../../shared/datatables/datatables-config';
import { Subject } from 'rxjs';
import { format } from 'date-fns';
import { ReportService } from '../../../services/report.service';
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

  dtOptions: any = {};
  dtTrigger: Subject<any> = new Subject<any>();

  constructor(private reportService: ReportService) {}

  ngOnInit(): void {
    this.initializeDataTable();
  }

  initializeDataTable(): void {
    this.dtOptions = {
      ...dataTablesConfig,
      serverSide: true,
      processing: true,
      order: [[1, 'desc']],
      ajax: (dataTablesParameters: any, callback: any) => {
        this.loading = true;
        this.reportService.getFinancialSummaryForDataTables(dataTablesParameters).subscribe({
          next: (response) => {
            callback({
              recordsTotal: response.count,
              recordsFiltered: response.count,
              data: response.results
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
          data: 'id',
          visible: false // hidden real ID for sorting
        },
        {
          data: 'month',
          title: 'Month',
          render: (data: string) => data ? format(new Date(data), 'dd-MM-yyyy') : ''
        },
        { data: 'total_income',
          title: 'Total Income',
          type: 'number',
          render: (data: number) => data || 'None'
        },
        { data: 'total_expense',
          title: 'Total Expense',
          type: 'number',
          render: (data: number) => data || 'None'
        },
        { data: 'net_income',
          title: 'Next Income',
          type: 'number',
          render: (data: number) => data || 'None'
        }
      ]
    };
  }
}
