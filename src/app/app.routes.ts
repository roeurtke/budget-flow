import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { PermissionGuard } from './guards/permission.guard';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { MainComponent } from './layout/main/main.component';
import { DashboardComponent } from './layout/dashboard/dashboard.component';
import { IncomesComponent } from './pages/incomes/list/incomes.component';
import { CreateComponent as IncomeCreateComponent } from './pages/incomes/create/create.component';
import { DetailComponent as IncomeDetailComponent } from './pages/incomes/detail/detail.component';
import { UpdateComponent as IncomeUpdateComponent } from './pages/incomes/update/update.component';
import { IncomeCategoriesComponent } from './pages/income-categories/list/income-categories.component';
import { CreateComponent as IncomeCategoryCreateComponent } from './pages/income-categories/create/create.component';
import { DetailComponent as IncomeCategoryDetailComponent } from './pages/income-categories/detail/detail.component';
import { UpdateComponent as IncomeCategoryUpdateComponent } from './pages/income-categories/update/update.component';
import { ExpensesComponent } from './pages/expenses/list/expenses.component';
import { CreateComponent as ExpenseCreateComponent } from './pages/expenses/create/create.component';
import { DetailComponent as  ExpenseDetailComponent} from './pages/expenses/detail/detail.component';
import { UpdateComponent as ExpenseUpdateComponent } from './pages/expenses/update/update.component';
import { ExpenseCategoriesComponent } from './pages/expense-categories/list/expense-categories.component';
import { CreateComponent as ExpenseCategoryCreateComponent} from './pages/expense-categories/create/create.component';
import { DetailComponent as ExpenseCategoryDetailComponent } from './pages/expense-categories/detail/detail.component';
import { UpdateComponent as ExpenseCategoryUpdateComponent } from './pages/expense-categories/update/update.component';
import { ReportsComponent } from './pages/reports/list/reports.component';
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
import { CreateComponent as AbilitiesCreateComponent } from './pages/abilities/create/create.component';
import { DetailComponent as AbilitiesDetailComponent } from './pages/abilities/detail/detail.component';
import { UpdateComponent as AbilitiesUpdateComponent } from './pages/abilities/update/update.component';
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';
import { UnauthorizedComponent } from './pages/unauthorized/unauthorized.component';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    {
        path: '',
        component: MainComponent,
        canActivate: [authGuard],
        children: [
          { path: 'dashboard', component: DashboardComponent },
          // Income Management Routes
          { path: 'pages/incomes', canActivate: [PermissionGuard], data: { permission: 'can_view_list_income' }, component: IncomesComponent },
          { path: 'pages/incomes/create', canActivate: [PermissionGuard], data: { permission: 'can_create_income' }, component: IncomeCreateComponent },
          { path: 'pages/incomes/detail/:id', canActivate: [PermissionGuard], data: { permission: 'can_view_income' }, component: IncomeDetailComponent },
          { path: 'pages/incomes/update/:id', canActivate: [PermissionGuard], data: { permission: 'can_update_income' }, component: IncomeUpdateComponent },
          { path: 'pages/incomes/delete/:id', canActivate: [PermissionGuard], data: { permission: 'can_delete_income' }, component: IncomesComponent },

          // Expense Management Routes
          { path: 'pages/expenses', canActivate: [PermissionGuard], data: { permission: 'can_view_list_expense' }, component: ExpensesComponent },
          { path: 'pages/expenses/create', canActivate: [PermissionGuard], data: { permission: 'can_create_expense' }, component: ExpenseCreateComponent },
          { path: 'pages/expenses/detail/:id', canActivate: [PermissionGuard], data: { permission: 'can_view_expense' }, component: ExpenseDetailComponent },
          { path: 'pages/expenses/update/:id', canActivate: [PermissionGuard], data: { permission: 'can_update_expense' }, component: ExpenseUpdateComponent },
          { path: 'pages/expenses/delete/:id', canActivate: [PermissionGuard], data: { permission: 'can_delete_expense' }, component: ExpensesComponent },

          // Income Category Management Routes
          { path: 'pages/income_categories', canActivate: [PermissionGuard], data: { permission: 'can_view_list_income_category' }, component: IncomeCategoriesComponent },
          { path: 'pages/income_categories/create', canActivate: [PermissionGuard], data: { permission: 'can_create_income_category' }, component: IncomeCategoryCreateComponent },
          { path: 'pages/income_categories/detail/:id', canActivate: [PermissionGuard], data: { permission: 'can_view_income_category' }, component: IncomeCategoryDetailComponent },
          { path: 'pages/income_categories/update/:id', canActivate: [PermissionGuard], data: { permission: 'can_update_income_category' }, component: IncomeCategoryUpdateComponent },
          { path: 'pages/income_categories/delete/:id', canActivate: [PermissionGuard], data: { permission: 'can_delete_income_category' }, component: IncomeCategoriesComponent },

          // Expense Category Management Routes
          { path: 'pages/expense_categories', canActivate: [PermissionGuard], data: { permission: 'can_view_list_expense_category' }, component: ExpenseCategoriesComponent },
          { path: 'pages/expense_categories/create', canActivate: [PermissionGuard], data: { permission: 'can_create_expense_category' }, component: ExpenseCategoryCreateComponent },
          { path: 'pages/expense_categories/detail/:id', canActivate: [PermissionGuard], data: { permission: 'can_view_expense_category' }, component: ExpenseCategoryDetailComponent },
          { path: 'pages/expense_categories/update/:id', canActivate: [PermissionGuard], data: { permission: 'can_update_expense_category' }, component: ExpenseCategoryUpdateComponent },
          { path: 'pages/expense_categories/delete/:id', canActivate: [PermissionGuard], data: { permission: 'can_delete_expense_category' }, component: ExpenseCategoriesComponent },

          // Report Management Routes
          { path: 'pages/reports', canActivate: [PermissionGuard], data: { permission: 'can_view_report' }, component: ReportsComponent },

          // User Management Routes
          { path: 'pages/users', canActivate: [PermissionGuard], data: { permission: 'can_view_list_user' }, component: UsersComponent },
          { path: 'pages/users/create', canActivate: [PermissionGuard], data: { permission: 'can_create_user' }, component: UserCreateComponent },
          { path: 'pages/users/detail/:id', canActivate: [PermissionGuard], data: { permission: 'can_view_user' }, component: UserDetailComponent },
          { path: 'pages/users/password/:id', canActivate: [PermissionGuard], data: { permission: 'can_update_user' }, component: UserPasswordComponent },
          { path: 'pages/users/update/:id', canActivate: [PermissionGuard], data: { permission: 'can_update_user' }, component: UserUpdateComponent },
          { path: 'pages/users/delete/:id', canActivate: [PermissionGuard], data: { permission: 'can_delete_user' }, component: UsersComponent },

          // Role Management Routes
          { path: 'pages/roles', canActivate: [PermissionGuard], data: { permission: 'can_view_list_role' }, component: RolesComponent },
          { path: 'pages/roles/create', canActivate: [PermissionGuard], data: { permission: 'can_create_role' }, component: RoleCreateComponent },
          { path: 'pages/roles/detail/:id', canActivate: [PermissionGuard], data: { permission: 'can_view_role' }, component: RoleDetailComponent },
          { path: 'pages/roles/update/:id', canActivate: [PermissionGuard], data: { permission: 'can_update_role' }, component: RoleUpdateComponent },
          { path: 'pages/roles/delete/:id', canActivate: [PermissionGuard], data: { permission: 'can_delete_role' }, component: RolesComponent },

          // Permission Management Routes
          { path: 'pages/permissions', canActivate: [PermissionGuard], data: { permission: 'can_view_list_permission' }, component: PermissionsComponent },
          { path: 'pages/permissions/create', canActivate: [PermissionGuard], data: { permission: 'can_create_permission' }, component: PermissionCreateComponent },
          { path: 'pages/permissions/detail/:id', canActivate: [PermissionGuard], data: { permission: 'can_view_permission' }, component: PermissionDetailComponent },
          { path: 'pages/permissions/update/:id', canActivate: [PermissionGuard], data: { permission: 'can_update_permission' }, component: PermissionUpdateComponent },
          { path: 'pages/permissions/delete/:id', canActivate: [PermissionGuard], data: { permission: 'can_delete_permission' }, component: PermissionsComponent },

          // Ability Management Routes
          { path: 'pages/abilities', canActivate: [PermissionGuard], data: { permission: 'can_view_list_role_permission' }, component: AbilitiesComponent },
          { path: 'pages/abilities/create', canActivate: [PermissionGuard], data: { permission: 'can_create_role_permission' }, component: AbilitiesCreateComponent },
          { path: 'pages/abilities/detail/:id', canActivate: [PermissionGuard], data: { permission: 'can_view_role_permission' }, component: AbilitiesDetailComponent },
          { path: 'pages/abilities/update/:id', canActivate: [PermissionGuard], data: { permission: 'can_update_role_permission' }, component: AbilitiesUpdateComponent },
          { path: 'pages/abilities/delete/:id', canActivate: [PermissionGuard], data: { permission: 'can_delete_role_permission' }, component: AbilitiesComponent },
        ]
    },
    { path: 'unauthorized', component: UnauthorizedComponent },
    { path: '**', component: PageNotFoundComponent }
];
