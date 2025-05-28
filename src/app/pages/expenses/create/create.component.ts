import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

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
    private router: Router ){
      this.createForm = this.fb.group({
        date: ['', Validators.required],
        name: ['', Validators.required],
        description: ['', Validators.required],
        spent_amount: ['', Validators.required],
        expense_category: ['', Validators.required],
      });
  }

  onCancel(): void{
    this.router.navigate(['/pages/expenses']);
  }
}
