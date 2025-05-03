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
    created_at: string;
    updated_at: string;
}

export interface DataTablesCallback {
    data: any[];
    draw?: number;
    recordsTotal: number;
    recordsFiltered: number;
    error?: string;
}

export interface DataTablesRequest {
    draw: number;
    start: number;
    length: number;
    search: {
      value: string;
      regex: boolean;
    };
    order: Array<{
      column: number;
      dir: 'asc' | 'desc';
    }>;
    columns: Array<{
      data: string;
      name: string;
      searchable: boolean;
      orderable: boolean;
      search: {
        value: string;
        regex: boolean;
      };
    }>;
}
  
export interface DataTablesResponse {
    draw: number;
    recordsTotal: number;
    recordsFiltered: number;
    data: any[];
}