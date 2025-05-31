import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ExpenseService } from '../../../services/expense.service';
import { ExpenseCategoryService } from '../../../services/expense-category.service';

@Component({
  selector: 'app-expense-create',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create.component.html',
  styleUrl: './create.component.css'
})
export class CreateComponent {
  createForm: FormGroup;
  expense_categories: { value: number; label: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private expenseCategoryService: ExpenseCategoryService,
    private router: Router ){
      this.createForm = this.fb.group({
        date: ['', Validators.required],
        name: ['', Validators.required],
        description: [''],
        spent_amount: ['', Validators.required],
        expense_category: ['', Validators.required],
      });
  }

  ngOnInit(): void {
    this.loadExpenseCategories();
  }

  loadExpenseCategories(): void {
    this.expenseCategoryService.getExpenseCategories().subscribe({
      next: (response) => {
        this.expense_categories = response.map((expense_category: any) => ({
          value: expense_category.id,
          label: expense_category.name
        }));
      },
      error: (err) => {
        console.error('Failed to load expense_categories: ', err);
      }
    });
  }

  createExpense(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const expenseData = this.createForm.value;
    // console.log('Income creating data: ', expenseData)
    this.expenseService.createExpense(expenseData).subscribe({
      next: () => {
        this.router.navigate(['/pages/expenses']);
      },
      error: (err) => {
        console.error('Failed to create income: ', err);
      }
    });
  }

  onCancel(): void{
    this.router.navigate(['/pages/expenses']);
  }
}
