import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { User } from '../../interfaces/fetch-data.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-users',
  imports: [CommonModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  loading = false;
  error: string | null = null;

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.loading = true;
    this.userService.getUserList().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }

  onCreate(event: Event): void {
    event.preventDefault(); // Prevent default anchor behavior
    // Implement navigation or modal for creating a new user
    console.log('Create user clicked');
  }

  onEdit(user: User): void {
    // Implement edit functionality (e.g., open a modal or navigate to edit page)
    console.log('Edit user:', user);
  }

  onDelete(user: User): void {
    // Implement delete functionality (e.g., confirm dialog and API call)
    console.log('Delete user:', user);
  }
}
