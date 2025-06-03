import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { DataTableDirective } from 'angular-datatables';
import { dataTablesConfig } from '../../../shared/datatables/datatables-config';
import { Subject, of, firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { format, getMonth, getYear, eachDayOfInterval, startOfMonth, endOfMonth, parseISO, isSameDay } from 'date-fns';
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
import { Income, Expense } from '../../../interfaces/fetch-data.interface';

// Define a type for the daily data structure
type DailyFinancialEntry = {
  date: Date;
  incomes: (Income & { amount: number })[];
  expenses: (Expense & { amount: number })[];
};

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

  availableMonths: { month: number, year: number }[] = [];

  dailyData: DailyFinancialEntry[] = [];

  constructor(
    private reportService: ReportService,
    private permissionService: PermissionService,
    private incomeService: IncomeService,
    private expenseService: ExpenseService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      start_month: [''],
      end_month: ['']
    });
  }

  ngOnInit(): void {
    this.loadAvailableMonths();
    this.initializeDataTable();
    this.permissionService.hasPermission(PermissionCode.CAN_VIEW_REPORT).subscribe(has => this.canviewReport = has);
  }

  loadAvailableMonths(): void {
    // Load income dates
    this.incomeService.getIncomes().subscribe({
      next: (incomes) => {
        const incomeMonths = incomes.map(income => {
          const date = new Date(income.date);
          return {
            month: getMonth(date),
            year: getYear(date)
          };
        });
        this.updateAvailableMonths(incomeMonths);
      },
      error: (err) => console.error('Error loading income dates:', err)
    });

    // Load expense dates
    this.expenseService.getExpenses().subscribe({
      next: (expenses) => {
        const expenseMonths = expenses.map(expense => {
          const date = new Date(expense.date);
          return {
            month: getMonth(date),
            year: getYear(date)
          };
        });
        this.updateAvailableMonths(expenseMonths);
      },
      error: (err) => console.error('Error loading expense dates:', err)
    });
  }

  private updateAvailableMonths(newMonths: { month: number, year: number }[]): void {
    // Combine existing months with new months and remove duplicates
    const allMonths = [...new Set([...this.availableMonths, ...newMonths].map(m => `${m.year}-${m.month}`))]
      .map(str => {
        const [year, month] = str.split('-').map(Number);
        return { month, year };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
    
    this.availableMonths = allMonths;
  }

  applyFilter(): void {
    const startMonth = this.filterForm.get('start_month')?.value;
    const endMonth = this.filterForm.get('end_month')?.value;

    if (startMonth && endMonth) {
      const [startYear, startMonthNum] = startMonth.split('-').map(Number);
      const [endYear, endMonthNum] = endMonth.split('-').map(Number);
      
      this.filteredData = this.financialSummary.filter(item => {
        const itemDate = new Date(this.year, item.month - 1, 1);
        const startDate = new Date(startYear, startMonthNum, 1);
        const endDate = new Date(endYear, endMonthNum + 1, 0); // Last day of the end month
        
        return itemDate >= startDate && itemDate <= endDate;
      });
    } else {
      // If no months selected, show no data
      this.filteredData = [];
    }

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
  }

  exportToExcel(): void {
    if (this.filteredData.length === 0) {
      // If no data is filtered, do not export
      console.log('No data to export to Excel.');
      return;
    }
    const data = this.filteredData;
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data.map(item => ({
      'Month': format(new Date(this.year, item.month - 1, 1), 'MMMM yyyy'),
      'Total Income': item.total_income,
      'Total Expense': item.total_expense,
      'Net Income': item.net_income
    })));

    const workbook: XLSX.WorkBook = { Sheets: { 'Financial Report': worksheet }, SheetNames: ['Financial Report'] };
    XLSX.writeFile(workbook, `financial_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  }

  private async loadDailyData(startDate: Date, endDate: Date): Promise<void> {
    try {
      // Get all days in the month range
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      
      // Get all incomes and expenses
      const incomes$ = this.incomeService.getIncomes().pipe(catchError(() => of([])));
      const expenses$ = this.expenseService.getExpenses().pipe(catchError(() => of([])));

      const [allIncomes, allExpenses] = await Promise.all([
        firstValueFrom(incomes$),
        firstValueFrom(expenses$)
      ]);

      // console.log('Fetched Incomes:', allIncomes);
      // console.log('Fetched Expenses:', allExpenses);

      // Create daily data structure
      this.dailyData = days.map(date => {
        const dayIncomes = (allIncomes as Income[] || []).filter(income => 
          income && income.date && isSameDay(parseISO(income.date), date)
        ).map(income => ({
          ...income,
          amount: Number(income.income_amount) || 0
        }));
        
        const dayExpenses = (allExpenses as Expense[] || []).filter(expense => 
          expense && expense.date && isSameDay(parseISO(expense.date), date)
        ).map(expense => ({
          ...expense,
          amount: Number(expense.spent_amount) || 0
        }));

        return {
          date,
          incomes: dayIncomes,
          expenses: dayExpenses
        };
      });
      // console.log('Processed dailyData:', this.dailyData);

    } catch (error) {
      console.error('Error loading daily data:', error);
      this.dailyData = [];
    }
  }

  async printReport(): Promise<void> {
    try {
      const startMonth = this.filterForm.get('start_month')?.value;
      const endMonth = this.filterForm.get('end_month')?.value;

      if (!startMonth || !endMonth) {
        console.log('Please select both start and end months.');
        return;
      }

      const [startYear, startMonthNum] = startMonth.split('-').map(Number);
      const [endYear, endMonthNum] = endMonth.split('-').map(Number);
      
      // Note: Month numbers from the form are 0-indexed for Date constructor
      const startDate = startOfMonth(new Date(startYear, startMonthNum));
      const endDate = endOfMonth(new Date(endYear, endMonthNum));

      // Load daily data
      await this.loadDailyData(startDate, endDate);

      if (this.dailyData.length === 0 || this.dailyData.every(day => day.incomes.length === 0 && day.expenses.length === 0)) {
        console.log('No data available for the selected period.');
        // Optionally show a message to the user in the UI
        return;
      }

      const doc = new jsPDF();
      
      // Add title
      const pageWidth = doc.internal.pageSize.width;
      const centerX = pageWidth / 2;
      
      doc.setFontSize(16);
      doc.text('Financial Report', centerX, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`Period: ${format(startDate, 'MMMM yyyy')} to ${format(endDate, 'MMMM yyyy')}`, centerX, 22, { align: 'center' });
      doc.text(`Generated on: ${format(new Date(), 'dd-MM-yyyy')}`, centerX, 29, { align: 'center' });

      let yPosition = 40;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 14;
      const lineHeight = 7;
      const tableMarginTop = 5;
      const summaryMarginTop = 5;
      const sectionMarginBottom = 10; // Space after each day's section
      const minSpaceForElement = 20; // Minimum space needed for a header or summary line

      // Process each day
      for (const day of this.dailyData) {

        // Only add day section if there are incomes or expenses for the day
        if (day.incomes.length === 0 && day.expenses.length === 0) {
          continue; // Skip this day if no transactions
        }

        // Check if we need a new page before adding day header
        if (yPosition + minSpaceForElement > pageHeight - margin) { 
          doc.addPage();
          yPosition = margin;
        }

        // Add date header
        doc.setFontSize(12);
        doc.text(format(day.date, 'EEEE, MMMM d, yyyy'), margin, yPosition);
        yPosition += lineHeight;

        // Add incomes
        if (day.incomes && day.incomes.length > 0) {
          // Check if we need a new page before adding incomes table header
           if (yPosition + minSpaceForElement > pageHeight - margin) { 
            doc.addPage();
            yPosition = margin;
            // Repeat date header on new page for clarity
            doc.setFontSize(12);
            doc.text(format(day.date, 'EEEE, MMMM d, yyyy'), margin, yPosition);
            yPosition += lineHeight;
          }

          doc.setFontSize(10);
          doc.text('Incomes:', margin, yPosition);
          yPosition += lineHeight;

          const incomeTableData = day.incomes.map(income => [
            format(parseISO(income.date), 'dd/MM/yyyy'),
            income.income_category?.name || 'Uncategorized',
            income.description || '-',
            (income.amount || 0).toFixed(2)
          ]);

          autoTable(doc, {
            startY: yPosition,
            head: [['Date', 'Category', 'Description', 'Amount']],
            body: incomeTableData,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185] },
            margin: { left: margin }
          });

          yPosition = (doc as any).lastAutoTable.finalY + tableMarginTop;
          
          // Add daily income total after the table
          const dailyIncome = (day.incomes || []).reduce((sum, income) => sum + (income.amount || 0), 0);
          doc.setFontSize(9);
          doc.text(`Total Income: $${dailyIncome.toFixed(2)}`, margin, yPosition);
          yPosition += lineHeight + summaryMarginTop;
        }

        // Add expenses
        if (day.expenses && day.expenses.length > 0) {
          // Check if we need a new page before adding expenses table header and table
           const estimatedExpenseTableHeight = lineHeight + tableMarginTop; // Estimate space for header and margin before table

          if (yPosition + estimatedExpenseTableHeight > pageHeight - margin) { 
            doc.addPage();
            yPosition = margin;
            // Repeat date header on new page for clarity
            doc.setFontSize(12);
            doc.text(format(day.date, 'EEEE, MMMM d, yyyy'), margin, yPosition);
            yPosition += lineHeight;
          }

          doc.setFontSize(10);
          doc.text('Expenses:', margin, yPosition);
          yPosition += lineHeight;

          const expenseTableData = day.expenses.map(expense => [
            format(parseISO(expense.date), 'dd/MM/yyyy'),
            expense.expense_category?.name || 'Uncategorized',
            expense.description || '-',
            (expense.amount || 0).toFixed(2)
          ]);

          autoTable(doc, {
            startY: yPosition,
            head: [['Date', 'Category', 'Description', 'Amount']],
            body: expenseTableData,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [231, 76, 60] },
            margin: { left: margin }
          });

          yPosition = (doc as any).lastAutoTable.finalY + tableMarginTop;

          // Add daily expense total after the table
          const dailyExpense = (day.expenses || []).reduce((sum, expense) => sum + (expense.amount || 0), 0);
          doc.setFontSize(9);
          doc.text(`Total Expense: $${dailyExpense.toFixed(2)}`, margin, yPosition);
          yPosition += lineHeight + summaryMarginTop;
        }
      }

      // Add overall summary on the last page
       // Check if we need a new page before adding overall summary
      const estimatedOverallSummaryHeight = lineHeight * 4 + sectionMarginBottom * 2; // Estimate
      if (yPosition + estimatedOverallSummaryHeight > pageHeight - margin) { 
        doc.addPage();
        yPosition = margin;
      }
      const totalIncome = this.dailyData.reduce((sum, day) => 
        sum + (day.incomes || []).reduce((daySum, income) => daySum + (income.amount || 0), 0), 0);
      const totalExpense = this.dailyData.reduce((sum, day) => 
        sum + (day.expenses || []).reduce((daySum, expense) => daySum + (expense.amount || 0), 0), 0);
      const totalNet = totalIncome - totalExpense;

      doc.setFontSize(12);
      doc.text('Overall Summary', margin, yPosition);
      yPosition += lineHeight * 2;
      doc.setFontSize(10);
      doc.text(`Total Income: $${totalIncome.toFixed(2)}`, margin, yPosition);
      yPosition += lineHeight;
      doc.text(`Total Expense: $${totalExpense.toFixed(2)}`, margin, yPosition);
      yPosition += lineHeight;
      doc.text(`Remaining Income: $${totalNet.toFixed(2)}`, margin, yPosition);
      yPosition += sectionMarginBottom;

      // Add page numbers to all pages
      const numberOfPages = (doc.internal.pages as any).length;
      for (let i = 1; i <= numberOfPages; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.text('Page ' + i, doc.internal.pageSize.width - margin, doc.internal.pageSize.height - 10, { align: 'right' });
      }

      doc.save(`financial_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Error generating report:', error);
    }
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
        // Initially load all data into financialSummary
        this.reportService.getFinancialSummaryForDataTables(dataTablesParameters).subscribe({
          next: (response) => {
            this.financialSummary = response.monthly_summary
              .filter((item: any) => item.total_income !== 0 || item.total_expense !== 0)
              .map((item: any) => ({
                ...item,
                year: response.year
              }));

            // Initially show no data in the table
            this.filteredData = [];

            // Do not call callback with initial data
            callback({
              recordsTotal: 0,
              recordsFiltered: 0,
              data: []
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

  formatMonthDisplay(month: number, year: number): string {
    return format(new Date(year, month, 1), 'MMMM yyyy');
  }
}