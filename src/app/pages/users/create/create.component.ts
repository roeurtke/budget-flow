import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { RoleService } from '../../../services/role.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // Import ReactiveFormsModule
  templateUrl: './create.component.html',
  styleUrl: './create.component.css'
})
export class CreateComponent {
  roles: { value: number; label: string }[] = [];
  private fb = inject(FormBuilder);

  userForm: FormGroup = this.fb.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    limit_balance: ['', [Validators.required, Validators.min(0)]],
    email: ['', [Validators.required, Validators.email]],
    username: ['', Validators.required],
    role: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirm_password: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  constructor(private userService: UserService, private roleService: RoleService, private router: Router) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.roleService.getRoleList().subscribe({
        next: (roles) => {
        // console.log('Fetched roles:', roles);
        this.roles = roles.map(role => ({
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
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const userData = this.userForm.value;

    this.userService.createUser(userData).subscribe({
      next: (response) => {
        console.log('User created successfully:', response);
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
