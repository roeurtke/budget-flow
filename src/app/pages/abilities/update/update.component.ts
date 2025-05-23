import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AbilityService } from '../../../services/ability.service';
import { RoleService } from '../../../services/role.service';
import { PermissionService } from '../../../services/permission.service';
import { CommonModule } from '@angular/common';
import {ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { FormArray } from '@angular/forms';
import { RolePermission } from '../../../interfaces/fetch-data.interface';
import { Observable } from 'rxjs';

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
      role: [''],
      permission: this.fb.array([])
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

  updateAbility(): void {
    if (this.updateForm.invalid) {
      this.updateForm.markAllAsTouched();
      return;
    }

    const formData = this.updateForm.value;
    const roleId = Number(this.roleId);
    
    // First, get current role permissions to know what to delete
    this.abilityService.getRolePermissions().subscribe({
      next: (currentRolePermissions) => {
        // Filter permissions for this role
        const currentPermissions = currentRolePermissions
          .filter(rp => rp.role.id === roleId)
          .map(rp => rp.permission.id);
        
        // Get new permissions from form
        const newPermissions = formData.permission as number[];
        
        // Find permissions to add (in newPermissions but not in currentPermissions)
        const permissionsToAdd = newPermissions.filter(p => !currentPermissions.includes(p));
        
        // Find permissions to remove (in currentPermissions but not in newPermissions)
        const permissionsToRemove = currentPermissions.filter(p => !newPermissions.includes(p));
        
        // Create an array of observables for all operations
        const operations: Observable<RolePermission | null>[] = [];
        
        // Add new permissions
        permissionsToAdd.forEach(permissionId => {
          const newRolePermission = {
            role: roleId,
            permission: permissionId,
            status: true
          };
          operations.push(this.abilityService.createRolePermission(newRolePermission));
        });
        
        // Remove old permissions
        permissionsToRemove.forEach(permissionId => {
          const rolePermissionToDelete = currentRolePermissions.find(
            rp => rp.role.id === roleId && rp.permission.id === permissionId
          );
          if (rolePermissionToDelete) {
            operations.push(this.abilityService.deleteRolePermission(rolePermissionToDelete.id));
          }
        });
        
        // Execute all operations
        if (operations.length > 0) {
          forkJoin(operations).subscribe({
            next: () => {
              this.router.navigate(['/pages/abilities']);
            },
            error: (err) => {
              console.error('Failed to update role permissions:', err);
            }
          });
        } else {
          // No changes needed
          this.router.navigate(['/pages/abilities']);
        }
      },
      error: (err) => {
        console.error('Failed to get current role permissions:', err);
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
