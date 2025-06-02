export enum PermissionCode {
  // User
  CAN_CREATE_USER    = 'can_create_user',
  CAN_VIEW_LIST_USER = 'can_view_list_user',
  CAN_VIEW_USER      = 'can_view_user',
  CAN_UPDATE_USER    = 'can_update_user',
  CAN_DELETE_USER    = 'can_delete_user',

  // Role
  CAN_CREATE_ROLE    = 'can_create_role',
  CAN_VIEW_LIST_ROLE = 'can_view_list_role',
  CAN_VIEW_ROLE      = 'can_view_role',
  CAN_UPDATE_ROLE    = 'can_update_role',
  CAN_DELETE_ROLE    = 'can_delete_role',

  // Permission
  CAN_CREATE_PERMISSION    = 'can_create_permission',
  CAN_VIEW_LIST_PERMISSION = 'can_view_list_permission',
  CAN_VIEW_PERMISSION      = 'can_view_permission',
  CAN_UPDATE_PERMISSION    = 'can_update_permission',
  CAN_DELETE_PERMISSION    = 'can_delete_permission',

  // Ability
  CAN_CREATE_ROLE_PERMISSION    = 'can_create_role_permission',
  CAN_VIEW_LIST_ROLE_PERMISSION = 'can_view_list_role_permission',
  CAN_VIEW_ROLE_PERMISSION      = 'can_view_role_permission',
  CAN_UPDATE_ROLE_PERMISSION    = 'can_update_role_permission',
  CAN_DELETE_ROLE_PERMISSION    = 'can_delete_role_permission',

  // Income
  CAN_CREATE_INCOME    = 'can_create_income',
  CAN_VIEW_LIST_INCOME = 'can_view_list_income',
  CAN_VIEW_INCOME      = 'can_view_income',
  CAN_UPDATE_INCOME    = 'can_update_income',
  CAN_DELETE_INCOME    = 'can_delete_income',

  // Expense
  CAN_CREATE_EXPENSE    = 'can_create_expense',
  CAN_VIEW_LIST_EXPENSE = 'can_view_list_expense',
  CAN_VIEW_EXPENSE      = 'can_view_expense',
  CAN_UPDATE_EXPENSE    = 'can_update_expense',
  CAN_DELETE_EXPENSE    = 'can_delete_expense',

  // Income Category
  CAN_CREATE_INCOME_CATEGORY    = 'can_create_income_category',
  CAN_VIEW_LIST_INCOME_CATEGORY = 'can_view_list_income_category',
  CAN_VIEW_INCOME_CATEGORY      = 'can_view_income_category',
  CAN_UPDATE_INCOME_CATEGORY    = 'can_update_income_category',
  CAN_DELETE_INCOME_CATEGORY    = 'can_delete_income_category',

  // Expense Category
  CAN_CREATE_EXPENSE_CATEGORY    = 'can_create_expense_category',
  CAN_VIEW_LIST_EXPENSE_CATEGORY = 'can_view_list_expense_category',
  CAN_VIEW_EXPENSE_CATEGORY      = 'can_view_expense_category',
  CAN_UPDATE_EXPENSE_CATEGORY    = 'can_update_expense_category',
  CAN_DELETE_EXPENSE_CATEGORY    = 'can_delete_expense_category',

  // Report
  CAN_VIEW_REPORT = 'can_view_report',
}

export const PermissionMap = {
  user: {
    create: PermissionCode.CAN_CREATE_USER,
    list: PermissionCode.CAN_VIEW_LIST_USER,
    view: PermissionCode.CAN_VIEW_USER,
    update: PermissionCode.CAN_UPDATE_USER,
    delete: PermissionCode.CAN_DELETE_USER,
  },
  role: {
    create: PermissionCode.CAN_CREATE_ROLE,
    list: PermissionCode.CAN_VIEW_LIST_ROLE,
    view: PermissionCode.CAN_VIEW_ROLE,
    update: PermissionCode.CAN_UPDATE_ROLE,
    delete: PermissionCode.CAN_DELETE_ROLE,
  },
  permission: {
    create: PermissionCode.CAN_CREATE_PERMISSION,
    list: PermissionCode.CAN_VIEW_LIST_PERMISSION,
    view: PermissionCode.CAN_VIEW_PERMISSION,
    update: PermissionCode.CAN_UPDATE_PERMISSION,
    delete: PermissionCode.CAN_DELETE_PERMISSION,
  },
  ability: {
    create: PermissionCode.CAN_CREATE_ROLE_PERMISSION,
    list: PermissionCode.CAN_VIEW_LIST_ROLE_PERMISSION,
    view: PermissionCode.CAN_VIEW_ROLE_PERMISSION,
    update: PermissionCode.CAN_UPDATE_ROLE_PERMISSION,
    delete: PermissionCode.CAN_DELETE_ROLE_PERMISSION,
  },
  income: {
    create: PermissionCode.CAN_CREATE_INCOME,
    list: PermissionCode.CAN_VIEW_LIST_INCOME,
    view: PermissionCode.CAN_VIEW_INCOME,
    update: PermissionCode.CAN_UPDATE_INCOME,
    delete: PermissionCode.CAN_DELETE_INCOME,
  },
  expense: {
    create: PermissionCode.CAN_CREATE_EXPENSE,
    list: PermissionCode.CAN_VIEW_LIST_EXPENSE,
    view: PermissionCode.CAN_VIEW_EXPENSE,
    update: PermissionCode.CAN_UPDATE_EXPENSE,
    delete: PermissionCode.CAN_DELETE_EXPENSE,
  },
  incomeCategory: {
    create: PermissionCode.CAN_CREATE_INCOME_CATEGORY,
    list: PermissionCode.CAN_VIEW_LIST_INCOME_CATEGORY,
    view: PermissionCode.CAN_VIEW_INCOME_CATEGORY,
    update: PermissionCode.CAN_UPDATE_INCOME_CATEGORY,
    delete: PermissionCode.CAN_DELETE_INCOME_CATEGORY,
  },
  expenseCategory: {
    create: PermissionCode.CAN_CREATE_EXPENSE_CATEGORY,
    list: PermissionCode.CAN_VIEW_LIST_EXPENSE_CATEGORY,
    view: PermissionCode.CAN_VIEW_EXPENSE_CATEGORY,
    update: PermissionCode.CAN_UPDATE_EXPENSE_CATEGORY,
    delete: PermissionCode.CAN_DELETE_EXPENSE_CATEGORY,
  },
  report: {
    list: PermissionCode.CAN_VIEW_REPORT,
  },
};
