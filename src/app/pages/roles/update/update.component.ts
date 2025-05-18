import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RoleService } from '../../../services/role.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-role-update',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './update.component.html',
  styleUrl: './update.component.css'
})
export class UpdateComponent {
  updateForm: FormGroup;
  roleId: string | null = null;
  statuses: { value: boolean; label: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private roleService: RoleService,
    private route: ActivatedRoute,
    private router: Router) {
    this.updateForm = this.fb.group({
      name: ['',],
      description: [''],
      status: ['']
    });
  }

  ngOnInit(): void {
    this.initStatuses();
    this.roleId = this.route.snapshot.paramMap.get('id');
    if (this.roleId) {
      this.loadRole(this.roleId);
    }
  }

  initStatuses(): void {
    this.statuses = [
      { value: true, label: 'Active' },
      { value: false, label: 'Inactive' }
    ];
  }

  loadRole(roleId: string): void {
    this.roleService.getRoleById(roleId).subscribe({
      next: (role) => {
        this.updateForm.patchValue({
          name: role.name,
          description: role.description,
          status: role.status
        });
      },
      error: (error) => {
        console.error('Error loading role:', error);
      }
    });
  }

  updateRole(): void {
    if (this.updateForm.invalid) {
      this.updateForm.markAllAsTouched();
      return;
    }

    const roleData = this.updateForm.value;
    this.roleService.updateRole(Number(this.roleId), roleData).subscribe({
      next: () => {
        this.router.navigate(['/pages/roles']);
      },
      error: (error) => {
        console.error('Error updating role:', error);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/pages/roles']);
  }
}
