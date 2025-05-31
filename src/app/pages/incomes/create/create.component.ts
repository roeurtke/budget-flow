import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IncomeService } from '../../../services/income.service'
import { IncomeCategoryService } from '../../../services/income-category.service'

@Component({
  selector: 'app-income-create',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create.component.html',
  styleUrl: './create.component.css'
})
export class CreateComponent {
  createForm: FormGroup;
  income_categories: { value: number; label: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private incomeService: IncomeService,
    private incomeCategoryService: IncomeCategoryService,
    private router: Router ){
      this.createForm = this.fb.group({
        date: ['', Validators.required],
        name: ['', Validators.required],
        description: [''],
        income_amount: ['', Validators.required],
        income_category: ['', Validators.required],
      });
  }

  ngOnInit(): void {
    this.loadIncomeCategories();
  }

  loadIncomeCategories(): void {
    this.incomeCategoryService.getIncomeCategories().subscribe({
      next: (response) => {
        this.income_categories = response.map((income_category: any) => ({
          value: income_category.id,
          label: income_category.name
        }));
      },
      error: (err) => {
        console.error('Failed to load income_categories: ', err);
      }
    });
  }

  createIncome(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const incomeData = this.createForm.value;
    // console.log('Income creating data: ', incomeData)
    this.incomeService.createIncome(incomeData).subscribe({
      next: () => {
        this.router.navigate(['/pages/incomes']);
      },
      error: (err) => {
        console.error('Failed to create income: ', err);
      }
    });
  }

  onCancel(): void{
    this.router.navigate(['/pages/incomes']);
  }
}
