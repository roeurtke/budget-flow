import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {Router } from '@angular/router';

@Component({
  selector: 'app-permission-detail',
  imports: [],
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.css'
})
export class DetailComponent {
  
  constructor(private router: Router) {}
  onCancel(): void {
    this.router.navigate(['/pages/permissions']);
  }
}
