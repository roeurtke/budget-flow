import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create',
  imports: [],
  templateUrl: './create.component.html',
  styleUrl: './create.component.css'
})
export class CreateComponent {
  constructor(private router: Router) {}

  onCancel(): void {
    this.router.navigate(['/pages/users']);
  }
}
