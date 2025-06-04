import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ExpenseCategoryService } from '../../../services/expense-category.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-expense-category-create',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create.component.html',
  styleUrl: './create.component.css'
})
export class CreateComponent {
  createForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private expenseCategoryService: ExpenseCategoryService,
    private router: Router ){
      this.createForm = this.fb.group({
        name: ['', Validators.required],
        description: ['', Validators.required],
      });
  }

  createExpenseCategory(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const expenseCategoryData = this.createForm.value;
    this.expenseCategoryService.createExpenseCategory(expenseCategoryData).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Expense category created successfully',
          timer: 1500,
          customClass: {
            confirmButton: 'btn btn-sm btn-primary'
          },
          buttonsStyling: false
        }).then(() => {
          this.router.navigate(['/pages/expense_categories']);
        });
      },
      error: (err) => {
        console.error('Failed to create role:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to create expense category',
          customClass: {
            confirmButton: 'btn btn-sm btn-primary'
          },
          buttonsStyling: false
        })
      }
    });
  }

  onCancel(): void{
    this.router.navigate(['/pages/expense_categories']);
  }
}
