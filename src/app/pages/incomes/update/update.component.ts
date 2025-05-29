import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IncomeService } from '../../../services/income.service';
import { IncomeCategoryService } from '../../../services/income-category.service';
import { IncomeCategory } from '../../../interfaces/fetch-data.interface';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-income-update',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './update.component.html',
  styleUrl: './update.component.css'
})
export class UpdateComponent {
  updateForm: FormGroup;
  incomeId: string | null = null;
  incomeCategories: { value: number; label: string }[] = [];
  statuses: { value: boolean; label: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private incomeService: IncomeService,
    private incomeCategoryService: IncomeCategoryService,
    private route: ActivatedRoute,
    private router: Router) {
    this.updateForm = this.fb.group({
      name: ['',],
      description: [''],
      income_amount: [''],
      income_category: [''],
      status: ['']
    });
  }

  ngOnInit(): void {
    this.initStatuses();
    this.incomeId = this.route.snapshot.paramMap.get('id');
    if (this.incomeId) {
      this.loadIncomeAndCategories(this.incomeId);
    }
  }

  initStatuses(): void {
    this.statuses = [
      { value: true, label: 'Active' },
      { value: false, label: 'Inactive' }
    ];
  }

  loadIncomeAndCategories(incomeId: string): void {
    forkJoin({
      incomeCategories: this.incomeCategoryService.getIcomeCategories(),
      income: this.incomeService.getIncomeById(incomeId)
    }).subscribe({
      next: ({ incomeCategories, income }) => {
        this.incomeCategories = incomeCategories.map((income_category: IncomeCategory) => ({
          value: income_category.id,
          label: income_category.name
        }));
        const matchedIncomeCategory = this.incomeCategories.find(ic => ic.value === income.income_category.id);
        this.updateForm.patchValue({
          name: income.name,
          description: income.description,
          income_amount: income.income_amount,
          income_category: matchedIncomeCategory ? matchedIncomeCategory.value : null,
          status: income.status
        });
      },
      error: (err) => console.error('Failed to load user or roles:', err)
    });
  }

  // updateRole(): void {
  //   if (this.updateForm.invalid) {
  //     this.updateForm.markAllAsTouched();
  //     return;
  //   }

  //   const roleData = this.updateForm.value;
  //   this.incomeService.updateRole(Number(this.roleId), roleData).subscribe({
  //     next: () => {
  //       this.router.navigate(['/pages/roles']);
  //     },
  //     error: (error) => {
  //       console.error('Error updating role:', error);
  //     }
  //   });
  // }

  onCancel(): void {
    this.router.navigate(['/pages/incomes']);
  }
}
