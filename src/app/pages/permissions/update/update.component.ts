import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PermissionService } from '../../../services/permission.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-permission-update',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './update.component.html',
  styleUrl: './update.component.css'
})
export class UpdateComponent {
  updateForm: FormGroup;
  permissionId: string | null = null;
  statuses: { value: boolean; label: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private permissionService: PermissionService,
    private route: ActivatedRoute,
    private router: Router) {
    this.updateForm = this.fb.group({
      name: [''],
      codename: [''],
      description: [''],
      status: ['']
    });
  }

  ngOnInit(): void {
    this.initStatuses();
    this.permissionId = this.route.snapshot.paramMap.get('id');
    if (this.permissionId) {
      this.loadPermission(Number(this.permissionId));
    }
  }

  initStatuses(): void {
    this.statuses = [
      { value: true, label: 'Active' },
      { value: false, label: 'Inactive' }
    ];
  }

  loadPermission(permissionId: number): void {
    this.permissionService.getPermissionById(permissionId).subscribe({
      next: (permission) => {
        if (permission) {
          this.updateForm.patchValue({
            name: permission.name,
            codename: permission.codename,
            description: permission.description,
            status: permission.status
          });
        } else {
          console.error('Permission data is null');
        }
      },
      error: (error) => {
        console.error('Error loading permission:', error);
      }
    });
  }

  updatePermission(): void {
    if (this.updateForm.invalid) {
      this.updateForm.markAllAsTouched();
      return;
    }
    const permissionData = this.updateForm.value;
    this.permissionService.updatePermission(Number(this.permissionId), permissionData).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Permission updated successfully',
          timer: 1500,
          customClass: {
            confirmButton: 'btn btn-sm btn-primary'
          },
          buttonsStyling: false
        }).then(() => {
          this.router.navigate(['/pages/permissions']);
        });
      },
      error: (error) => {
        console.error('Error updating permission:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to update permission',
          customClass: {
            confirmButton: 'btn btn-sm btn-primary'
          },
          buttonsStyling: false
        });
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/pages/permissions']);
  }
}
