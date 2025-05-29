import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ExpenseCategoryService } from '../../../services/expense-category.service';

@Component({
  selector: 'app-expense-category-update',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './update.component.html',
  styleUrl: './update.component.css'
})
export class UpdateComponent {
  updateForm: FormGroup;
  expenseCategoryId: string | null = null;
  statuses: { value: boolean; label: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private expenseCategoryService: ExpenseCategoryService,
    private route: ActivatedRoute,
    private router: Router) {
    this.updateForm = this.fb.group({
      name: ['',],
      description: [''],
      status: ['']
    });
  }

  ngOnInit(): void {
    this.initStatuses();
    this.expenseCategoryId = this.route.snapshot.paramMap.get('id');
    if (this.expenseCategoryId) {
      this.loadExpenseCategory(Number(this.expenseCategoryId));
    }
  }

  initStatuses(): void {
    this.statuses = [
      { value: true, label: 'Active' },
      { value: false, label: 'Inactive' }
    ];
  }

  loadExpenseCategory(expenseCategoryId: number): void {
    this.expenseCategoryService.getExpenseCategoryById(expenseCategoryId).subscribe({
      next: (expenseCategory) => {
        this.updateForm.patchValue({
          name: expenseCategory.name,
          description: expenseCategory.description,
          status: expenseCategory.status
        });
      },
      error: (error) => {
        console.error('Error loading expense category:', error);
      }
    });
  }

  updateExpenseCategory(): void {
    if (this.updateForm.invalid) {
      this.updateForm.markAllAsTouched();
      return;
    }

    const expenseCategoryData = this.updateForm.value;
    this.expenseCategoryService.updateExpenseCategory(Number(this.expenseCategoryId), expenseCategoryData).subscribe({
      next: () => {
        this.router.navigate(['/pages/expense_categories']);
      },
      error: (error) => {
        console.error('Error updating expense category:', error);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/pages/expense_categories']);
  }
}
