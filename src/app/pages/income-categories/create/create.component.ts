import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IncomeCategoryService } from '../../../services/income-category.service';
import Swal from 'sweetalert2';

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
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Income category created successfully',
          timer: 1500,
          customClass: {
            confirmButton: 'btn btn-sm btn-primary'
          },
          buttonsStyling: false
        }).then(() => {
          this.router.navigate(['/pages/income_categories']);
        });
      },
      error: (err) => {
        console.error('Failed to create role:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to create income category',
          customClass: {
            confirmButton: 'btn btn-sm btn-primary'
          },
          buttonsStyling: false
        })
      }
    });
  }

  onCancel(): void{
    this.router.navigate(['/pages/income_categories']);
  }
}
