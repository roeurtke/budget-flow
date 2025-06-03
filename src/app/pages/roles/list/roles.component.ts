import { Component, ViewChild } from '@angular/core';
import { RoleService } from '../../../services/role.service';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { Subject } from 'rxjs';
import { DataTableDirective } from 'angular-datatables';
import { dataTablesConfig } from '../../../shared/datatables/datatables-config';
import { format } from 'date-fns';
import { Router } from '@angular/router';
import { PermissionService } from '../../../services/permission.service';
import { PermissionCode } from '../../../shared/permissions/permissions.constants';
import { ButtonService } from '../../../services/button.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-roles',
  imports: [CommonModule, DataTablesModule],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.css'
})
export class RolesComponent {
  @ViewChild(DataTableDirective, { static: false }) dtElement!: DataTableDirective;

  loading = false;
  error: string | null = null;
  canCreateRole = false;
  canViewRole = false;
  canUpdateRole = false;
  canDeleteRole = false;

  dtOptions: any = {};
  dtTrigger: Subject<any> = new Subject<any>();

  constructor(
    private roleService: RoleService,
    private permissionService: PermissionService,
    private buttonService: ButtonService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeDataTable();
    this.permissionService.hasPermission(PermissionCode.CAN_CREATE_ROLE).subscribe(has => this.canCreateRole = has);
    this.permissionService.hasPermission(PermissionCode.CAN_VIEW_ROLE).subscribe(has => this.canViewRole = has);
    this.permissionService.hasPermission(PermissionCode.CAN_UPDATE_ROLE).subscribe(has => this.canUpdateRole = has);
    this.permissionService.hasPermission(PermissionCode.CAN_DELETE_ROLE).subscribe(has => this.canDeleteRole = has);
  }

  initializeDataTable(): void {
    this.dtOptions = {
      ...dataTablesConfig,
      serverSide: true,
      processing: true,
      order: [[1, 'desc']],
      ajax: (dataTablesParameters: any, callback: any) => {
        this.loading = true;
        this.roleService.getRolesForDataTables(dataTablesParameters).subscribe({
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
          render: (data: string) => data ? format(new Date(data), 'dd/MM/yyyy') : '-'
        },
        {
          data: 'updated_at',
          title: 'Updated',
          render: (data: string) => data ? format(new Date(data), 'dd/MM/yyyy') : '-'
        },
        {
          data: null,
          title: 'Actions',
          orderable: false,
          render: (data: any, type: any, row: any) => {
            const isInactive = !row.status;
            let buttons = '';
            
            buttons += this.buttonService.actionButton('fas fa-sm fa-id-card', 'Detail', row.id, 'btn-primary', this.canViewRole);
            buttons += this.buttonService.actionButton('fas fa-sm fa-edit', 'Edit', row.id, 'btn-secondary', this.canUpdateRole);
            buttons += this.buttonService.actionButton('fas fa-trash', 'Delete', row.id, 'btn-danger', this.canDeleteRole, isInactive);
            return buttons;
          }
        }
      ]
    };
  }

  onCreate(event: Event): void {
    event.preventDefault();
    if (!this.canCreateRole) {
      Swal.fire({
        title: 'Access Denied',
        text: 'You do not have permission to create roles.',
        icon: 'error',
        customClass: {
          confirmButton: 'btn btn-sm btn-primary'
        },
        buttonsStyling: false
      });
      return;
    }
    this.router.navigate(['/pages/roles/create']);
  }

  onDetail(roleId: Number): void {
    if (!roleId) {
      console.error('No user ID provided for show');
      return;
    }
    if (!this.canViewRole) {
      Swal.fire({
        title: 'Access Denied',
        text: 'You do not have permission to view roles.',
        icon: 'error',
        customClass: {
          confirmButton: 'btn btn-sm btn-primary'
        },
        buttonsStyling: false
      });
      return;
    }
    this.router.navigate([`/pages/roles/detail/${roleId}`]);
  }

  onUpdate(roleId: Number): void {
    if (!roleId) {
      console.error('No user ID provided for update');
      return;
    }
    if (!this.canUpdateRole) {
      Swal.fire({
        title: 'Access Denied',
        text: 'You do not have permission to update roles.',
        icon: 'error',
        customClass: {
          confirmButton: 'btn btn-sm btn-primary'
        },
        buttonsStyling: false
      });
      return;
    }
    this.router.navigate([`/pages/roles/update/${roleId}`]);
  }

  onDelete(userId: Number): void {
    if (!userId) return;
    if (!this.canDeleteRole) {
      Swal.fire({
        title: 'Access Denied',
        text: 'You do not have permission to delete roles.',
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
  
        this.roleService.deleteRole(id).subscribe({
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
            // Refresh the DataTable after deletion
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
        const roleId = btn_detail?.getAttribute('data-id');
        if (roleId) {
          this.onDetail(Number(roleId));
        }
      } else if (btn_update) {
        const roleId = btn_update?.getAttribute('data-id');
        if (roleId) {
          this.onUpdate(Number(roleId));
        }
      } else if (btn_delete) {
        const roleId = btn_delete?.getAttribute('data-id');
        if (roleId) {
          this.onDelete(Number(roleId));
        }
      }
    });
  }
}
