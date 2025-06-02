import { Component, ViewChild } from '@angular/core';
import { ExpenseService } from '../../../services/expense.service';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { Subject } from 'rxjs';
import { DataTableDirective } from 'angular-datatables';
import { dataTablesConfig } from '../../../shared/datatables/datatables-config';
import { Router } from '@angular/router';
import { format } from 'date-fns';
import { PermissionService } from '../../../services/permission.service';
import { PermissionCode } from '../../../shared/permissions/permissions.constants';
import { ButtonService } from '../../../services/button.service';
import jszip from 'jszip';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import Swal from 'sweetalert2';

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
  canCreateExpense = false;
  canViewExpense = false;
  canUpdateExpense = false;
  canDeleteExpense = false;

  dtOptions: any = {};
  dtTrigger: Subject<any> = new Subject<any>();

  constructor(
    private expenseService: ExpenseService,
    private permissionService: PermissionService,
    private buttonService: ButtonService,
    private router: Router
  ) {}

  ngOnInit(): void {
    (window as any).jsZip = jszip;
    (window as any).pdfMake = pdfMake;
    pdfMake.vfs = pdfFonts as unknown as { [file: string]: string };

    this.initializeDataTable();
    this.permissionService.hasPermission(PermissionCode.CAN_CREATE_EXPENSE).subscribe(has => this.canCreateExpense = has);
    this.permissionService.hasPermission(PermissionCode.CAN_VIEW_EXPENSE).subscribe(has => this.canViewExpense = has);
    this.permissionService.hasPermission(PermissionCode.CAN_UPDATE_EXPENSE).subscribe(has => this.canUpdateExpense = has);
    this.permissionService.hasPermission(PermissionCode.CAN_DELETE_EXPENSE).subscribe(has => this.canDeleteExpense = has);
  }

  initializeDataTable(): void {
    this.dtOptions = {
      ...dataTablesConfig,
      serverSide: true,
      processing: true,
      order: [[1, 'desc']],
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
          orderable: false,
          render: (data: any, type: any, row: any, meta: any) => type === 'display' ? meta.row + 1 : ''
        },
        {
          data: 'id',
          visible: false
        },
        {
          data: 'date',
          title: 'Date',
          render: (data: string) => data ? format(new Date(data), 'dd-MM-yyyy') : '-'
        },
        { data: 'name',
          title: 'Name',
          render: (data: string) => data || '-'
        },
        { data: 'description',
          title: 'Description',
          render: (data: string) => data || '-'
        },
        { data: 'spent_amount',
          title: 'Spent Amount',
          type: 'number',
          render: (data: number) => data || '-'
        },
        { data: 'currency',
          title: 'Currency',
          render: (data: string) => data || '-'
        },
        {
          data: 'expense_category',
          title: 'Expense category',
          render: (data: any) => typeof data === 'string' ? data || '-' : data?.name || '-'
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
          render: (data: any) => typeof data === 'string' ? data || '-' : data?.username || '-'
        },
        {
          data: null,
          title: 'Actions',
          orderable: false,
          render: (data: any, type: any, row: any) => {
            const isInactive = !row.status;
            let buttons = '';
            
            buttons += this.buttonService.actionButton('fas fa-sm fa-id-card', 'Detail', row.id, 'btn-primary', this.canViewExpense);
            buttons += this.buttonService.actionButton('fas fa-sm fa-edit', 'Edit', row.id, 'btn-secondary', this.canUpdateExpense);
            buttons += this.buttonService.actionButton('fas fa-trash', 'Delete', row.id, 'btn-danger', this.canDeleteExpense, isInactive);
            return buttons;
          }
        }
      ]
    };
  }

  onCreate(event: Event): void {
    event.preventDefault();
    if (!this.canCreateExpense) {
      Swal.fire({
        title: 'Access Denied',
        text: 'You do not have permission to create expenses.',
        icon: 'error',
        customClass: {
          confirmButton: 'btn btn-sm btn-primary'
        },
        buttonsStyling: false
      });
      return;
    }
    this.router.navigate(['/pages/expenses/create'])
  }

  onDetail(expenseId: Number): void {
    if (!expenseId) {
      console.error('No expense ID provided for show');
      return;
    }
    if (!this.canViewExpense) {
      Swal.fire({
        title: 'Access Denied',
        text: 'You do not have permission to view expenses.',
        icon: 'error',
        customClass: {
          confirmButton: 'btn btn-sm btn-primary'
        },
        buttonsStyling: false
      });
      return;
    }
    this.router.navigate([`/pages/expenses/detail/${expenseId}`]);
  }

  onUpdate(expenseId: Number): void {
    if (!expenseId) {
      console.error('No expense ID provided for edit');
      return;
    }
    if (!this.canUpdateExpense) {
      Swal.fire({
        title: 'Access Denied',
        text: 'You do not have permission to update expenses.',
        icon: 'error',
        customClass: {
          confirmButton: 'btn btn-sm btn-primary'
        },
        buttonsStyling: false
      });
      return;
    }
    this.router.navigate([`/pages/expenses/update/${expenseId}`]);
  }

  onDelete(incomeId: Number): void {
    if (!incomeId) return;
    if (!this.canDeleteExpense) {
      Swal.fire({
        title: 'Access Denied',
        text: 'You do not have permission to delete incomes.',
        icon: 'error',
        customClass: {
          confirmButton: 'btn btn-sm btn-primary'
        },
        buttonsStyling: false
      });
      return;
    }
  
    const id = Number(incomeId);
    if (isNaN(id)) return;
  
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'animated bounceIn',
        confirmButton: 'btn btn-sm btn-danger',
        cancelButton: 'btn btn-sm btn-secondary ml-2'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Deleting...',
          html: 'Please wait while we delete the expense',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });
  
        this.expenseService.deleteExpense(id).subscribe({
          next: () => {
            Swal.close();
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: 'Expense has been deleted.',
              showConfirmButton: false,
              timer: 2000,
              timerProgressBar: true
            });
            // Refresh the DataTable after deletion
            this.dtElement.dtInstance.then((dtInstance: any) => {
              dtInstance.ajax.reload();
            });
          },
          error: (err) => {
            Swal.close();
            console.error('Delete failed', err);
            Swal.fire('Error', 'Failed to delete expense.', 'error');
          }
        });
      }
    });
  }

  ngAfterViewInit(): void {
    document.querySelector('table')?.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const btn_detail = target.closest('.btn-primary');
      const btn_update = target.closest('.btn-secondary');
      const btn_delete = target.closest('.btn-danger');
      
      if (btn_detail) {
        const expenseId = btn_detail?.getAttribute('data-id');
        if (expenseId) {
          this.onDetail(Number(expenseId)); // Redirect to detail page
        }
      }
      else if (btn_update) {
        const expenseId = btn_update?.getAttribute('data-id');
        if (expenseId) {
          this.onUpdate(Number(expenseId));
        } 
      }
      else if (btn_delete) {
        const expenseId = btn_delete?.getAttribute('data-id');
        if (expenseId) {
          this.onDelete(Number(expenseId));
        }
      }
    });
  }
}
