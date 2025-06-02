import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ToggleSidebarDirective } from '../../shared/directives/toggle-sidebar.directive';
import { PermissionService } from '../../services/permission.service';
import { PermissionCode } from '../../shared/permissions/permissions.constants';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';

interface NavItem {
  icon: string;
  label: string;
  link?: string;
  subItems?: NavSubItem[];
  collapsed?: boolean;
  permission?: Observable<boolean>;
}

interface NavSubItem {
  label: string;
  link: string;
  permission: Observable<boolean>;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, ToggleSidebarDirective, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
  navItems: NavItem[] = [];

  constructor(
    private router: Router,
    private permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.initializeNavItems();
    this.setInitialCollapseState();
  }

  private initializeNavItems() {
    this.navItems = [
      {
        icon: 'fas fa-fw fa-tachometer-alt',
        label: 'Dashboard',
        link: '/dashboard',
        permission: this.permissionService.canViewDashboard()
      },
      {
        icon: 'fas fa-fw fa-suitcase',
        label: 'Cash Flow',
        subItems: [
          { 
            label: 'Income', 
            link: '/pages/incomes',
            permission: this.permissionService.canViewIncomeList()
          },
          { 
            label: 'Expense', 
            link: '/pages/expenses',
            permission: this.permissionService.canViewExpenseList()
          },
          { 
            label: 'Income Category', 
            link: '/pages/income_categories',
            permission: this.permissionService.canViewIncomeCategoryList()
          },
          { 
            label: 'Expense Category', 
            link: '/pages/expense_categories',
            permission: this.permissionService.canViewExpenseCategoryList()
          },
          { 
            label: 'Report', 
            link: '/pages/reports',
            permission: this.permissionService.canViewReportList()
          }
        ],
        collapsed: false,
        permission: this.permissionService.hasAnyPermission([
          PermissionCode.CAN_VIEW_LIST_INCOME,
          PermissionCode.CAN_VIEW_LIST_EXPENSE,
          PermissionCode.CAN_VIEW_LIST_INCOME_CATEGORY,
          PermissionCode.CAN_VIEW_LIST_EXPENSE_CATEGORY,
          PermissionCode.CAN_VIEW_REPORT
        ])
      },
      {
        icon: 'fas fa-fw fa-cog',
        label: 'Setting',
        subItems: [
          { 
            label: 'User', 
            link: '/pages/users',
            permission: this.permissionService.canViewUserList()
          },
          { 
            label: 'Role', 
            link: '/pages/roles',
            permission: this.permissionService.canViewRoleList()
          },
          { 
            label: 'Permission', 
            link: '/pages/permissions',
            permission: this.permissionService.canViewPermissionList()
          },
          { 
            label: 'Ability', 
            link: '/pages/abilities',
            permission: this.permissionService.canViewAbilityList()
          }
        ],
        collapsed: false,
        permission: this.permissionService.hasAnyPermission([
          PermissionCode.CAN_VIEW_LIST_USER,
          PermissionCode.CAN_VIEW_LIST_ROLE,
          PermissionCode.CAN_VIEW_LIST_PERMISSION,
          PermissionCode.CAN_VIEW_LIST_ROLE_PERMISSION
        ])
      }
    ];
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
}