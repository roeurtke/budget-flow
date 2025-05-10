import { Component, ViewChild } from '@angular/core';
import { AbilityService } from '../../services/ability.service';
import { RolePermission } from '../../interfaces/fetch-data.interface';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { dataTablesConfig } from '../../shared/datatables/datatables-config';
import { Subject } from 'rxjs';
import { DataTableDirective } from 'angular-datatables';
import { format } from 'date-fns';

@Component({
  selector: 'app-abilities',
  imports: [CommonModule, DataTablesModule],
  templateUrl: './abilities.component.html',
  styleUrl: './abilities.component.css'
})
export class AbilitiesComponent {
  @ViewChild(DataTableDirective, { static: false }) dtElement!: DataTableDirective;

  rolePermissions: RolePermission[] = [];
  loading = false;
  error: string | null = null;
  dtOptions: any = {};
  dtTrigger: Subject<any> = new Subject<any>();

  constructor(private abilityService: AbilityService) {}

  ngOnInit(): void {
    this.initializeDataTable();
    this.loadRolePermissions();
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
        {
          data: 'role',
          title: 'Role',
          render: (data: any) => typeof data === 'string' ? data || 'None' : data?.name || 'None'
        },
        {
          data: 'permission',
          title: 'Permission',
          render: (data: any) => typeof data === 'string' ? data || 'None' : data?.name || 'None'
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
                <i class="fa fa-sm fa-list-alt"></i>
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

  loadRolePermissions(): void {
    this.loading = true;
    this.abilityService.getRolePermissionList().subscribe({
      next: (rolePermissions) => {
        this.rolePermissions = rolePermissions.sort((a, b) => b.id - a.id);
        
        if (this.dtElement && this.dtElement.dtInstance) {
          this.dtElement.dtInstance.then((dtInstance: any) => {
            dtInstance.clear();
            dtInstance.rows.add(this.rolePermissions);
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
}
