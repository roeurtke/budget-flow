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