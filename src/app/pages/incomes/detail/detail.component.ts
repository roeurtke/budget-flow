import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-income-detail',
  imports: [],
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.css'
})
export class DetailComponent {
  
  constructor(
    private router: Router ){

  }

  onCancel(): void{
    this.router.navigate(['/pages/incomes']);
  }
}
