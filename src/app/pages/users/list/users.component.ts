import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { User } from '../../../interfaces/fetch-data.interface';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { Subject } from 'rxjs';
import { DataTableDirective } from 'angular-datatables';
import { dataTablesConfig } from '../../../shared/datatables/datatables-config';
import { Router } from '@angular/router';
import { format } from 'date-fns';
import jszip from 'jszip';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import Swal from 'sweetalert2';

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
              <button class="btn btn-primary btn-sm btn-icon" data-id="${row.id}" title="Detail">
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
      const btn_detail = target.closest('.btn-primary');
      const btn_update = target.closest('.btn-secondary');
      const btn_change_password = target.closest('.btn-dark');
      const btn_delete = target.closest('.btn-danger');
      
      if (btn_detail) {
        const userId = btn_detail?.getAttribute('data-id');
        if (userId) {
          this.onDetail(userId); // Redirect to detail page
        }
      }
      else if (btn_update) {
        const userId = btn_update?.getAttribute('data-id');
        if (userId) {
          this.onUpdate(userId);
        } 
      } else if (btn_change_password){
        const userId = btn_change_password?.getAttribute('data-id');
        if (userId) {
          this.onChangePassword(userId);
        } 
      }
      else if (btn_delete) {
        const userId = btn_delete?.getAttribute('data-id');
        if (userId) {
          this.onDelete(userId);
        }
      }
    });
  }

  onDetail(userId: string): void {
    if (!userId) {
      console.error('No user ID provided for show');
      return;
    }
    this.router.navigate([`/pages/users/detail/${userId}`]);
  }

  onCreate(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/pages/users/create']);
  }

  onUpdate(userId: string): void {
    if (!userId) {
      console.error('No user ID provided for edit');
      return;
    }
    this.router.navigate([`/pages/users/update/${userId}`]);
  }

  onChangePassword(userId: string): void {
    if (!userId) {
      console.error('No user ID provided for change password');
      return;
    }
    this.router.navigate([`/pages/users/password/${userId}`]);
  }

  onDelete(userId: string): void {
    if (!userId) {
      console.error('No user ID provided for delete');
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
        popup: 'animated bounceIn', // Add animation
        confirmButton: 'btn btn-sm btn-danger',
        cancelButton: 'btn btn-sm btn-secondary ml-2'
      },
    }).then((result) => {
      if (result.isConfirmed) {
        this.userService.deleteUser(Number(userId)).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'User has been deleted.', 'success');
            this.loadUsers(); // Reload the list
          },
          error: (err) => {
            console.error('Delete failed', err);
            Swal.fire('Error', 'Failed to delete user.', 'error');
          }
        });
      }
    });
  }
  
  ngOnDestroy(): void {
    // Unsubscribe from the DataTables trigger
    this.dtTrigger.unsubscribe();
  }
}