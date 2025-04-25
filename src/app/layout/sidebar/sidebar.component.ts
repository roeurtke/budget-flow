import { Component, OnInit } from '@angular/core';
import { Router, RouterLink,RouterLinkActive } from '@angular/router';
import { TopToggleSidebarDirective } from '../../shared/directives/top-toggle-sidebar.directive';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, TopToggleSidebarDirective],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
  navItems = [
    {
      icon: 'fas fa-fw fa-tachometer-alt',
      label: 'Dashboard',
      link: '/dashboard'
    },
    {
      icon: 'fas fa-fw fa-suitcase',
      label: 'Cash Flow',
      subItems: [
        { label: 'Income', link: '/pages/incomes' },
        { label: 'Expense', link: '/pages/expenses' },
        { label: 'Income Category', link: '/pages/income_categories' },
        { label: 'Expense Category', link: '/pages/expense_categories' }
      ],
      collapsed: false
    },
    {
      icon: 'fas fa-fw fa-cog',
      label: 'Setting',
      subItems: [
        { label: 'User', link: '/pages/users' },
        { label: 'Role', link: '/pages/roles' },
        { label: 'Permission', link: '/pages/permissions' }
      ],
      collapsed: false
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.setInitialCollapseState();
  }

  setInitialCollapseState() {
    const currentUrl = this.router.url;
    this.navItems.forEach(item => {
      if (item.subItems) {
        item.collapsed = !item.subItems.some(subItem => currentUrl.includes(subItem.link));
      }
    });
  }

  toggleCollapse(item: any) {
    if (!item) {
      this.navItems.forEach(navItem => navItem.collapsed = true);
      return;
    }
  
    this.navItems.forEach(navItem => {
      if (navItem !== item) {
        navItem.collapsed = true;
      }
    });

    item.collapsed = !item.collapsed;
  }

  // toggleSidebar(): void {
  //   const body = document.body;
  //   const sidebar = document.querySelector('.sidebar');
  
  //   // Toggle the sidebar-toggled class on the body
  //   body.classList.toggle('sidebar-toggled');
  //   sidebar?.classList.toggle('toggled');
  
  //   // Collapse all expanded menu items when the sidebar is toggled
  //   if (body.classList.contains('sidebar-toggled')) {
  //     this.navItems.forEach(item => {
  //       item.collapsed = true; // Collapse all items
  //     });
  //   }
  // }
}