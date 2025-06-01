import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormArray } from '@angular/forms';
import { AbilityService } from '../../../services/ability.service';
import { RoleService } from '../../../services/role.service';
import { PermissionService } from '../../../services/permission.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { RolePermission, Permission, Role } from '../../../interfaces/fetch-data.interface';
import { PermissionMap } from '../../../shared/permissions/permissions.constants';

interface PermissionOption {
  value: number;
  label: string;
  module?: string;
}

interface GroupedPermissions {
  module: string;
  permissions: PermissionOption[];
}

@Component({
  selector: 'app-ability-update',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './update.component.html',
  styleUrls: ['./update.component.css']
})
export class UpdateComponent implements OnInit {
  updateForm: FormGroup;
  roleId: number | null = null;
  roles: PermissionOption[] = [];
  permissions: PermissionOption[] = [];
  groupedPermissions: GroupedPermissions[] = [];
  errorMessage: string | null = null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private abilityService: AbilityService,
    private roleService: RoleService,
    private permissionService: PermissionService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.updateForm = this.fb.group({
      role: [null, Validators.required],
      permission: this.fb.array([], Validators.minLength(1))
    });
  }

  ngOnInit(): void {
    const roleId = this.route.snapshot.paramMap.get('id');
    if (roleId) {
      this.roleId = +roleId;
      this.loadRoleAndPermissions(this.roleId);
    }
  }

  private loadRoleAndPermissions(roleId: number): void {
    this.isLoading = true;
    forkJoin({
      permissions: this.permissionService.getPermissions(),
      role: this.roleService.getRoleById(roleId.toString()),
      roles: this.roleService.getRoles(),
      rolePermissions: this.abilityService.getRolePermissonForUpdate()
    }).pipe(
      catchError(err => {
        this.handleError('Failed to load role and permissions', err);
        return [];
      })
    ).subscribe({
      next: ({ permissions, role, roles, rolePermissions }) => {
        this.initializeFormData(permissions, roles, role, rolePermissions);
        this.isLoading = false;
      }
    });
  }

  private initializeFormData(
    permissions: Permission[],
    roles: Role[],
    role: Role,
    rolePermissions: RolePermission[]
  ): void {
    this.permissions = this.mapToOptions(permissions);
    this.roles = this.mapToOptions(roles);
    this.groupedPermissions = this.groupPermissionsByModule(permissions);
    
    this.permissionArray.clear();
    this.updateForm.patchValue({ role: role.id });

    const activePermissions = rolePermissions
      .filter(rp => rp.role.id === role.id && rp.status)
      .map(rp => rp.permission.id);

    activePermissions.forEach(permissionId => {
      this.permissionArray.push(this.fb.control(permissionId));
    });
  }

  private mapToOptions(items: (Permission | Role)[]): PermissionOption[] {
    return items.map(item => ({
      value: item.id,
      label: item.name,
      module: this.getModuleFromPermission(item as Permission)
    }));
  }

  private getModuleFromPermission(permission: Permission): string {
    // Extract module name from permission codename (e.g., "can_create_user" -> "user")
    const codename = permission.codename?.toLowerCase() || '';
    for (const [module, actions] of Object.entries(PermissionMap)) {
      for (const [action, permCode] of Object.entries(actions)) {
        if (permCode === codename) {
          return module;
        }
      }
    }
    return 'other';
  }

  private groupPermissionsByModule(permissions: Permission[]): GroupedPermissions[] {
    const grouped = new Map<string, PermissionOption[]>();
    
    // Initialize with all modules from PermissionMap
    Object.keys(PermissionMap).forEach(module => {
      grouped.set(module, []);
    });
    grouped.set('other', []); // For permissions that don't match any module

    // Group permissions by module
    this.mapToOptions(permissions).forEach(permission => {
      const module = permission.module || 'other';
      const modulePermissions = grouped.get(module) || [];
      modulePermissions.push(permission);
      grouped.set(module, modulePermissions);
    });

    // Convert to array and filter out empty modules
    return Array.from(grouped.entries())
      .filter(([_, permissions]) => permissions.length > 0)
      .map(([module, permissions]) => ({
        module: this.formatModuleName(module),
        permissions
      }))
      .sort((a, b) => a.module.localeCompare(b.module));
  }

  private formatModuleName(module: string): string {
    // Convert module name to title case and replace camelCase with spaces
    return module
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  setPermissionsForRole(): void {
    if (this.updateForm.invalid) {
      this.updateForm.markAllAsTouched();
      this.showError('Please select a role and at least one permission.');
      return;
    }

    if (!this.roleId) {
      this.showError('Role ID is not defined.');
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.abilityService.getRolePermissonForUpdate().pipe(
      switchMap(currentRolePermissions => this.updatePermissions(currentRolePermissions)),
      catchError(err => {
        this.handleError('Failed to update permissions', err);
        return [];
      })
    ).subscribe({
      complete: () => {
        this.isLoading = false;
        // this.showSuccess('Permissions updated successfully.');
        this.router.navigate(['/pages/abilities']);
      }
    });
  }

  private updatePermissions(currentRolePermissions: RolePermission[]): Observable<void> {
    const newPermissions = this.permissionArray.value as number[];
    const currentPermissions = currentRolePermissions
      .filter(rp => rp.role.id === this.roleId && rp.status)
      .map(rp => rp.permission.id);

    const permissionsToAdd = newPermissions.filter(p => !currentPermissions.includes(p));
    const permissionsToRemove = currentPermissions.filter(p => !newPermissions.includes(p));

    const updateOperations = [
      ...this.createRemoveOperations(currentRolePermissions, permissionsToRemove),
      ...this.createAddOperations(currentRolePermissions, permissionsToAdd)
    ];

    if (updateOperations.length === 0) {
      // this.showSuccess('No changes needed.');
      this.router.navigate(['/pages/abilities']);
      return new Observable(subscriber => subscriber.complete());
    }

    return forkJoin(updateOperations).pipe(
      map(results => {
        const hasNullResults = results.some(result => result === null);
        if (hasNullResults) {
          throw new Error('Some operations failed');
        }
        return void 0;
      })
    );
  }

  private createRemoveOperations(
    currentRolePermissions: RolePermission[],
    permissionsToRemove: number[]
  ): Observable<RolePermission | null>[] {
    return permissionsToRemove.map(permissionId => {
      const rolePermission = currentRolePermissions.find(
        rp => rp.role.id === this.roleId && rp.permission.id === permissionId && rp.status
      );
      
      if (!rolePermission) return new Observable(subscriber => subscriber.next(null));
      
      return this.abilityService.updateRolePermission(rolePermission.id, {
        role: rolePermission.role.id,
        permission: rolePermission.permission.id,
        status: false
      });
    });
  }

  private createAddOperations(
    currentRolePermissions: RolePermission[],
    permissionsToAdd: number[]
  ): Observable<RolePermission | null>[] {
    return permissionsToAdd.map(permissionId => {
      const existingRolePermission = currentRolePermissions.find(
        rp => rp.role.id === this.roleId && rp.permission.id === permissionId
      );

      if (existingRolePermission) {
        return this.abilityService.updateRolePermission(existingRolePermission.id, {
          role: existingRolePermission.role.id,
          permission: existingRolePermission.permission.id,
          status: true
        });
      }

      return this.abilityService.createRolePermission({
        role: this.roleId!,
        permission: permissionId
      });
    });
  }

  get permissionArray(): FormArray {
    return this.updateForm.get('permission') as FormArray;
  }

  isPermissionSelected(permissionValue: number): boolean {
    return this.permissionArray.controls.some(control => control.value === permissionValue);
  }

  onPermissionChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = +input.value;
    
    if (input.checked) {
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

  private handleError(message: string, error: any): void {
    this.isLoading = false;
    this.showError(message);
    console.error(message, error);
  }

  private showError(message: string): void {
    this.errorMessage = message;
  }

  private showSuccess(message: string): void {
    // TODO: Implement proper success message handling
    console.log(message);
  }
}