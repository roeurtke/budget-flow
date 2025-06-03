import { Component, ViewChild } from '@angular/core';
import { ExpenseCategoryService } from '../../../services/expense-category.service';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { Subject } from 'rxjs';
import { DataTableDirective } from 'angular-datatables';
import { dataTablesConfig } from '../../../shared/datatables/datatables-config';
import { Router } from '@angular/router';
import { PermissionService } from '../../../services/permission.service';
import { PermissionCode } from '../../../shared/permissions/permissions.constants';
import { ButtonService } from '../../../services/button.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-expense-categories',
  imports: [CommonModule, DataTablesModule],
  templateUrl: './expense-categories.component.html',
  styleUrl: './expense-categories.component.css'
})
export class ExpenseCategoriesComponent {
  @ViewChild(DataTableDirective, { static: false }) dtElement!: DataTableDirective;

  loading = false;
  error: string | null = null;
  canCreateExpenseCategory = false;
  canViewExpenseCategory = false;
  canUpdateExpenseCategory = false;
  canDeleteExpenseCategory = false;

  dtOptions: any = {};
  dtTrigger: Subject<any> = new Subject<any>();

  constructor(
    private expenseCategoryService: ExpenseCategoryService,
    private permissionService: PermissionService,
    private buttonService: ButtonService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeDataTable();
    this.permissionService.hasPermission(PermissionCode.CAN_CREATE_EXPENSE_CATEGORY).subscribe(has => this.canCreateExpenseCategory = has);
    this.permissionService.hasPermission(PermissionCode.CAN_VIEW_EXPENSE_CATEGORY).subscribe(has => this.canViewExpenseCategory = has);
    this.permissionService.hasPermission(PermissionCode.CAN_UPDATE_EXPENSE_CATEGORY).subscribe(has => this.canUpdateExpenseCategory = has);
    this.permissionService.hasPermission(PermissionCode.CAN_DELETE_EXPENSE_CATEGORY).subscribe(has => this.canDeleteExpenseCategory = has);
  }

  initializeDataTable(): void {
    this.dtOptions = {
      ...dataTablesConfig,
      serverSide: true,
      processing: true,
      order: [[1, 'desc']],
      ajax: (dataTablesParameters: any, callback: any) => {
        this.loading = true;
        this.expenseCategoryService.getExpenseCategoriesForDataTables(dataTablesParameters).subscribe({
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
        { data: 'name',
          title: 'Name',
          render: (data: string) => data || '-'
        },
        { data: 'description',
          title: 'Description',
          render: (data: string) => data || '-'
        },
        { data: 'master_report',
          title: 'Master Report',
          render: (data: string) => data || '-'
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
            
            buttons += this.buttonService.actionButton('fas fa-sm fa-id-card', 'Detail', row.id, 'btn-primary', this.canViewExpenseCategory);
            buttons += this.buttonService.actionButton('fas fa-sm fa-edit', 'Edit', row.id, 'btn-secondary', this.canUpdateExpenseCategory);
            buttons += this.buttonService.actionButton('fas fa-trash', 'Delete', row.id, 'btn-danger', this.canDeleteExpenseCategory, isInactive);
            return buttons;
          }
        }
      ]
    };
  }

  onCreate(event: Event): void {
    event.preventDefault();
    if (!this.canCreateExpenseCategory) {
      Swal.fire({
        title: 'Access Denied',
        text: 'You do not have permission to create expense category.',
        icon: 'error',
        customClass: {
          confirmButton: 'btn btn-sm btn-primary'
        },
        buttonsStyling: false
      });
      return;
    }
    this.router.navigate(['/pages/expense_categories/create']);
  }

  onDetail(expenseCategoryId: Number): void {
    if (!expenseCategoryId) {
      console.error('No expense category ID provided for show');
      return;
    }
    if (!this.canViewExpenseCategory) {
      Swal.fire({
        title: 'Access Denied',
        text: 'You do not have permission to view expense category.',
        icon: 'error',
        customClass: {
          confirmButton: 'btn btn-sm btn-primary'
        },
        buttonsStyling: false
      });
      return;
    }
    this.router.navigate([`/pages/expense_categories/detail/${expenseCategoryId}`]);
  }

  onUpdate(expenseCategoryId: Number): void {
    if (!expenseCategoryId) {
      console.error('No expense category ID provided for edit');
      return;
    }
    if (!this.canUpdateExpenseCategory) {
      Swal.fire({
        title: 'Access Denied',
        text: 'You do not have permission to update expense category.',
        icon: 'error',
        customClass: {
          confirmButton: 'btn btn-sm btn-primary'
        },
        buttonsStyling: false
      });
      return;
    }
    this.router.navigate([`/pages/expense_categories/update/${expenseCategoryId}`]);
  }

  onDelete(expenseCategoryId: Number): void {
    if (!expenseCategoryId) return;
    if (!this.canDeleteExpenseCategory) {
      Swal.fire({
        title: 'Access Denied',
        text: 'You do not have permission to delete expense category.',
        icon: 'error',
        customClass: {
          confirmButton: 'btn btn-sm btn-primary'
        },
        buttonsStyling: false
      });
      return;
    }
  
    const id = Number(expenseCategoryId);
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
          html: 'Please wait while we delete the expense category',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });
  
        this.expenseCategoryService.deleteExpenseCategory(id).subscribe({
          next: () => {
            Swal.close();
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: 'Expense category has been deleted.',
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
            Swal.fire('Error', 'Failed to delete expense category.', 'error');
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
        const expenseCategoryId = btn_detail?.getAttribute('data-id');
        if (expenseCategoryId) {
          this.onDetail(Number(expenseCategoryId)); // Redirect to detail page
        }
      }
      else if (btn_update) {
        const expenseCategoryId = btn_update?.getAttribute('data-id');
        if (expenseCategoryId) {
          this.onUpdate(Number(expenseCategoryId));
        } 
      }
      else if (btn_delete) {
        const expenseCategoryId = btn_delete?.getAttribute('data-id');
        if (expenseCategoryId) {
          this.onDelete(Number(expenseCategoryId));
        }
      }
    });
  }
}
