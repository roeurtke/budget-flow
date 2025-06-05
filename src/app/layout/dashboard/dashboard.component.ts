import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncomeService } from '../../services/income.service';
import { ExpenseService } from '../../services/expense.service';
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { Income, Expense } from '../../interfaces/fetch-data.interface';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  monthlyIncome: number = 0;
  annualIncome: number = 0;
  monthlyExpense: number = 0;
  annualExpense: number = 0;
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private incomeService: IncomeService,
    private expenseService: ExpenseService
  ) {}

  ngOnInit(): void {
    this.loadFinancialData();
  }

  loadFinancialData(): void {
    this.loading = true;
    this.error = null;

    // Get current date
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);
    const startOfCurrentYear = startOfYear(now);
    const endOfCurrentYear = endOfYear(now);

    // Load both incomes and expenses
    Promise.all([
      this.incomeService.getIncomes().toPromise(),
      this.expenseService.getExpenses().toPromise()
    ]).then(([incomes, expenses]) => {
      if (incomes) {
        // Calculate monthly income
        this.monthlyIncome = this.calculateIncomeForPeriod(
          incomes,
          startOfCurrentMonth,
          endOfCurrentMonth
        );

        // Calculate annual income
        this.annualIncome = this.calculateIncomeForPeriod(
          incomes,
          startOfCurrentYear,
          endOfCurrentYear
        );
      }

      if (expenses) {
        // Calculate monthly expense
        this.monthlyExpense = this.calculateExpenseForPeriod(
          expenses,
          startOfCurrentMonth,
          endOfCurrentMonth
        );

        // Calculate annual expense
        this.annualExpense = this.calculateExpenseForPeriod(
          expenses,
          startOfCurrentYear,
          endOfCurrentYear
        );
      }

      this.loading = false;
    }).catch(err => {
      this.error = 'Failed to load financial data';
      this.loading = false;
      console.error('Error loading financial data:', err);
    });
  }

  private calculateIncomeForPeriod(incomes: Income[], startDate: Date, endDate: Date): number {
    return incomes
      .filter(income => {
        const incomeDate = new Date(income.date);
        return incomeDate >= startDate && incomeDate <= endDate;
      })
      .reduce((sum, income) => sum + (income.income_amount || 0), 0);
  }

  private calculateExpenseForPeriod(expenses: Expense[], startDate: Date, endDate: Date): number {
    return expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startDate && expenseDate <= endDate;
      })
      .reduce((sum, expense) => sum + (expense.spent_amount || 0), 0);
  }

  onClick(event: Event): void {
    event.preventDefault();
    console.log('Clicked');
  }
}
