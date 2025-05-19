import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { MainComponent } from './layout/main/main.component';
import { DashboardComponent } from './layout/dashboard/dashboard.component';
import { IncomesComponent } from './pages/incomes/list/incomes.component';
import { IncomeCategoriesComponent } from './pages/income-categories/list/income-categories.component';
import { ExpensesComponent } from './pages/expenses/list/expenses.component';
import { ExpenseCategoriesComponent } from './pages/expense-categories/list/expense-categories.component';
import { UsersComponent } from './pages/users/list/users.component';
import { DetailComponent as UserDetailComponent } from './pages/users/detail/detail.component';
import { CreateComponent as UserCreateComponent } from './pages/users/create/create.component';
import { PasswordComponent as UserPasswordComponent } from './pages/users/password/password.component';
import { UpdateComponent as UserUpdateComponent } from './pages/users/update/update.component';
import { RolesComponent } from './pages/roles/list/roles.component';
import { DetailComponent as RoleDetailComponent } from './pages/roles/detail/detail.component';
import { CreateComponent as RoleCreateComponent } from './pages/roles/create/create.component';
import { UpdateComponent as RoleUpdateComponent } from './pages/roles/update/update.component';
import { PermissionsComponent } from './pages/permissions/list/permissions.component';
import { CreateComponent as PermissionCreateComponent } from './pages/permissions/create/create.component';
import { DetailComponent as PermissionDetailComponent } from './pages/permissions/detail/detail.component';
import { UpdateComponent as PermissionUpdateComponent } from './pages/permissions/update/update.component';
import { AbilitiesComponent } from './pages/abilities/list/abilities.component';
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
          { path: 'pages/users/create', canActivate: [authGuard], component: UserCreateComponent },
          { path: 'pages/users/detail/:id', canActivate: [authGuard], component: UserDetailComponent },
          { path: 'pages/users/password/:id', canActivate: [authGuard], component: UserPasswordComponent },
          { path: 'pages/users/update/:id', canActivate: [authGuard], component: UserUpdateComponent },
          { path: 'pages/roles', canActivate: [authGuard], component: RolesComponent },
          { path: 'pages/roles/create', canActivate: [authGuard], component: RoleCreateComponent },
          { path: 'pages/roles/detail/:id', canActivate: [authGuard], component: RoleDetailComponent },
          { path: 'pages/roles/update/:id', canActivate: [authGuard], component: RoleUpdateComponent },
          { path: 'pages/permissions', canActivate: [authGuard], component: PermissionsComponent },
          { path: 'pages/permissions/create', canActivate: [authGuard], component: PermissionCreateComponent },
          { path: 'pages/permissions/detail/:id', canActivate: [authGuard], component: PermissionDetailComponent },
          { path: 'pages/permissions/update/:id', canActivate: [authGuard], component: PermissionUpdateComponent },
          { path: 'pages/abilities', canActivate: [authGuard], component: AbilitiesComponent }
        ]
    },
    { path: '**', component: PageNotFoundComponent }
];
