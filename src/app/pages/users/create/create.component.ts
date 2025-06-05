import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { RoleService } from '../../../services/role.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
    this.roleService.getRoles().subscribe({
      next: (response) => {
        this.roles = response.map((role: any) => ({
          value: role.id,
          label: role.name
        }));
      },
      error: (err) => {
        console.error('Failed to load roles:', err);
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
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'User created successfully',
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
        if (err.status === 400 && (err.error?.username || err.error?.email)) {
          Swal.fire({
            icon: 'error',
            title: 'User Already Exists',
            text: err.error.username ? 'Username already taken' : 'Email already registered',
            customClass: {
              confirmButton: 'btn btn-sm btn-primary'
            },
            buttonsStyling: false
          });
        } else {
          console.error('Failed to create user:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to create user. Please try again.',
            customClass: {
              confirmButton: 'btn btn-sm btn-primary'
            },
            buttonsStyling: false
          });
        }
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
