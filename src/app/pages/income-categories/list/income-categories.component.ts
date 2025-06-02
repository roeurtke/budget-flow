import { Component, ViewChild } from '@angular/core';
import { IncomeCategoryService } from '../../../services/income-category.service';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { Subject } from 'rxjs';
import { DataTableDirective } from 'angular-datatables';
import { dataTablesConfig } from '../../../shared/datatables/datatables-config';
import { Router } from '@angular/router';
import { PermissionService } from '../../../services/permission.service';
import { PermissionCode } from '../../../shared/permissions/permissions.constants';
import { ButtonService } from '../../../services/button.service';
import jszip from 'jszip';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-income-categories',
  imports: [CommonModule, DataTablesModule],
  templateUrl: './income-categories.component.html',
  styleUrl: './income-categories.component.css'
})
export class IncomeCategoriesComponent {
  @ViewChild(DataTableDirective, { static: false }) dtElement!: DataTableDirective;

  loading = false;
  error: string | null = null;
  canCreateIncomeCategory = false;
  canViewIncomeCategory = false;
  canUpdateIncomeCategory = false;
  canDeleteIncomeCategory = false;

  dtOptions: any = {};
  dtTrigger: Subject<any> = new Subject<any>();

  constructor(
    private incomeCategoryService: IncomeCategoryService,
    private permissionService: PermissionService,
    private buttonService: ButtonService,
    private router: Router
  ) {}

  ngOnInit(): void {
    (window as any).jsZip = jszip;
    (window as any).pdfMake = pdfMake;
    pdfMake.vfs = pdfFonts as unknown as { [file: string]: string };

    this.initializeDataTable();
    this.permissionService.hasPermission(PermissionCode.CAN_CREATE_INCOME_CATEGORY).subscribe(has => this.canCreateIncomeCategory = has);
    this.permissionService.hasPermission(PermissionCode.CAN_VIEW_INCOME_CATEGORY).subscribe(has => this.canViewIncomeCategory = has);
    this.permissionService.hasPermission(PermissionCode.CAN_UPDATE_INCOME_CATEGORY).subscribe(has => this.canUpdateIncomeCategory = has);
    this.permissionService.hasPermission(PermissionCode.CAN_DELETE_INCOME_CATEGORY).subscribe(has => this.canDeleteIncomeCategory = has);
  }

  initializeDataTable(): void {
    this.dtOptions = {
      ...dataTablesConfig,
      serverSide: true,
      processing: true,
      order: [[1, 'desc']],
      ajax: (dataTablesParameters: any, callback: any) => {
        this.loading = true;
        this.incomeCategoryService.getIncomeCategoriesForDataTables(dataTablesParameters).subscribe({
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
        { data: 'name',
          title: 'Name',
          render: (data: string) => data || '-'
        },
        { data: 'description',
          title: 'Description',
          render: (data: string) => data || '-'
        },
        { data: 'master_report',
          title: 'Report',
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
            
            buttons += this.buttonService.actionButton('fas fa-sm fa-id-card', 'Detail', row.id, 'btn-primary', this.canViewIncomeCategory);
            buttons += this.buttonService.actionButton('fas fa-sm fa-edit', 'Edit', row.id, 'btn-secondary', this.canUpdateIncomeCategory);
            buttons += this.buttonService.actionButton('fas fa-trash', 'Delete', row.id, 'btn-danger', this.canDeleteIncomeCategory, isInactive);
            return buttons;
          }
        }
      ]
    };
  }

  onCreate(event: Event): void {
    event.preventDefault();
    if (!this.canCreateIncomeCategory) {
      Swal.fire({
        title: 'Access Denied',
        text: 'You do not have permission to create income category.',
        icon: 'error',
        customClass: {
          confirmButton: 'btn btn-sm btn-primary'
        },
        buttonsStyling: false
      });
      return;
    }
    this.router.navigate(['/pages/income_categories/create']);
  }

  onDetail(incomeCategoryId: Number): void {
    if (!incomeCategoryId) {
      console.error('No income category ID provided for show');
      return;
    }
    if (!this.canViewIncomeCategory) {
      Swal.fire({
        title: 'Access Denied',
        text: 'You do not have permission to view income category.',
        icon: 'error',
        customClass: {
          confirmButton: 'btn btn-sm btn-primary'
        },
        buttonsStyling: false
      });
      return;
    }
    this.router.navigate([`/pages/income_categories/detail/${incomeCategoryId}`]);
  }

  onUpdate(incomeCategoryId: Number): void {
    if (!incomeCategoryId) {
      console.error('No income category ID provided for edit');
      return;
    }
    if (!this.canUpdateIncomeCategory) {
      Swal.fire({
        title: 'Access Denied',
        text: 'You do not have permission to update income category.',
        icon: 'error',
        customClass: {
          confirmButton: 'btn btn-sm btn-primary'
        },
        buttonsStyling: false
      });
      return;
    }
    this.router.navigate([`/pages/income_categories/update/${incomeCategoryId}`]);
  }

  onDelete(incomeCategoryId: Number): void {
    if (!incomeCategoryId) return;
    if (!this.canDeleteIncomeCategory) {
      Swal.fire({
        title: 'Access Denied',
        text: 'You do not have permission to delete income category.',
        icon: 'error',
        customClass: {
          confirmButton: 'btn btn-sm btn-primary'
        },
        buttonsStyling: false
      });
      return;
    }
  
    const id = Number(incomeCategoryId);
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
          html: 'Please wait while we delete the income category',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });
  
        this.incomeCategoryService.deleteIncomeCategory(id).subscribe({
          next: () => {
            Swal.close();
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: 'Income category has been deleted.',
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
            Swal.fire('Error', 'Failed to delete income category.', 'error');
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
        const incomeCategoryId = btn_detail?.getAttribute('data-id');
        if (incomeCategoryId) {
          this.onDetail(Number(incomeCategoryId)); // Redirect to detail page
        }
      }
      else if (btn_update) {
        const incomeCategoryId = btn_update?.getAttribute('data-id');
        if (incomeCategoryId) {
          this.onUpdate(Number(incomeCategoryId));
        } 
      }
      else if (btn_delete) {
        const incomeCategoryId = btn_delete?.getAttribute('data-id');
        if (incomeCategoryId) {
          this.onDelete(Number(incomeCategoryId));
        }
      }
    });
  }
}
