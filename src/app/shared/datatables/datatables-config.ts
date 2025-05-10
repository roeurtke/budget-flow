// src/app/shared/datatables-config.ts
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

export const dataTablesConfig: CustomDataTablesConfig = {
  buttons: [
    {
      extend: 'csv',
      text: 'CSV   |',
      className: 'btn btn-sm mx-1',
    },
    {
      extend: 'excel',
      text: 'EXCEL   |',
      className: 'btn btn-sm',
    },
    {
      extend: 'pdf',
      text: 'PDF',
      className: 'btn btn-sm',
    },
  ],
  pagingType: 'simple_numbers',
  data: [],
  language: {
    lengthMenu: 'Show _MENU_ Entries',
    paginate: {
      previous: 'Previous',
      next: 'Next',
    },
  },
};