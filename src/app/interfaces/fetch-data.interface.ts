export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    spending_limit: number;
    role: {
        id: number;
        name: string;
    };
    status: boolean;
    created_at: string;
    updated_at: string;
}

export interface Role {
    id: number;
    name: string;
    description: string;
    status: boolean;
    created_at: string;
    updated_at: string;
}

export interface Permission {
    id: number;
    name: string;
    codename: string;
    description: string;
    status: boolean;
    created_at: string;
    updated_at: string;
}

export interface RolePermission {
    id: number;
    role: {
        id: number;
        name: string;
        description: string;
    };
    permission: {
        id: number;
        name: string;
        codename: string;
        description: string;
    };
    status: boolean;
    created_at: string;
    updated_at: string;
}

export interface RoleWithPermissionCount extends Role {
    id: number;
    name: string;
    description: string;
    status: boolean;
    permission_count: number;
    created_at: string;
    updated_at: string;
}

export interface Income {
    id: number;
    date: string;
    name: string;
    description: string;
    income_amount: number;
    currency: string;
    income_category: {
        id: number;
        name: string;
    }
    status: boolean;
    user: {
        id: number;
        username: string;
    }
}

export interface Expense {
    id: number;
    date: string;
    name: string;
    description: string;
    spent_amount: number;
    currency: string;
    expense_category: {
        id: number;
        name: string;
    }
    status: boolean;
    user: {
        id: number;
        username: string;
    }
}

export interface IncomeCategory {
    id: number;
    name: string;
    description: string;
    master_report: string;
    status: boolean;
    user: {
        id: number;
        username: string;
    }
}

export interface ExpenseCategory {
    id: number;
    name: string;
    description: string;
    master_report: string;
    status: boolean;
    user: {
        id: number;
        username: string;
    }
}

export interface CreateRolePermission {
  role_id: number;
  permission_id: number;
//   status: boolean;
}