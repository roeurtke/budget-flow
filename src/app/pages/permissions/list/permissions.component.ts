import { Component, ViewChild } from '@angular/core';
import { PermissionService } from '../../../services/permission.service';
import { Permission } from '../../../interfaces/fetch-data.interface';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { dataTablesConfig } from '../../../shared/datatables/datatables-config';
import { Subject } from 'rxjs';
import { DataTableDirective } from 'angular-datatables';
import { format } from 'date-fns';
import { Router } from '@angular/router';

@Component({
  selector: 'app-permissions',
  imports: [CommonModule, DataTablesModule],
  templateUrl: './permissions.component.html',
  styleUrl: './permissions.component.css'
})
export class PermissionsComponent {
  @ViewChild(DataTableDirective, { static: false }) dtElement!: DataTableDirective;

  permissions: Permission[] = [];
  loading = false;
  error: string | null = null;
  dtOptions: any = {};
  dtTrigger: Subject<any> = new Subject<any>();

  constructor(private permissionService: PermissionService, private router: Router) {}

  ngOnInit(): void {
    this.initializeDataTable();
    this.loadPermissions();
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
        { data: 'codename',
          title: 'Codename',
          render: (data: string) => data || 'None'
        },
        { data: 'description',
          title: 'Description',
          render: (data: string) => data || 'None'
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

  loadPermissions(): void {
    this.loading = true;
    this.permissionService.getPermissionList().subscribe({
      next: (permissions) => {
        this.permissions = permissions.sort((a, b) => b.id - a.id);
        
        if (this.dtElement && this.dtElement.dtInstance) {
          this.dtElement.dtInstance.then((dtInstance: any) => {
            dtInstance.clear();
            dtInstance.rows.add(this.permissions);
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
    console.log('Create user clicked');
  }

  onDetail(permissionId: number): void {
    if (!permissionId) {
      console.error('No user ID provided for show');
      return;
    }
    this.router.navigate([`/pages/permissions/detail/${permissionId}`]);
  }

  onUpdate(permissionId: number): void {
    if (!permissionId) {
      console.error('No user ID provided for update');
      return;
    }
    console.log('Update user clicked');
  }

  onDelete(permissionId: number): void {
    if (!permissionId) {
      console.error('No user ID provided for delete');
      return;
    }
    console.log('Delete user clicked');
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
