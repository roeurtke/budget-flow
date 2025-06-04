import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IncomeCategoryService } from '../../../services/income-category.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-income-category-update',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './update.component.html',
  styleUrl: './update.component.css'
})
export class UpdateComponent {
  updateForm: FormGroup;
  incomeCategoryId: string | null = null;
  statuses: { value: boolean; label: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private incomeCategoryService: IncomeCategoryService,
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
    this.incomeCategoryId = this.route.snapshot.paramMap.get('id');
    if (this.incomeCategoryId) {
      this.loadIncomeCategory(this.incomeCategoryId);
    }
  }

  initStatuses(): void {
    this.statuses = [
      { value: true, label: 'Active' },
      { value: false, label: 'Inactive' }
    ];
  }

  loadIncomeCategory(incomeCategoryId: string): void {
    this.incomeCategoryService.getIncomeCategoryById(incomeCategoryId).subscribe({
      next: (incomeCategory) => {
        this.updateForm.patchValue({
          name: incomeCategory.name,
          description: incomeCategory.description,
          status: incomeCategory.status
        });
      },
      error: (error) => {
        console.error('Error loading income category:', error);
      }
    });
  }

  updateIncomeCategory(): void {
    if (this.updateForm.invalid) {
      this.updateForm.markAllAsTouched();
      return;
    }

    const incomeCategoryData = this.updateForm.value;
    this.incomeCategoryService.updateIncomeCategory(Number(this.incomeCategoryId), incomeCategoryData).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Income category updated successfully',
          timer: 1500,
          customClass: {
            confirmButton: 'btn btn-sm btn-primary'
          },
          buttonsStyling: false
        }).then(() => {
          this.router.navigate(['/pages/income_categories']);
        });
      },
      error: (error) => {
        console.error('Error updating income category:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to update income category',
          customClass: {
            confirmButton: 'btn btn-sm btn-primary'
          },
          buttonsStyling: false
        });
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/pages/income_categories']);
  }
}
