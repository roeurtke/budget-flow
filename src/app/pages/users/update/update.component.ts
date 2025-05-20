import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { RoleService } from '../../../services/role.service';
import { Role } from '../../../interfaces/fetch-data.interface';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-user-update',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './update.component.html',
  styleUrls: ['./update.component.css']
})
export class UpdateComponent implements OnInit {
  updateForm: FormGroup;
  userId: string | null = null;
  roles: { value: number; label: string }[] = [];
  statuses: { value: boolean; label: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private roleService: RoleService,
    private route: ActivatedRoute,
    private router: Router) {
    this.updateForm = this.fb.group({
      first_name: [''],
      last_name: [''],
      spending_limit: ['', [Validators.min(0)]],
      email: ['', [Validators.email]],
      username: [''],
      role: [''],
      status: ['']
    });
  }

  ngOnInit(): void {
    this.initStatuses();
    this.userId = this.route.snapshot.paramMap.get('id');
    if (this.userId) {
      this.loadUserAndRoles(this.userId);
    }
  }

  initStatuses(): void {
    this.statuses = [
      { value: true, label: 'Active' },
      { value: false, label: 'Inactive' }
    ];
  }

  loadUserAndRoles(userId: string): void {
    forkJoin({
      roles: this.roleService.getRoles(),
      user: this.userService.getUserById(userId)
    }).subscribe({
      next: ({ roles, user }) => {
        this.roles = roles.map((role: Role) => ({
          value: role.id,
          label: role.name
        }));
        const matchedRole = this.roles.find(r => r.label.toLowerCase() === user.role.name.toLowerCase());
        this.updateForm.patchValue({
          first_name: user.first_name,
          last_name: user.last_name,
          spending_limit: user.spending_limit,
          email: user.email,
          username: user.username,
          role: matchedRole ? matchedRole.value : null,
          status: user.status
        });
      },
      error: (err) => console.error('Failed to load user or roles:', err)
    });
  }

  updateUser(): void {
    if (this.updateForm.invalid) {
      this.updateForm.markAllAsTouched();
      return;
    }

    const userData = this.updateForm.value;
    this.userService.updateUser(Number(this.userId), userData).subscribe({
      next: () => {
        this.router.navigate(['/pages/users']);
      },
      error: (err) => {
        console.error('Failed to update user:', err);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/pages/users']);
  }
}
