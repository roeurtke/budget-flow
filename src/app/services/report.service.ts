import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom, of } from 'rxjs';
import { ReportResponse } from '../interfaces/report.interface';
import { environment } from '../../environments/environment';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IncomeService } from './income.service';
import { ExpenseService } from './expense.service';
import { Income, Expense } from '../interfaces/fetch-data.interface';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, parseISO, isSameDay } from 'date-fns';
import { catchError } from 'rxjs/operators';

// Define a type for the daily data structure
type DailyFinancialEntry = {
  date: Date;
  incomes: (Income & { amount: number })[];
  expenses: (Expense & { amount: number })[];
};

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = `${environment.apiUrl}/api/reports/financial-summary/`;

  constructor(
    private http: HttpClient,
    private incomeService: IncomeService,
    private expenseService: ExpenseService
  ) { }

  getFinancialSummary(): Observable<ReportResponse> {
    return this.http.get<ReportResponse>(this.apiUrl);
  }

  getFinancialSummaryForDataTables(dtParams: any): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  async exportToExcel(startMonth: string, endMonth: string): Promise<void> {
    try {
      if (!startMonth || !endMonth) {
        console.log('Please select both start and end months.');
        return;
      }

      const [startYear, startMonthNum] = startMonth.split('-').map(Number);
      const [endYear, endMonthNum] = endMonth.split('-').map(Number);
      
      const startDate = startOfMonth(new Date(startYear, startMonthNum));
      const endDate = endOfMonth(new Date(endYear, endMonthNum));

      // Load daily data
      const dailyData = await this.loadDailyData(startDate, endDate);

      if (dailyData.length === 0 || dailyData.every(day => day.incomes.length === 0 && day.expenses.length === 0)) {
        console.log('No data available for the selected period.');
        return;
      }

      // Prepare worksheet data
      const worksheetData: any[][] = [];

      // Add report header
      worksheetData.push(['Financial Report']);
      worksheetData.push([`Period: ${format(startDate, 'MMMM yyyy')} to ${format(endDate, 'MMMM yyyy')}`]);
      worksheetData.push([`Generated on: ${format(new Date(), 'dd-MM-yyyy')}`]);
      worksheetData.push([]); // Empty row for spacing

      // Add incomes section
      const allIncomes = dailyData.reduce((acc, day) => acc.concat(day.incomes), [] as Income[]);
      if (allIncomes.length > 0) {
        worksheetData.push(['Incomes']);
        worksheetData.push(['Date', 'Category', 'Description', 'Amount']);
        
        allIncomes.forEach(income => {
          worksheetData.push([
            format(parseISO(income.date), 'dd/MM/yyyy'),
            income.income_category?.name || 'Uncategorized',
            income.description || '-',
            Number(income.income_amount || 0)
          ]);
        });

        // Add income total
        const totalIncome = allIncomes.reduce((sum, income) => sum + (income.income_amount || 0), 0);
        worksheetData.push(['', '', 'Total Income:', totalIncome]);
        worksheetData.push([]); // Empty row for spacing
      } else {
        worksheetData.push(['Incomes']);
        worksheetData.push(['No incomes recorded for this period.']);
        worksheetData.push([]); // Empty row for spacing
      }

      // Add expenses section
      const allExpenses = dailyData.reduce((acc, day) => acc.concat(day.expenses), [] as Expense[]);
      if (allExpenses.length > 0) {
        worksheetData.push(['Expenses']);
        worksheetData.push(['Date', 'Category', 'Description', 'Amount']);
        
        allExpenses.forEach(expense => {
          worksheetData.push([
            format(parseISO(expense.date), 'dd/MM/yyyy'),
            expense.expense_category?.name || 'Uncategorized',
            expense.description || '-',
            Number(expense.spent_amount || 0)
          ]);
        });

        // Add expense total
        const totalExpense = allExpenses.reduce((sum, expense) => sum + (expense.spent_amount || 0), 0);
        worksheetData.push(['', '', 'Total Expense:', totalExpense]);
        worksheetData.push([]); // Empty row for spacing
      } else {
        worksheetData.push(['Expenses']);
        worksheetData.push(['No expenses recorded for this period.']);
        worksheetData.push([]); // Empty row for spacing
      }

      // Add summary section
      const totalIncome = allIncomes.reduce((sum, income) => sum + (income.income_amount || 0), 0);
      const totalExpense = allExpenses.reduce((sum, expense) => sum + (expense.spent_amount || 0), 0);
      const netIncome = totalIncome - totalExpense;

      worksheetData.push(['Summary']);
      worksheetData.push(['Total Income:', totalIncome]);
      worksheetData.push(['Total Expense:', totalExpense]);
      worksheetData.push(['Net Income:', netIncome]);

      // Create worksheet
      const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      const colWidths = [
        { wch: 12 }, // Date
        { wch: 20 }, // Category
        { wch: 30 }, // Description
        { wch: 15 }  // Amount
      ];
      worksheet['!cols'] = colWidths;

      // Create workbook and save file
      const workbook: XLSX.WorkBook = { 
        Sheets: { 'Financial Report': worksheet }, 
        SheetNames: ['Financial Report'] 
      };

      // Generate filename with date
      const fileName = `financial_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(workbook, fileName);

    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw error;
    }
  }

  async printReport(startMonth: string, endMonth: string): Promise<void> {
    try {
      if (!startMonth || !endMonth) {
        console.log('Please select both start and end months.');
        return;
      }

      const [startYear, startMonthNum] = startMonth.split('-').map(Number);
      const [endYear, endMonthNum] = endMonth.split('-').map(Number);
      
      const startDate = startOfMonth(new Date(startYear, startMonthNum));
      const endDate = endOfMonth(new Date(endYear, endMonthNum));

      // Load daily data
      const dailyData = await this.loadDailyData(startDate, endDate);

      if (dailyData.length === 0 || dailyData.every(day => day.incomes.length === 0 && day.expenses.length === 0)) {
        console.log('No data available for the selected period.');
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
      const lineHeight = 4;
      const tableMarginTop = 5;
      const sectionMarginBottom = 10;
      const minSpaceForElement = 20;

      // Collect all incomes from all days
      const allIncomes = dailyData.reduce((acc, day) => acc.concat(day.incomes), [] as Income[]);

      if (allIncomes.length > 0) {
        if (yPosition + minSpaceForElement > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(12);
        doc.text('Incomes:', margin, yPosition);
        yPosition += lineHeight;

        const incomeTableData = allIncomes.map(income => [
          format(parseISO(income.date), 'dd/MM/yyyy'),
          income.income_category?.name || 'Uncategorized',
          income.description || '-',
          (income.income_amount || 0).toFixed(2)
        ]);

        const totalPeriodIncome = allIncomes.reduce((sum, income) => sum + (income.income_amount || 0), 0);

        incomeTableData.push([
          '',
          '',
          'Total Income:',
          `$${totalPeriodIncome.toFixed(2)}`
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Date', 'Category', 'Description', 'Amount']],
          body: incomeTableData,
          theme: 'grid',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [41, 128, 185] },
          margin: { left: margin },
          didParseCell: function (data) {
            if (
              data.section === 'body' &&
              data.row.index === incomeTableData.length - 1
            ) {
              data.cell.styles.fontStyle = 'bold';
            }
          }
        });

        yPosition = (doc as any).lastAutoTable.finalY + tableMarginTop + sectionMarginBottom;
      } else {
        if (yPosition + minSpaceForElement > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.setFontSize(12);
        doc.text('Incomes:', margin, yPosition);
        yPosition += lineHeight;
        doc.setFontSize(10);
        doc.text('No incomes recorded for this period.', margin, yPosition);
        yPosition += lineHeight + sectionMarginBottom;
      }

      // Collect all expenses from all days
      const allExpenses = dailyData.reduce((acc, day) => acc.concat(day.expenses), [] as Expense[]);

      if (allExpenses.length > 0) {
        if (yPosition + minSpaceForElement > pageHeight - margin) { 
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(12);
        doc.text('Expenses:', margin, yPosition);
        yPosition += lineHeight;

        const expenseTableData = allExpenses.map(expense => [
          format(parseISO(expense.date), 'dd/MM/yyyy'),
          expense.expense_category?.name || 'Uncategorized',
          expense.description || '-',
          (expense.spent_amount || 0).toFixed(2)
        ]);

        const totalPeriodExpense = allExpenses.reduce((sum, expense) => sum + (expense.spent_amount || 0), 0);

        expenseTableData.push([
          '',
          '',
          'Total Expense:',
          `$${totalPeriodExpense.toFixed(2)}`
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Date', 'Category', 'Description', 'Amount']],
          body: expenseTableData,
          theme: 'grid',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [231, 76, 60] },
          margin: { left: margin },
          didParseCell: function (data) {
            if (
              data.section === 'body' &&
              data.row.index === expenseTableData.length - 1
            ) {
              data.cell.styles.fontStyle = 'bold';
            }
          }
        });

        yPosition = (doc as any).lastAutoTable.finalY + tableMarginTop;
      } else {
        if (yPosition + minSpaceForElement > pageHeight - margin) { 
          doc.addPage();
          yPosition = margin;
        }
        doc.setFontSize(12);
        doc.text('Expenses:', margin, yPosition);
        yPosition += lineHeight;
        doc.setFontSize(10);
        doc.text('No expenses recorded for this period.', margin, yPosition);
        yPosition += lineHeight + sectionMarginBottom;
      }

      const estimatedOverallSummaryHeight = lineHeight * 4 + sectionMarginBottom * 2;
      if (yPosition + estimatedOverallSummaryHeight > pageHeight - margin) { 
        doc.addPage();
        yPosition = margin;
      }
      const totalIncome = dailyData.reduce((sum, day) => 
        sum + (day.incomes || []).reduce((daySum, income) => daySum + (income.income_amount || 0), 0), 0);
      const totalExpense = dailyData.reduce((sum, day) => 
        sum + (day.expenses || []).reduce((daySum, expense) => daySum + (expense.spent_amount || 0), 0), 0);
      const totalNet = totalIncome - totalExpense;
      yPosition += lineHeight;

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

      const numberOfPages = (doc.internal.pages as any).length;
      for (let i = 1; i <= numberOfPages; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.text('Page ' + i, doc.internal.pageSize.width - margin, doc.internal.pageSize.height - 10, { align: 'right' });
      }

      doc.save(`financial_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  private async loadDailyData(startDate: Date, endDate: Date): Promise<DailyFinancialEntry[]> {
    try {
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      
      const incomes$ = this.incomeService.getIncomes().pipe(catchError(() => of([])));
      const expenses$ = this.expenseService.getExpenses().pipe(catchError(() => of([])));

      const [allIncomes, allExpenses] = await Promise.all([
        firstValueFrom(incomes$),
        firstValueFrom(expenses$)
      ]);

      return days.map(date => {
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
    } catch (error) {
      console.error('Error loading daily data:', error);
      return [];
    }
  }
}