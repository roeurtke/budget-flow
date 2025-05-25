import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6 text-center">
          <h1 class="display-4">401</h1>
          <h2>Unauthorized Access</h2>
          <p class="lead">You don't have permission to access this page.</p>
          <button class="btn btn-primary" routerLink="/dashboard">Back to Dashboard</button>
        </div>
      </div>
    </div>
  `
})
export class UnauthorizedComponent {}