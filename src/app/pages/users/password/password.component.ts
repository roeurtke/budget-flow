import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-password',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './password.component.html',
  styleUrl: './password.component.css'
})
export class PasswordComponent implements OnInit {
  passwordForm: FormGroup;
  userId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute) {
    this.passwordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm_password: ['', [Validators.required]],
      }, { validators: this.passwordMatchValidator });
    }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    if (this.userId) {
      this.loadUser(this.userId);
    }
  }

  loadUser(userId: string): void {
    this.userService.getUserById(userId).subscribe({
      next: () => {
        this.passwordForm.patchValue({
          password: '',
          confirm_password: ''
        });
      },
      error: (err) => {
        console.error('Failed to load user:', err);
      }
    });
  }

  private passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirm_password')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  updatePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const passwordData = this.passwordForm.value;
    this.userService.updatePassword(Number(this.userId), passwordData).subscribe({
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
