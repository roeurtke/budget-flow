import { Component, ViewChild } from '@angular/core';
import { PermissionService } from '../../../services/permission.service';
import { PermissionCode } from '../../../shared/permissions/permissions.constants';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { Subject } from 'rxjs';
import { DataTableDirective } from 'angular-datatables';
import { dataTablesConfig } from '../../../shared/datatables/datatables-config';
import { format } from 'date-fns';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-permissions',
  imports: [CommonModule, DataTablesModule],
  templateUrl: './permissions.component.html',
  styleUrl: './permissions.component.css'
})
export class PermissionsComponent {
  @ViewChild(DataTableDirective, { static: false }) dtElement!: DataTableDirective;

  loading = false;
  error: string | null = null;
  canCreatePermission = false;
  canViewPermission = false;
  canUpdatePermission = false;
  canDeletePermission = false;

  dtOptions: any = {};
  dtTrigger: Subject<any> = new Subject<any>();

  constructor(
    private permissionService: PermissionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeDataTable();
    this.permissionService.hasPermission(PermissionCode.CAN_CREATE_PERMISSION).subscribe(has => this.canCreatePermission = has);
    this.permissionService.hasPermission(PermissionCode.CAN_VIEW_PERMISSION).subscribe(has => this.canViewPermission = has);
    this.permissionService.hasPermission(PermissionCode.CAN_UPDATE_PERMISSION).subscribe(has => this.canUpdatePermission = has);
    this.permissionService.hasPermission(PermissionCode.CAN_DELETE_PERMISSION).subscribe(has => this.canDeletePermission = has);
  }

  initializeDataTable(): void {
    this.dtOptions = {
      ...dataTablesConfig,
      serverSide: true,
      processing: true,
      order: [[1, 'desc']],
      ajax: (dataTablesParameters: any, callback: any) => {
        this.loading = true;
        this.permissionService.getPermissionForDataTables(dataTablesParameters).subscribe({
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
          visible: false
        },
        { data: 'name',
          title: 'Name',
          render: (data: string) => data || 'None'
        },
        { data: 'codename',
          title: 'Codename',
          render: (data: string) => data || 'None'
        },
        { data: 'description',
          title: 'Description',
          render: (data: string) => data || 'None'
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
          data: 'created_at',
          title: 'Created',
          render: (data: string) => data ? format(new Date(data), 'dd/MM/yyyy') : ''
        },
        {
          data: 'updated_at',
          title: 'Updated',
          render: (data: string) => data ? format(new Date(data), 'dd/MM/yyyy') : ''
        },
        {
          data: null,
          title: 'Actions',
          orderable: false,
          render: (data: any, type: any, row: any) => {
            const isInactive = !row.status;
            let buttons = '';
            
            buttons += `
              <button class="btn btn-primary btn-sm btn-icon" data-id="${row.id}" title="${this.canViewPermission ? 'Show' : 'No permission'}" ${!this.canViewPermission ? 'disabled' : ''}>
                <i class="fas fa-sm fa-list-alt"></i>
              </button>`;
            buttons += `
              <button class="btn btn-secondary btn-sm btn-icon" data-id="${row.id}" title="${this.canUpdatePermission ? 'Edit' : 'No permission'}" ${!this.canUpdatePermission ? 'disabled' : ''}">
                <i class="fas fa-sm fa-edit"></i>
              </button>`;
            
            const deleteDisabled = !this.canDeletePermission || isInactive;
            buttons += `
              <button class="btn btn-danger btn-sm btn-icon" data-id="${row.id}" title="${this.canDeletePermission ? (isInactive ? 'Inactive' : 'Delete') : 'No permission'}" ${deleteDisabled ? 'disabled' : ''}>
                <i class="fas fa-trash"></i>
              </button>`;
            return buttons;
          }
        }
      ]
    };
  }

  onCreate(event: Event): void {
    event.preventDefault();
    if (!this.canCreatePermission) {
      Swal.fire({
        title: 'Access Denied',
        text: 'You do not have permission to create permissions.',
        icon: 'error',
        customClass: {
          confirmButton: 'btn btn-sm btn-primary'
        },
        buttonsStyling: false
      });
      return;
    }
    this.router.navigate(['/pages/permissions/create']);
  }

  onDetail(permissionId: number): void {
    if (!permissionId) {
      console.error('No user ID provided for show');
      return;
    }
    if (!this.canViewPermission) {
      Swal.fire({
        title: 'Access Denied',
        text: 'You do not have permission to view permissions.',
        icon: 'error',
        customClass: {
          confirmButton: 'btn btn-sm btn-primary'
        },
        buttonsStyling: false
      });
      return;
    }
    this.router.navigate([`/pages/permissions/detail/${permissionId}`]);
  }

  onUpdate(permissionId: number): void {
    if (!permissionId) {
      console.error('No user ID provided for update');
      return;
    }
    if (!this.canUpdatePermission) {
      Swal.fire({
        title: 'Access Denied',
        text: 'You do not have permission to update permissions.',
        icon: 'error',
        customClass: {
          confirmButton: 'btn btn-sm btn-primary'
        },
        buttonsStyling: false
      });
      return;
    }
    this.router.navigate([`/pages/permissions/update/${permissionId}`]);
  }

  onDelete(userId: Number): void {
    if (!userId) return;
    if (!this.canDeletePermission) {
      Swal.fire({
        title: 'Access Denied',
        text: 'You do not have permission to delete permissions.',
        icon: 'error',
        customClass: {
          confirmButton: 'btn btn-sm btn-primary'
        },
        buttonsStyling: false
      });
      return;
    }
  
    const id = Number(userId);
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
          html: 'Please wait while we delete the user',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });
  
        this.permissionService.deletePermission(id).subscribe({
          next: () => {
            Swal.close();
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: 'User has been deleted.',
              showConfirmButton: false,
              timer: 2000,
              timerProgressBar: true
            });
            this.dtElement.dtInstance.then((dtInstance: any) => {
              dtInstance.ajax.reload();
            });
          },
          error: (err) => {
            Swal.close();
            console.error('Delete failed', err);
            Swal.fire('Error', 'Failed to delete user.', 'error');
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
        const permissionId = btn_detail?.getAttribute('data-id');
        if (permissionId) {
          this.onDetail(Number(permissionId));
        }
      } else if (btn_update) {
        const permissionId = btn_update?.getAttribute('data-id');
        if (permissionId) {
          this.onUpdate(Number(permissionId));
        }
      } else if (btn_delete) {
        const permissionId = btn_delete?.getAttribute('data-id');
        if (permissionId) {
          this.onDelete(Number(permissionId));
        }
      }
    });
  }
}
