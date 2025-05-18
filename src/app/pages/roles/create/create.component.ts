import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl } from '@angular/forms';
import { RoleService } from '../../../services/role.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
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
        this.router.navigate(['/pages/roles']);
      },
      error: (err) => {
        console.error('Failed to create role:', err);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/pages/roles']);
  }
}
