import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { DataTableDirective } from 'angular-datatables';
import { dataTablesConfig } from '../../../shared/datatables/datatables-config';
import { Subject } from 'rxjs';
import { format, parseISO } from 'date-fns';
import { ReportService } from '../../../services/report.service';
import { PermissionService } from '../../../services/permission.service';
import { PermissionCode } from '../../../shared/permissions/permissions.constants';
import { MonthlySummary } from '../../../interfaces/report.interface';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IncomeService } from '../../../services/income.service';
import { ExpenseService } from '../../../services/expense.service';

@Component({
  selector: 'app-reports',
  imports: [CommonModule, DataTablesModule, ReactiveFormsModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  @ViewChild(DataTableDirective, { static: false }) dtElement!: DataTableDirective;

  filterForm: FormGroup;
  financialSummary: MonthlySummary[] = [];
  filteredData: MonthlySummary[] = [];
  year: number = new Date().getFullYear();
  loading = false;
  error: string | null = null;
  totalIncome: number = 0;
  totalExpense: number = 0;

  canviewReport = false;

  dtOptions: any = {};
  dtTrigger: Subject<any> = new Subject<any>();

  availableDates: { start: string[], end: string[] } = { start: [], end: [] };

  constructor(
    private reportService: ReportService,
    private permissionService: PermissionService,
    private incomeService: IncomeService,
    private expenseService: ExpenseService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      start_date: [''],
      end_date: ['']
    });
  }

  ngOnInit(): void {
    this.loadAvailableDates();
    this.initializeDataTable();
    this.permissionService.hasPermission(PermissionCode.CAN_VIEW_REPORT).subscribe(has => this.canviewReport = has);
  }

  loadAvailableDates(): void {
    // Load income dates
    this.incomeService.getIncomes().subscribe({
      next: (incomes) => {
        const incomeDates = incomes.map(income => format(new Date(income.date), 'yyyy-MM-dd'));
        this.updateAvailableDates(incomeDates);
      },
      error: (err) => console.error('Error loading income dates:', err)
    });

    // Load expense dates
    this.expenseService.getExpenses().subscribe({
      next: (expenses) => {
        const expenseDates = expenses.map(expense => format(new Date(expense.date), 'yyyy-MM-dd'));
        this.updateAvailableDates(expenseDates);
      },
      error: (err) => console.error('Error loading expense dates:', err)
    });
  }

  private updateAvailableDates(newDates: string[]): void {
    // Combine existing dates with new dates and remove duplicates
    const allDates = [...new Set([...this.availableDates.start, ...newDates])]
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    // Update both start and end date arrays
    this.availableDates = {
      start: allDates,
      end: allDates
    };

    // Update the date input options
    this.updateDateInputs();
  }

  private updateDateInputs(): void {
    const startDateInput = document.getElementById('start_date') as HTMLInputElement;
    const endDateInput = document.getElementById('end_date') as HTMLInputElement;

    if (startDateInput && endDateInput) {
      // Set min and max dates for start date
      if (this.availableDates.start.length > 0) {
        startDateInput.min = this.availableDates.start[0];
        startDateInput.max = this.availableDates.start[this.availableDates.start.length - 1];
      }

      // Set min and max dates for end date
      if (this.availableDates.end.length > 0) {
        endDateInput.min = this.availableDates.end[0];
        endDateInput.max = this.availableDates.end[this.availableDates.end.length - 1];
      }
    }
  }

  applyFilter(): void {
    const startDate = this.filterForm.get('start_date')?.value;
    const endDate = this.filterForm.get('end_date')?.value;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      this.filteredData = this.financialSummary.filter(item => {
        const itemDate = new Date(this.year, item.month - 1, 1);
        return itemDate >= start && itemDate <= end;
      });

      // Update totals
      this.totalIncome = this.calculateTotalIncome(this.filteredData);
      this.totalExpense = this.calculateTotalExpense(this.filteredData);

      // Refresh the DataTable
      if (this.dtElement) {
        this.dtElement.dtInstance.then((dtInstance: any) => {
          dtInstance.clear();
          dtInstance.rows.add(this.filteredData);
          dtInstance.draw();
        });
      }
    } else {
      // If no dates selected, show all data
      this.filteredData = [...this.financialSummary];
      this.totalIncome = this.calculateTotalIncome(this.financialSummary);
      this.totalExpense = this.calculateTotalExpense(this.financialSummary);

      if (this.dtElement) {
        this.dtElement.dtInstance.then((dtInstance: any) => {
          dtInstance.clear();
          dtInstance.rows.add(this.financialSummary);
          dtInstance.draw();
        });
      }
    }
  }

  exportToExcel(): void {
    const data = this.filteredData.length > 0 ? this.filteredData : this.financialSummary;
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data.map(item => ({
      'Month': format(new Date(this.year, item.month - 1, 1), 'MMMM yyyy'),
      'Total Income': item.total_income,
      'Total Expense': item.total_expense,
      'Net Income': item.net_income
    })));

    const workbook: XLSX.WorkBook = { Sheets: { 'Financial Report': worksheet }, SheetNames: ['Financial Report'] };
    XLSX.writeFile(workbook, `financial_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  }

  printReport(): void {
    const data = this.filteredData.length > 0 ? this.filteredData : this.financialSummary;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('Financial Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${format(new Date(), 'dd-MM-yyyy')}`, 14, 22);

    // Add table
    const tableData = data.map(item => [
      format(new Date(this.year, item.month - 1, 1), 'MMMM yyyy'),
      item.total_income.toFixed(2),
      item.total_expense.toFixed(2),
      item.net_income.toFixed(2)
    ]);

    autoTable(doc, {
      head: [['Month', 'Total Income', 'Total Expense', 'Net Income']],
      body: tableData,
      startY: 30,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });

    // Add totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Total Income: ${this.totalIncome.toFixed(2)}`, 14, finalY);
    doc.text(`Total Expense: ${this.totalExpense.toFixed(2)}`, 14, finalY + 7);

    doc.save(`financial_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }

  // Calculate total income for all months
  calculateTotalIncome(data: any[]): number {
    return data.reduce((sum, item) => sum + (item.total_income || 0), 0);
  }

  // Calculate total expense for all months
  calculateTotalExpense(data: any[]): number {
    return data.reduce((sum, item) => sum + (item.total_expense || 0), 0);
  }

  initializeDataTable(): void {
    this.dtOptions = {
      ...dataTablesConfig,
      serverSide: false,
      processing: true,
      order: [[1, 'asc']],
      ajax: (dataTablesParameters: any, callback: any) => {
        this.loading = true;
        this.reportService.getFinancialSummaryForDataTables(dataTablesParameters).subscribe({
          next: (response) => {
            this.financialSummary = response.monthly_summary
              .filter((item: any) => item.total_income !== 0 || item.total_expense !== 0)
              .map((item: any) => ({
                ...item,
                year: response.year
              }));

            this.filteredData = [...this.financialSummary];
            
            // Calculate totals
            this.totalIncome = this.calculateTotalIncome(this.financialSummary);
            this.totalExpense = this.calculateTotalExpense(this.financialSummary);

            callback({
              recordsTotal: this.financialSummary.length,
              recordsFiltered: this.financialSummary.length,
              data: this.financialSummary
            });
            this.loading = false;
          },
          error: (err) => {
            this.error = err.message;
            callback({
              recordsTotal: 0,
              recordsFiltered: 0,
              data: []
            });
            this.loading = false;
          }
        });
      },
      columns: [
        { 
          data: null,
          title: 'ID',
          orderable: false,
          render: (data: any, type: any, row: any, meta: any) => type === 'display' ? meta.row + 1 : ''
        },
        {
          data: 'month',
          title: 'Month',
          render: (data: number, type: any, row: any) => {
            if (type === 'display' && data) {
              // Construct a date using the year from the response and the month data (subtract 1 as months are 0-indexed)
              const date = new Date(row.year, data - 1, 1); 
              return format(date, 'MMMM yyyy');
            } else if (data) {
               // For sorting or filtering, return a sortable string like 'YYYY-MM'
              return `${row.year}-${data.toString().padStart(2, '0')}`;
            }
            return '';
          }
        },
        { data: 'total_income',
          title: 'Total Income (USD)',
          type: 'number',
          render: (data: number) => data || '-'
        },
        { data: 'total_expense',
          title: 'Total Expense (USD)',
          type: 'number',
          render: (data: number) => data || '-'
        },
        { data: 'net_income',
          title: 'Remaining Income',
          type: 'number',
          render: (data: number) => data || '-'
        }
      ]
    };
  }
}