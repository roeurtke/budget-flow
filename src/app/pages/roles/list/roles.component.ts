import { Component, ViewChild } from '@angular/core';
import { RoleService } from '../../../services/role.service';
import { Role } from '../../../interfaces/fetch-data.interface';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { dataTablesConfig } from '../../../shared/datatables/datatables-config';
import { Subject } from 'rxjs';
import { DataTableDirective } from 'angular-datatables';
import { format } from 'date-fns';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-roles',
  imports: [CommonModule, DataTablesModule],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.css'
})
export class RolesComponent {
  @ViewChild(DataTableDirective, { static: false }) dtElement!: DataTableDirective;

  roles: Role[] = [];
  loading = false;
  error: string | null = null;
  dtOptions: any = {};
  dtTrigger: Subject<any> = new Subject<any>();

  constructor(private roleService: RoleService, private router: Router) {}

  ngOnInit(): void {
    this.initializeDataTable();
    this.loadRoles();
  }

  initializeDataTable(): void {
    this.dtOptions = {
      ...dataTablesConfig,
      serverSide: false,
      processing: true,
      dom: `
        <"d-flex justify-content-between align-items-center mb-3"lBf>
        t
        <"d-flex justify-content-between align-items-center mt-3"ip>
      `,
      buttons: [],
      pagingType: 'simple_numbers',
      language: {
        lengthMenu: 'Show _MENU_ Entries',
        paginate: {
          previous: 'Previous',
          next: 'Next',
        },
      },
      columns: [
        { 
          data: null,
          title: 'ID',
          render: (data: any, type: any, row: any, meta: any) => type === 'display' ? meta.row + 1 : ''
        },
        { data: 'name',
          title: 'Name',
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
            return `
              <button class="btn btn-dark btn-sm btn-icon" data-id="${row.id}" title="Spicific Ability">
                <i class="fas fa-shield-alt"></i>
              </button>
              <button class="btn btn-primary btn-sm btn-icon" data-id="${row.id}" title="Show">
                <i class="fas fa-sm fa-list-alt"></i>
              </button>
              <button class="btn btn-secondary btn-sm btn-icon" data-id="${row.id}" title="Edit">
                <i class="fas fa-sm fa-edit"></i>
              </button>
              <button class="btn btn-danger btn-sm btn-icon" data-id="${row.id}" title="Delete" ${isInactive ? 'disabled' : ''}>
                <i class="fas fa-trash"></i>
              </button>
            `;
          }
        }
      ]
    };
  }

  loadRoles(): void {
    this.loading = true;
    this.roleService.getRoleList().subscribe({
      next: (roles) => {
        this.roles = roles.sort((a, b) => b.id - a.id);
        
        if (this.dtElement && this.dtElement.dtInstance) {
          this.dtElement.dtInstance.then((dtInstance: any) => {
            dtInstance.clear();
            dtInstance.rows.add(this.roles);
            dtInstance.draw();
          });
        }
        
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }

  onCreate(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/pages/roles/create']);
  }

  onDetail(roleId: Number): void {
    if (!roleId) {
      console.error('No user ID provided for show');
      return;
    }
    this.router.navigate([`/pages/roles/detail/${roleId}`]);
  }

  onUpdate(roleId: Number): void {
    if (!roleId) {
      console.error('No user ID provided for update');
      return;
    }
    this.router.navigate([`/pages/roles/update/${roleId}`]);
  }

  onDelete(userId: Number): void {
    if (!userId) {
      console.error('No user ID provided for delete');
      return;
    }
  
    const id = Number(userId);
    if (isNaN(id)) {
      console.error('Invalid user ID:', userId);
      return;
    }
  
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
            this.loadRoles();
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
