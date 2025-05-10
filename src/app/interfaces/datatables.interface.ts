import { Config } from 'datatables.net';
export interface CustomDataTablesConfig extends Config {
  buttons?: any[]; // Use specific button types if available
  pagingType?: string;
  data?: any[];
  language?: {
    lengthMenu?: string;
    paginate?: {
      previous?: string;
      next?: string;
    };
  };
}