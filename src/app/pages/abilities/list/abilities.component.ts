import { Component, ViewChild } from '@angular/core';
import { AbilityService } from '../../../services/ability.service';
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
  selector: 'app-abilities',
  imports: [CommonModule, DataTablesModule],
  templateUrl: './abilities.component.html',
  styleUrl: './abilities.component.css'
})
export class AbilitiesComponent {
  @ViewChild(DataTableDirective, { static: false }) dtElement!: DataTableDirective;

  loading = false;
  error: string | null = null;
  // canCreateAbility = false;
  canViewAbility = false;
  canUpdateAbility = false;
  canDeleteAbility = false;

  dtOptions: any = {};
  dtTrigger: Subject<any> = new Subject<any>();

  constructor(
    private abilityService: AbilityService,
    private permissionService: PermissionService,
    private buttonService: ButtonService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeDataTable();
    // this.permissionService.hasPermission('can_create_role_permission').subscribe(has => this.canCreateAbility = has);
    this.permissionService.hasPermission(PermissionCode.CAN_VIEW_ROLE_PERMISSION).subscribe(has => this.canViewAbility = has);
    this.permissionService.hasPermission(PermissionCode.CAN_UPDATE_ROLE_PERMISSION).subscribe(has => this.canUpdateAbility = has);
    this.permissionService.hasPermission(PermissionCode.CAN_DELETE_ROLE_PERMISSION).subscribe(has => this.canDeleteAbility = has);
  }

  initializeDataTable(): void {
    this.dtOptions = {
      ...dataTablesConfig,
      serverSide: true,
      processing: true,
      order: [[1, 'desc']],
      ajax: (dataTablesParameters: any, callback: any) => {
        this.loading = true;
        this.abilityService.getRolesWithPermissionCountForDataTables().subscribe({
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
        {
          data: 'name',
          title: 'Role',
          render: (data: any) => typeof data === 'string' ? data || 'None' : data?.name || 'None'
        },
        {
          data: 'permission_count',
          title: 'Permission',
          type: 'number',
          render: (data: number) => data?.toString() || '0'
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
            
            buttons += this.buttonService.actionButton('fas fa-sm fa-id-card', 'Detail', row.id, 'btn-primary', this.canViewAbility);
            buttons += this.buttonService.actionButton('fas fa-sm fa-shield-alt', 'Set Permission', row.id, 'btn-secondary', this.canUpdateAbility);
            buttons += this.buttonService.actionButton('fas fa-trash', 'Delete', row.id, 'btn-danger', this.canUpdateAbility, isInactive);
            return buttons;
          }
        }
      ]
    };
  }

  onCreate(event: Event): void {
    event.preventDefault();
    // this.router.navigate(['/pages/abilities/create']);
    console.log('Create button clicked');
  }

  onDetail(rolePermissionId: number): void {
    if (!rolePermissionId) {return;}
    if (!this.canViewAbility) {
      Swal.fire({
        title: 'Access Denied',
        text: 'You do not have permission to view abilities.',
        icon: 'error',
        customClass: {
          confirmButton: 'btn btn-sm btn-primary'
        },
        buttonsStyling: false
      });
      return;
    }
    this.router.navigate(['/pages/abilities/detail', rolePermissionId]);
  }

  onUpdate(rolePermissionId: number): void {
    if (!rolePermissionId) {return;}
    if (!this.canUpdateAbility) {
      Swal.fire({
        title: 'Access Denied',
        text: 'You do not have permission to update abilities.',
        icon: 'error',
        customClass: {
          confirmButton: 'btn btn-sm btn-primary'
        },
        buttonsStyling: false
      });
      return;
    }
    this.router.navigate(['/pages/abilities/update', rolePermissionId]);
  }

  onDelete(userId: Number): void {
    if (!userId) return;
    if (!this.canDeleteAbility) {
      Swal.fire({
        title: 'Access Denied',
        text: 'You do not have permission to delete abilities.',
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
  
        this.abilityService.deleteRolePermission(id).subscribe({
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
        const rolePermissionId = btn_detail?.getAttribute('data-id');
        if (rolePermissionId) {
          this.onDetail(Number(rolePermissionId));
        }
      } else if (btn_update) {
        const rolePermissionId = btn_update?.getAttribute('data-id');
        if (rolePermissionId) {
          this.onUpdate(Number(rolePermissionId));
        }
      } else if (btn_delete) {
        const rolePermissionId = btn_delete?.getAttribute('data-id');
        if (rolePermissionId) {
          this.onDelete(Number(rolePermissionId));
        }
      }
    });
  }
}
