import { CustomDataTablesConfig } from '../../interfaces/datatables.interface';

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
  data: [],
  pagingType: 'simple_numbers',
  language: {
    lengthMenu: 'Show _MENU_ Entries',
    paginate: {
      previous: 'Previous',
      next: 'Next',
    },
  },
};