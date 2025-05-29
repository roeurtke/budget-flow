import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IncomeCategoryService } from '../../../services/income-category.service';

@Component({
  selector: 'app-income-category-create',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create.component.html',
  styleUrl: './create.component.css'
})
export class CreateComponent {
  createForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private incomeCategoryService: IncomeCategoryService,
    private router: Router ){
      this.createForm = this.fb.group({
        name: ['', Validators.required],
        description: [''],
      });
  }

  createIncomeCategory(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const incomeCategoryData = this.createForm.value;
    this.incomeCategoryService.createIncomeCategory(incomeCategoryData).subscribe({
      next: () => {
        this.router.navigate(['/pages/income_categories']);
      },
      error: (err) => {
        console.error('Failed to create role:', err);
      }
    });
  }

  onCancel(): void{
    this.router.navigate(['/pages/income_categories']);
  }
}
