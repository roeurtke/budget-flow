import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExpenseService } from '../../../services/expense.service';
import { ExpenseCategoryService } from '../../../services/expense-category.service';
import { ExpenseCategory } from '../../../interfaces/fetch-data.interface';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-expense-update',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './update.component.html',
  styleUrl: './update.component.css'
})
export class UpdateComponent {
  updateForm: FormGroup;
  expenseId: string | null = null;
  expenseCategories: { value: number; label: string }[] = [];
  statuses: { value: boolean; label: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private expenseCategoryService: ExpenseCategoryService,
    private route: ActivatedRoute,
    private router: Router) {
    this.updateForm = this.fb.group({
      date: [''],
      name: ['',],
      description: [''],
      spent_amount: [''],
      expense_category: [''],
      status: ['']
    });
  }

  ngOnInit(): void {
    this.initStatuses();
    this.expenseId = this.route.snapshot.paramMap.get('id');
    if (this.expenseId) {
      this.loadExpenseAndCategories(this.expenseId);
    }
  }

  initStatuses(): void {
    this.statuses = [
      { value: true, label: 'Active' },
      { value: false, label: 'Inactive' }
    ];
  }

  loadExpenseAndCategories(expenseId: string): void {
    forkJoin({
      expenseCategories: this.expenseCategoryService.getExpenseCategories(),
      expense: this.expenseService.getExpenseById(expenseId)
    }).subscribe({
      next: ({ expenseCategories, expense }) => {
        this.expenseCategories = expenseCategories.map((expense_category: ExpenseCategory) => ({
          value: expense_category.id,
          label: expense_category.name
        }));
        const matchedExpenseCategory = this.expenseCategories.find(ic => ic.value === expense.expense_category.id);
        this.updateForm.patchValue({
          date: expense.date,
          name: expense.name,
          description: expense.description,
          spent_amount: expense.spent_amount,
          expense_category: matchedExpenseCategory ? matchedExpenseCategory.value : null,
          status: expense.status
        });
      },
      error: (err) => console.error('Failed to load expense or expense categories:', err)
    });
  }

  updateExpense(): void {
    if (this.updateForm.invalid) {
      this.updateForm.markAllAsTouched();
      return;
    }

    const expenseData = this.updateForm.value;
    this.expenseService.updateExpense(Number(this.expenseId), expenseData).subscribe({
      next: () => {
        this.router.navigate(['/pages/expenses']);
      },
      error: (error) => {
        console.error('Error updating expense:', error);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/pages/expenses']);
  }
}
