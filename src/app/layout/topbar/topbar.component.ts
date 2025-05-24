import { Component, ElementRef, HostListener, Input } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ToggleSidebarDirective } from '../../shared/directives/toggle-sidebar.directive';
import { UserDetails } from '../../interfaces/auth.interface';

@Component({
  selector: 'app-topbar',
  imports: [ToggleSidebarDirective],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css'
})
export class TopbarComponent {
  @Input() userName: string = 'User Name';

  constructor(
    private authService: AuthService,
    private router: Router,
    private elementRef: ElementRef
  ) {}
  
  isDropdownOpen = false;

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe((user: UserDetails) => {
      this.userName = `${user.first_name} ${user.last_name}`.trim() || 'User Name';
    });
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside && this.isDropdownOpen) {
      this.isDropdownOpen = false;
    }
  }

  logout() {
    this.authService.logout();
  }
}
