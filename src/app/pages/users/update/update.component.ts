import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { RoleService } from '../../../services/role.service';
import { Role } from '../../../interfaces/fetch-data.interface';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

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
        const matchedRole = this.roles.find(r => r.value === user.role.id);
        this.updateForm.patchValue({
          first_name: user.first_name,
          last_name: user.last_name,
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
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'User updated successfully',
          timer: 1500,
          customClass: {
            confirmButton: 'btn btn-sm btn-primary'
          },
          buttonsStyling: false
        }).then(() => {
          this.router.navigate(['/pages/users']);
        });
      },
      error: (err) => {
        console.error('Failed to update user:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to update user. Please try again.',
          customClass: {
            confirmButton: 'btn btn-sm btn-primary'
          },
          buttonsStyling: false
        });
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/pages/users']);
  }
}
