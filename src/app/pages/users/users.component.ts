import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { UserService } from '../../services/user.service';
import { User } from '../../interfaces/fetch-data.interface';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { Subject } from 'rxjs';
import { DataTableDirective } from 'angular-datatables';
import { dataTablesConfig } from '../../shared/datatables/datatables-config';
import { Router } from '@angular/router';
import { format } from 'date-fns';
import jszip from 'jszip';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

@Component({
  selector: 'app-users',
  imports: [CommonModule, DataTablesModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit, OnDestroy {
  @ViewChild(DataTableDirective, { static: false }) dtElement!: DataTableDirective;

  users: User[] = [];
  loading = false;
  error: string | null = null;

  // DataTables properties
  dtOptions: any = {};
  dtTrigger: Subject<any> = new Subject<any>();

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit(): void {
    (window as any).jsZip = jszip;
    (window as any).pdfMake = pdfMake;

    // Set pdfMake fonts
    pdfMake.vfs = pdfFonts as unknown as { [file: string]: string };

    this.initializeDataTable();
    this.loadUsers();
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
      columns: [
        { 
          data: null,
          title: 'ID',
          render: (data: any, type: any, row: any, meta: any) => type === 'display' ? meta.row + 1 : ''
        },
        { data: 'username',
          title: 'Username',
          render: (data: string) => data || 'None'
        },
        { data: 'email',
          title: 'Email',
          render: (data: string) => data || 'None'
        },
        { data: 'first_name',
          title: 'First Name',
          render: (data: string) => data || 'None'
        },
        { data: 'last_name',
          title: 'Last Name',
          render: (data: string) => data || 'None'
        },
        { data: 'spending_limit',
          title: 'Limit (USD)',
          render: (data: number) => data || 'None'
        },
        {
          data: 'role',
          title: 'Role',
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
              <button class="btn btn-dark btn-sm btn-icon" data-id="${row.id}" title="Change Password">
                <i class="fa fa-key"></i>
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

  loadUsers(): void {
    this.loading = true;
    this.userService.getUserList().subscribe({
      next: (users) => {
        this.users = users.sort((a, b) => b.id - a.id);
        
        if (this.dtElement && this.dtElement.dtInstance) {
          this.dtElement.dtInstance.then((dtInstance: any) => {
            dtInstance.clear();
            dtInstance.rows.add(this.users);
            dtInstance.draw(); // This will regenerate the sequential IDs
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

  ngAfterViewInit(): void {
    document.querySelector('table')?.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const userId = target.getAttribute('data-id');

      if (target.classList.contains('btn-edit') && userId) {
        this.onEdit(userId); // Pass only if userId is not null
      } else if (target.classList.contains('btn-delete') && userId) {
        this.onDelete(userId); // Pass only if userId is not null
      }
    });
  }

  onCreate(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/pages/users/create']);
  }

  onEdit(userId: string): void {
    if (!userId) {
      console.error('No user ID provided for edit');
      return;
    }
    console.log('Editing user with ID:', userId);
    // Implement your edit logic here
  }

  onDelete(userId: string): void {
    if (!userId) {
      console.error('No user ID provided for delete');
      return;
    }
    
    if (confirm('Are you sure you want to delete this user?')) {
      console.log('Deleting user with ID:', userId);
      // Implement your delete logic here
    }
  }
  ngOnDestroy(): void {
    // Unsubscribe from the DataTables trigger
    this.dtTrigger.unsubscribe();
  }
}