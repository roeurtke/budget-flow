import { Component, ViewChild } from '@angular/core';
import { ExpenseService } from '../../../services/expense.service';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { Subject } from 'rxjs';
import { DataTableDirective } from 'angular-datatables';
import { dataTablesConfig } from '../../../shared/datatables/datatables-config';
import { format } from 'date-fns';
import jszip from 'jszip';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

@Component({
  selector: 'app-expenses',
  imports: [CommonModule, DataTablesModule],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.css'
})
export class ExpensesComponent {
  @ViewChild(DataTableDirective, { static: false }) dtElement!: DataTableDirective;

  loading = false;
  error: string | null = null;
  dtOptions: any = {};
  dtTrigger: Subject<any> = new Subject<any>();

  constructor(private expenseService: ExpenseService) {}

  ngOnInit(): void {
    (window as any).jsZip = jszip;
    (window as any).pdfMake = pdfMake;
    pdfMake.vfs = pdfFonts as unknown as { [file: string]: string };

    this.initializeDataTable();
  }

  initializeDataTable(): void {
    this.dtOptions = {
      ...dataTablesConfig,
      serverSide: true,
      processing: true,
      ajax: (dataTablesParameters: any, callback: any) => {
        this.loading = true;
        this.expenseService.getExpensesForDataTables(dataTablesParameters).subscribe({
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
      dom: `
        <"d-flex justify-content-between align-items-center mb-3"lBf>
        t
        <"d-flex justify-content-between align-items-center mt-3"ip>
      `,
      columns: [
        { 
          data: null,
          title: 'ID',
          render: (data: any, type: any, row: any, meta: any) => type === 'display' ? meta.row + 1 : ''
        },
        {
          data: 'date',
          title: 'Date',
          render: (data: string) => data ? format(new Date(data), 'dd-MM-yyyy') : ''
        },
        { data: 'name',
          title: 'Name',
          render: (data: string) => data || 'None'
        },
        { data: 'description',
          title: 'Description',
          render: (data: string) => data || 'None'
        },
        { data: 'spent_amount',
          title: 'Spent Amount',
          type: 'string',
          render: (data: number) => data || 'None'
        },
        { data: 'currency',
          title: 'Currency',
          render: (data: string) => data || 'None'
        },
        {
          data: 'expense_category',
          title: 'Expense category',
          render: (data: any) => typeof data === 'string' ? data || 'None' : data?.name || 'None'
        },
        {
          data: 'status',
          title: 'Status',
          render: (data: boolean) => {
            const statusText = data ? 'Active' : 'Inactive';
            const badgeClass = data ? 'badge badge-primary' : 'badge badge-danger';
            return `<span class="${badgeClass}">${statusText}</span>`;
          }
        },
        {
          data: 'user',
          title: 'User',
          render: (data: any) => typeof data === 'string' ? data || 'None' : data?.username || 'None'
        },
        {
          data: null,
          title: 'Actions',
          orderable: false,
          render: (data: any, type: any, row: any) => {
            return `
              <button class="btn btn-primary btn-sm btn-icon" data-id="${row.id}" title="Show">
                <i class="fas fa-sm fa-list-alt"></i>
              </button>
              <button class="btn btn-secondary btn-sm btn-icon" data-id="${row.id}" title="Edit">
                <i class="fas fa-sm fa-edit"></i>
              </button>
              <button class="btn btn-danger btn-sm btn-icon" data-id="${row.id}" title="Delete">
                <i class="fas fa-trash"></i>
              </button>
            `;
          }
        }
      ]
    };
  }

  onCreate(event: Event): void {
    event.preventDefault();
    console.log('Create user clicked');
  }
}
