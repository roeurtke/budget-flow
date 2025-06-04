import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl } from '@angular/forms';
import { RoleService } from '../../../services/role.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-role-create',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create.component.html',
  styleUrl: './create.component.css'
})
export class CreateComponent {
  createForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private roleService: RoleService,
    private router: Router) {
    this.createForm = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
  }

  createRole(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const roleData = this.createForm.value;
    this.roleService.createRole(roleData).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Role created successfully',
          timer: 1500,
          customClass: {
            confirmButton: 'btn btn-sm btn-primary'
          },
          buttonsStyling: false
        }).then(() => {
          this.router.navigate(['/pages/roles']);
        });
      },
      error: (err) => {
        console.error('Failed to create role:', err);
        Swal.fire({
          icon: 'error',
          title: 'Role Already Exists',
          text: 'Please use another name',
          customClass: {
            confirmButton: 'btn btn-sm btn-primary'
          },
          buttonsStyling: false
        });
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/pages/roles']);
  }
}
