import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { MainComponent } from './layout/main/main.component';
import { DashboardComponent } from './layout/dashboard/dashboard.component';
import { IncomesComponent } from './pages/incomes/incomes.component';
import { IncomeCategoriesComponent } from './pages/income-categories/income-categories.component';
import { ExpensesComponent } from './pages/expenses/expenses.component';
import { ExpenseCategoriesComponent } from './pages/expense-categories/expense-categories.component';
import { UsersComponent } from './pages/users/users.component';
import { RolesComponent } from './pages/roles/roles.component';
import { PermissionsComponent } from './pages/permissions/permissions.component';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    {
        path: '',
        component: MainComponent,
        children: [
          { path: 'layout/dashboard', component: DashboardComponent },
          { path: 'pages/incomes', component: IncomesComponent },
          { path: 'pages/expenses', component: ExpensesComponent },
          { path: 'pages/income_categories', component: IncomeCategoriesComponent },
          { path: 'pages/expense_categories', component: ExpenseCategoriesComponent },
          { path: 'pages/users', component: UsersComponent },
          { path: 'pages/roles', component: RolesComponent },
          { path: 'pages/permissions', component: PermissionsComponent }
        ]
    },
];
