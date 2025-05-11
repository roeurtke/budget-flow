import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { MainComponent } from './layout/main/main.component';
import { DashboardComponent } from './layout/dashboard/dashboard.component';
import { IncomesComponent } from './pages/incomes/incomes.component';
import { IncomeCategoriesComponent } from './pages/income-categories/income-categories.component';
import { ExpensesComponent } from './pages/expenses/expenses.component';
import { ExpenseCategoriesComponent } from './pages/expense-categories/expense-categories.component';
import { UsersComponent } from './pages/users/users.component';
import { CreateComponent } from './pages/users/create/create.component';
import { RolesComponent } from './pages/roles/roles.component';
import { PermissionsComponent } from './pages/permissions/permissions.component';
import { AbilitiesComponent } from './pages/abilities/abilities.component';
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    {
        path: '',
        component: MainComponent,
        children: [
          { path: 'dashboard', canActivate: [authGuard], component: DashboardComponent },
          { path: 'pages/incomes', canActivate: [authGuard], component: IncomesComponent },
          { path: 'pages/expenses', canActivate: [authGuard], component: ExpensesComponent },
          { path: 'pages/income_categories', canActivate: [authGuard], component: IncomeCategoriesComponent },
          { path: 'pages/expense_categories', canActivate: [authGuard], component: ExpenseCategoriesComponent },
          { path: 'pages/users', canActivate: [authGuard], component: UsersComponent },
          { path: 'pages/users/create', canActivate: [authGuard], component: CreateComponent },
          { path: 'pages/roles', canActivate: [authGuard], component: RolesComponent },
          { path: 'pages/permissions', canActivate: [authGuard], component: PermissionsComponent },
          { path: 'pages/abilities', canActivate: [authGuard], component: AbilitiesComponent }
        ]
    },
    { path: '**', component: PageNotFoundComponent }
];
