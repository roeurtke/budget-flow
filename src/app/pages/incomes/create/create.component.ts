import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

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
    private router: Router ){
      this.createForm = this.fb.group({
        date: ['', Validators.required],
        name: ['', Validators.required],
        description: ['', Validators.required],
        income_amount: ['', Validators.required],
        income_category: ['', Validators.required],
      });
  }

  onCancel(): void{
    this.router.navigate(['/pages/incomes']);
  }
}
