import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { RoleService } from '../../../services/role.service';
import { Role } from '../../../interfaces/fetch-data.interface';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // Import ReactiveFormsModule
  templateUrl: './create.component.html',
  styleUrl: './create.component.css'
})
export class CreateComponent {
  createForm: FormGroup;
  roles: { value: number; label: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private roleService: RoleService,
    private router: Router) {
    this.createForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      spending_limit: ['', [Validators.required, Validators.min(0)]],
      email: ['', [Validators.required, Validators.email]],
      username: ['', Validators.required],
      role: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm_password: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.roleService.getRoleList().subscribe({
        next: (roles) => {
        this.roles = roles.map((role: Role) => ({
          value: role.id,
          label: role.name
        }));
      },
      error: (err) => {
        console.error('Failed to fetch roles:', err);
      }
    });
  }

  createUser(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const userData = this.createForm.value;
    this.userService.createUser(userData).subscribe({
      next: () => {
        this.router.navigate(['/pages/users']);
      },
      error: (err) => {
        console.error('Failed to create user:', err);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/pages/users']);
  }

  private passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirm_password')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }
}
