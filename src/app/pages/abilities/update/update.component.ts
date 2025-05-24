import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormArray } from '@angular/forms';
import { AbilityService } from '../../../services/ability.service';
import { RoleService } from '../../../services/role.service';
import { PermissionService } from '../../../services/permission.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, concat, of, Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { RolePermission, CreateRolePermission, Permission, Role } from '../../../interfaces/fetch-data.interface';

@Component({
  selector: 'app-update',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './update.component.html',
  styleUrls: ['./update.component.css']
})
export class UpdateComponent implements OnInit {
  updateForm: FormGroup;
  roleId: number | null = null;
  roles: { value: number; label: string }[] = [];
  permissions: { value: number; label: string }[] = [];
  errorMessage: string | null = null;
  isLoading: boolean = false;

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
    }).subscribe({
      next: ({ permissions, role, roles, rolePermissions }) => {
        this.permissions = permissions.map((p: Permission) => ({
          value: p.id,
          label: p.name
        }));

        this.roles = roles.map((r: Role) => ({
          value: r.id,
          label: r.name
        }));

        this.permissionArray.clear();
        this.updateForm.patchValue({ role: role.id });

        const rolePermissionsForRole = rolePermissions.filter(rp => rp.role.id === role.id);
        rolePermissionsForRole.forEach(rp => {
          if (rp.status) {
            this.permissionArray.push(this.fb.control(rp.permission.id));
          }
        });
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.showError('Failed to load role and permissions. Please try again.');
        console.error('Failed to load role and permissions:', err);
      }
    });
  }

  isPermissionSelected(permissionValue: number): boolean {
    return this.permissionArray.controls.some(control => control.value === permissionValue);
  }

  setPermissionsForRole(): void {
    if (this.updateForm.invalid) {
      this.updateForm.markAllAsTouched();
      this.showError('Please select a role and at least one permission.');
      return;
    }

    const roleId = this.roleId;
    if (!roleId) {
      this.showError('Role ID is not defined.');
      console.error('Role ID is not defined');
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const newPermissions = this.permissionArray.value as number[];

    this.abilityService.getRolePermissonForUpdate().pipe(
      tap(currentRolePermissions => {
        const currentPermissions = currentRolePermissions
          .filter(rp => rp.role.id === roleId && rp.status)
          .map(rp => rp.permission.id);

        const permissionsToAdd = newPermissions.filter(p => !currentPermissions.includes(p));
        const permissionsToRemove = currentPermissions.filter(p => !newPermissions.includes(p));

        const operations: Observable<RolePermission | null>[] = [];

        // Handle permissions to remove (set status to false)
        permissionsToRemove.forEach(permissionId => {
          const rolePermission = currentRolePermissions.find(
            rp => rp.role.id === roleId && rp.permission.id === permissionId
          );
          // Only update if the permission exists and is currently active
          if (rolePermission?.status) {
            console.log('Updating permission to inactive:', {
              id: rolePermission.id,
              permission: permissionId,
              currentStatus: rolePermission.status
            });
            operations.push(
              this.abilityService.updateRolePermission(rolePermission.id, {
                role: rolePermission.role.id,
                permission: rolePermission.permission.id,
                status: false
              }).pipe(
                tap(() => console.log(`Updated permission ${permissionId} to inactive`)),
                catchError(err => {
                  console.error(`Failed to update permission ${permissionId}:`, err);
                  return of(null);
                })
              )
            );
          } else {
            console.log('Skipping permission update - already inactive or not found:', {
              permission: permissionId,
              exists: !!rolePermission,
              currentStatus: rolePermission?.status
            });
          }
        });

        // Handle permissions to add or reactivate
        permissionsToAdd.forEach(permissionId => {
          const existingRolePermission = currentRolePermissions.find(
            rp => rp.role.id === roleId && rp.permission.id === permissionId
          );

          if (existingRolePermission) {
            // Only update if the permission exists but is inactive
            if (!existingRolePermission.status) {
              console.log('Reactivating permission:', {
                id: existingRolePermission.id,
                permission: permissionId,
                currentStatus: existingRolePermission.status
              });
              operations.push(
                this.abilityService.updateRolePermission(existingRolePermission.id, {
                  role: existingRolePermission.role.id,
                  permission: existingRolePermission.permission.id,
                  status: true
                }).pipe(
                  tap(() => console.log(`Reactivated permission ${permissionId}`)),
                  catchError(err => {
                    console.error(`Failed to reactivate permission ${permissionId}:`, err);
                    return of(null);
                  })
                )
              );
            } else {
              console.log('Skipping permission - already active:', {
                id: existingRolePermission.id,
                permission: permissionId,
                currentStatus: existingRolePermission.status
              });
            }
          } else {
            // Create new permission only if it doesn't exist
            console.log('Creating new permission:', {
              role: roleId,
              permission: permissionId
            });
            operations.push(
              this.abilityService.createRolePermission({
                role: roleId,
                permission: permissionId
              }).pipe(
                tap(() => console.log(`Created new permission ${permissionId}`)),
                catchError(err => {
                  console.error(`Failed to create permission ${permissionId}:`, err);
                  return of(null);
                })
              )
            );
          }
        });

        // Execute operations sequentially
        if (operations.length === 0) {
          this.showSuccess('No changes needed.');
          this.isLoading = false;
          this.router.navigate(['/pages/abilities']);
          return;
        }

        concat(...operations).subscribe({
          next: () => {}, // Logging handled in tap
          error: () => {
            this.isLoading = false;
            console.error('One or more operations failed.');
          },
          complete: () => {
            this.isLoading = false;
            this.showSuccess('Permissions updated successfully.');
            this.router.navigate(['/pages/abilities']);
          }
        });
      }),
      catchError(err => {
        this.isLoading = false;
        this.showError('Failed to fetch current permissions. Please try again.');
        console.error('Failed to get current role permissions:', err);
        return of(null);
      })
    ).subscribe();
  }

  get permissionArray(): FormArray {
    return this.updateForm.get('permission') as FormArray;
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

  private showError(message: string): void {
    this.errorMessage = message;
    console.log(this.errorMessage);
  }

  private showSuccess(message: string): void {
    console.log('OK nice!')
  }

  private getErrorMessage(err: any): string {
    return err.error?.detail || err.error?.non_field_errors?.[0] || 'An error occurred. Please try again.';
  }
}