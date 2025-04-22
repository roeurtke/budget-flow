import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  handleLogin() {
    const usernameInput = document.getElementById('username') as HTMLInputElement | null;
    const passwordInput = document.getElementById('password') as HTMLInputElement | null;
    
    const username = usernameInput?.value;
    const password = passwordInput?.value;
    if (username && password) {
        alert('Login successful!');
    } else {
        alert('Please fill in all fields.');
    }
}
}
