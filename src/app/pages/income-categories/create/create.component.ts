import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

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
    private router: Router ){
      this.createForm = this.fb.group({
        name: ['', Validators.required],
        description: ['', Validators.required],
      });
  }

  onCancel(): void{
    this.router.navigate(['/pages/income_categories']);
  }
}
