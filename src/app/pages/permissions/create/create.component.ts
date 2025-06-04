import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { PermissionService } from '../../../services/permission.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-permissin-create',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create.component.html',
  styleUrl: './create.component.css'
})
export class CreateComponent {
  createForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private permissionService: PermissionService,
    private router: Router) {
    this.createForm = this.fb.group({
      name: ['', Validators.required],
      codename: ['', Validators.required],
      description: ['']
    });
  }

  createPermission(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const permissionData = this.createForm.value;
    this.permissionService.createPermission(permissionData).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Permission created successfully',
          timer: 1500,
          customClass: {
            confirmButton: 'btn btn-sm btn-primary'
          },
          buttonsStyling: false
        }).then(() => {
          this.router.navigate(['/pages/permissions']);
        });
      },
      error: (err) => {
        console.error('Failed to create permission:', err);
        Swal.fire({
          icon: 'error',
          title: 'Permission Already Exists',
          text: 'Failed to create permission',
          customClass: {
            confirmButton: 'btn btn-sm btn-primary'
          },
          buttonsStyling: false
        })
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/pages/permissions']);
  }
}
