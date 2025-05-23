import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AbilityService } from '../../../services/ability.service';
import { RoleService } from '../../../services/role.service';
import { PermissionService } from '../../../services/permission.service';
import { CommonModule } from '@angular/common';
import {ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { FormArray } from '@angular/forms';
@Component({
  selector: 'app-update',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './update.component.html',
  styleUrl: './update.component.css'
})
export class UpdateComponent {
  updateForm: FormGroup;
  roleId: string | null = null;
  roles: { value: number; label: string }[] = [];
  permissions: { value: number; label: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private abilityService: AbilityService,
    private roleService: RoleService,
    private permissionService: PermissionService,
    private route: ActivatedRoute,
    private router: Router) {
    this.updateForm = this.fb.group({
      role: ['', Validators.required],
      permission: this.fb.array([], Validators.required)
    });
  }

  ngOnInit(): void {
    this.roleId = this.route.snapshot.paramMap.get('id');
    if (this.roleId) {
      this.loadRoleAndPermissions(this.roleId);
    }
  }

  loadRoleAndPermissions(roleId: string): void {
    forkJoin({
      permissions: this.permissionService.getPermissions(),
      role: this.roleService.getRoleById(roleId),
      roles: this.roleService.getRoles(),
      rolePermissions: this.abilityService.getRolePermissions()
    }).subscribe({
      next: ({ permissions, role, roles, rolePermissions }) => {
        // console.log('Complete role data from API:', role);
        // console.log('All role permissions:', rolePermissions);
        
        // Set permissions
        this.permissions = permissions.map((permission: any) => ({
          value: permission.id,
          label: permission.name
        }));
        
        // Set roles
        this.roles = roles.map((role: any) => ({
          value: role.id,
          label: role.name
        }));
        
        // Clear existing permissions
        while (this.permissionArray.length) {
          this.permissionArray.removeAt(0);
        }
        
        // Set the selected role
        this.updateForm.patchValue({
          role: (role as any).id
        });
        
        // Filter permissions for this role
        const rolePermissionsForRole = rolePermissions.filter(rp => rp.role.id === (role as any).id);
        // console.log('Permissions for this role:', rolePermissionsForRole);
        
        // Add role's permissions to the FormArray
        rolePermissionsForRole.forEach(rp => {
          this.permissionArray.push(this.fb.control(rp.permission.id));
        });
        // console.log('FormArray after loading:', this.permissionArray.value);
      },
      error: (err) => {
        console.error('Failed to load role and permissions:', err);
      }
    });
  }

  // Add this method to check if a permission is selected
  isPermissionSelected(permissionValue: number): boolean {
    const isSelected = this.permissionArray.controls.some(control => control.value === permissionValue);
    // console.log(`Checking permission ${permissionValue}: ${isSelected}`);
    return isSelected;
  }

  updateAbility(): void{
    if (this.updateForm.invalid){
      this.updateForm.markAllAsTouched();
      return;
    }

    const rolePermissionData = this.updateForm.value;
    this.abilityService.updateRolePermission(Number(this.roleId), rolePermissionData).subscribe({
      next: () => {
        this.router.navigate(['/pages/abilities']);
      },
      error: (err) => {
        console.error('Failed to update permission for the role:', err);
      }
    });
  }

  get permissionArray(): FormArray {
    return this.updateForm.get('permission') as FormArray;
  }

  onPermissionChange(event: any): void {
    const value = +event.target.value;
    if (event.target.checked) {
      this.permissionArray.push(this.fb.control(value));
    } else {
      const index = this.permissionArray.controls.findIndex(x => x.value === value);
      if (index !== -1) {
        this.permissionArray.removeAt(index);
      }
    }
  }

  onCancel(): void {
    this.router.navigate(['/pages/abilities']);
  }
}
