import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AbilityService } from '../../../services/ability.service';
import { RoleService } from '../../../services/role.service';
import { PermissionService } from '../../../services/permission.service';
import { CommonModule } from '@angular/common';
import {Router } from '@angular/router';

@Component({
  selector: 'app-create',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create.component.html',
  styleUrl: './create.component.css'
})
export class CreateComponent {
  createForm: FormGroup;
  roles: { value: number; label: string }[] = [];
  permissions: { value: number; label: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private abilityService: AbilityService,
    private roleService: RoleService,
    private permissionService: PermissionService,
    private router: Router) {
    this.createForm = this.fb.group({
      role: ['', Validators.required],
      permission: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadRoles();
    this.loadPermissions();
  }

  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (response) => {
        this.roles = response.map((role: any) => ({
          value: role.id,
          label: role.name
        }));
      },
      error: (err) => {
        console.error('Failed to load roles:', err);
      }
    });
  }

  loadPermissions(): void {
    this.permissionService.getPermissions().subscribe({
      next: (response) => {
        this.permissions = response.map((permission: any) => ({
          value: permission.id,
          label: permission.name
        }));
      },
      error: (err) => {
        console.error('Failed to load permissions:', err);
      }
    });
  }

  createAbility(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const abilityData = this.createForm.value;
    this.abilityService.createRolePermission(abilityData).subscribe({
      next: () => {
        this.router.navigate(['/pages/abilities']);
      },
      error: (err) => {
        console.error('Failed to create ability:', err);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/pages/abilities']);
  }
}
