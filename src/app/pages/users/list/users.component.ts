import { Component, OnInit, ViewChild } from '@angular/core';
import { UserService } from '../../../services/user.service';
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
import Swal from 'sweetalert2';

@Component({
  selector: 'app-users',
  imports: [CommonModule, DataTablesModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  @ViewChild(DataTableDirective, { static: false }) dtElement!: DataTableDirective;

  loading = false;
  error: string | null = null;
  canCreateUser = false;
  canViewUser = false;
  canUpdateUser = false;
  canDeleteUser = false;

  // DataTables properties
  dtOptions: any = {};
  dtTrigger: Subject<any> = new Subject<any>();

  constructor(
    private userService: UserService, 
    private router: Router,
    private buttonService: ButtonService,
    private permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.initializeDataTable();
    this.permissionService.hasPermission(PermissionCode.CAN_CREATE_USER).subscribe(has => this.canCreateUser = has);
    this.permissionService.hasPermission(PermissionCode.CAN_VIEW_USER).subscribe(has => this.canViewUser = has);
    this.permissionService.hasPermission(PermissionCode.CAN_UPDATE_USER).subscribe(has => this.canUpdateUser = has);
    this.permissionService.hasPermission(PermissionCode.CAN_DELETE_USER).subscribe(has => this.canDeleteUser = has);
  }

  initializeDataTable(): void {
    this.dtOptions = {
      ...dataTablesConfig,
      serverSide: true,
      processing: true,
      order: [[1, 'desc']],
      ajax: (dataTablesParameters: any, callback: any) => {
        this.loading = true;
        this.userService.getUsersForDataTables(dataTablesParameters).subscribe({
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
        { data: 'username',
          title: 'Username',
          render: (data: string) => data || '-'
        },
        { data: 'email',
          title: 'Email',
          render: (data: string) => data || '-'
        },
        { data: 'first_name',
          title: 'First Name',
          render: (data: string) => data || '-'
        },
        { data: 'last_name',
          title: 'Last Name',
          render: (data: string) => data || '-'
        },
        { data: 'spending_limit',
          title: 'Limit (USD)',
          type: 'number',
          render: (data: number) => data || '-'
        },
        {
          data: 'role',
          title: 'Role',
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
            
            // Detail button - only visible if user can view users
            buttons += this.buttonService.actionButton('fas fa-sm fa-id-card', 'Detail', row.id, 'btn-primary', this.canViewUser);

            // Change Password button - only visible if user can update users
            buttons += this.buttonService.actionButton('fas fa-key', 'Change Password', row.id, 'btn-dark', this.canUpdateUser);

            // Edit button - only visible if user can update users
            buttons += this.buttonService.actionButton('fas fa-sm fa-edit', 'Edit', row.id, 'btn-secondary', this.canUpdateUser);

            // Delete button - only visible if user can delete users
            buttons += this.buttonService.actionButton('fas fa-trash', 'Delete', row.id, 'btn-danger', this.canDeleteUser, isInactive);

            return buttons;
          }
        }
      ]
    };
  }

  onCreate(event: Event): void {
    event.preventDefault();
    if (!this.canCreateUser) {
      Swal.fire({
        title: 'Access Denied',
        text: 'You do not have permission to create users.',
        icon: 'error',
        customClass: {
          confirmButton: 'btn btn-sm btn-primary'
        },
        buttonsStyling: false // Important: disables SweetAlert2 default styling so your class is applied
      });
      return;
    }
    this.router.navigate(['/pages/users/create']);
  }

  onDetail(userId: Number): void {
    if (!userId) {
      console.error('No user ID provided for show');
      return;
    }
    if (!this.canViewUser) {
      Swal.fire({
        title: 'Access Denied',
        text: 'You do not have permission to view users.',
        icon: 'error',
        customClass: {
          confirmButton: 'btn btn-sm btn-primary'
        },
        buttonsStyling: false
      });
      return;
    }
    this.router.navigate([`/pages/users/detail/${userId}`]);
  }

  onUpdate(userId: Number): void {
    if (!userId) {
      console.error('No user ID provided for edit');
      return;
    }
    if (!this.canUpdateUser) {
      Swal.fire({
        title: 'Access Denied',
        text: 'You do not have permission to update users.',
        icon: 'error',
        customClass: {
          confirmButton: 'btn btn-sm btn-primary'
        },
        buttonsStyling: false
      });
      return;
    }
    this.router.navigate([`/pages/users/update/${userId}`]);
  }

  onChangePassword(userId: Number): void {
    if (!userId) {
      console.error('No user ID provided for change password');
      return;
    }
    if (!this.canUpdateUser) {
      Swal.fire('Access Denied', 'You do not have permission to change user passwords.', 'error');
      return;
    }
    this.router.navigate([`/pages/users/password/${userId}`]);
  }

  onDelete(userId: Number): void {
    if (!userId) return;
    if (!this.canDeleteUser) {
      Swal.fire({
        title: 'Access Denied',
        text: 'You do not have permission to delete users.',
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
  
        this.userService.deleteUser(id).subscribe({
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
      const btn_change_password = target.closest('.btn-dark');
      const btn_delete = target.closest('.btn-danger');
      
      if (btn_detail) {
        const userId = btn_detail?.getAttribute('data-id');
        if (userId) {
          this.onDetail(Number(userId)); // Redirect to detail page
        }
      }
      else if (btn_update) {
        const userId = btn_update?.getAttribute('data-id');
        if (userId) {
          this.onUpdate(Number(userId));
        } 
      } else if (btn_change_password){
        const userId = btn_change_password?.getAttribute('data-id');
        if (userId) {
          this.onChangePassword(Number(userId));
        } 
      }
      else if (btn_delete) {
        const userId = btn_delete?.getAttribute('data-id');
        if (userId) {
          this.onDelete(Number(userId));
        }
      }
    });
  }
}