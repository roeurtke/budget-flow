import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { RoleService } from '../../../services/role.service';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-update',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './update.component.html',
  styleUrls: ['./update.component.css']
})
export class UpdateComponent implements OnInit {
  userForm: FormGroup;
  userId: string | null = null;
  roles: { value: number; label: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private roleService: RoleService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.userForm = this.fb.group({
      first_name: [''],
      last_name: [''],
      limit_balance: ['', [Validators.min(0)]],
      email: ['', [Validators.email]],
      username: [''],
      role: [''],
    });
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    if (this.userId) {
      this.loadUserAndRoles(this.userId);
    }
  }

  loadUserAndRoles(userId: string): void {
    forkJoin({
      roles: this.roleService.getRoleList(),
      user: this.userService.getUserById(userId)
    }).subscribe({
      next: ({ roles, user }) => {
        this.roles = roles.map(role => ({
          value: role.id,
          label: role.name
        }));
        const matchedRole = this.roles.find(r => r.label.toLowerCase() === user.role.name.toLowerCase());
        this.userForm.patchValue({
          first_name: user.first_name,
          last_name: user.last_name,
          limit_balance: user.spending_limit,
          email: user.email,
          username: user.username,
          role: matchedRole ? matchedRole.value : null
        });
      },
      error: (err) => console.error('Failed to load user or roles:', err)
    });
  }

  updateUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const formValues = this.userForm.value;

    const updatedData = {
      first_name: formValues.first_name,
      last_name: formValues.last_name,
      spending_limit: formValues.limit_balance,
      username: formValues.username,
      email: formValues.email,
      role: formValues.role
    };

    this.userService.updateUser(Number(this.userId), updatedData).subscribe({
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
