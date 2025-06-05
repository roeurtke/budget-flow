import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncomeService } from '../../services/income.service';
import { ExpenseService } from '../../services/expense.service';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, format, parseISO } from 'date-fns';
import { Income, Expense } from '../../interfaces/fetch-data.interface';
import { ChartComponent } from '../../shared/chart/chart.component';
import { RevenueSourcesComponent } from '../../shared/chart/revenue-sources.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ChartComponent, RevenueSourcesComponent],
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
  monthlyEarningsData: { monthYear: string, earnings: number }[] = [];
  revenueSourcesData: { category: string, amount: number }[] = [];

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
      const allIncomes: Income[] = incomes || [];
      const allExpenses: Expense[] = expenses || [];

      // Calculate monthly income
      this.monthlyIncome = this.calculateIncomeForPeriod(
        allIncomes,
        startOfCurrentMonth,
        endOfCurrentMonth
      );

      // Calculate annual income
      this.annualIncome = this.calculateIncomeForPeriod(
        allIncomes,
        startOfCurrentYear,
        endOfCurrentYear
      );

      // Calculate monthly expense
      this.monthlyExpense = this.calculateExpenseForPeriod(
        allExpenses,
        startOfCurrentMonth,
        endOfCurrentMonth
      );

      // Calculate annual expense
      this.annualExpense = this.calculateExpenseForPeriod(
        allExpenses,
        startOfCurrentYear,
        endOfCurrentYear
      );

      // Prepare data for the chart
      this.monthlyEarningsData = this.aggregateMonthlyData(allIncomes, allExpenses);

      // Aggregate income data by category for revenue sources chart
      this.revenueSourcesData = this.aggregateIncomeByCategory(allIncomes);

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
        const incomeDate = parseISO(income.date);
        return incomeDate >= startDate && incomeDate <= endDate;
      })
      .reduce((sum, income) => sum + (income.income_amount || 0), 0);
  }

  private calculateExpenseForPeriod(expenses: Expense[], startDate: Date, endDate: Date): number {
    return expenses
      .filter(expense => {
        const expenseDate = parseISO(expense.date);
        return expenseDate >= startDate && expenseDate <= endDate;
      })
      .reduce((sum, expense) => sum + (expense.spent_amount || 0), 0);
  }

  private aggregateMonthlyData(incomes: Income[], expenses: Expense[]): { monthYear: string, earnings: number }[] {
    const monthlyTotals: { [key: string]: { income: number, expense: number } } = {};

    // Iterate through both incomes and expenses to aggregate by month
    [...incomes, ...expenses].forEach(item => {
      const date = parseISO(item.date);
      const monthYear = format(date, 'MMM yyyy');

      if (!monthlyTotals[monthYear]) {
        monthlyTotals[monthYear] = { income: 0, expense: 0 };
      }

      if ('income_amount' in item) {
        monthlyTotals[monthYear].income += (item as Income).income_amount || 0;
      } else if ('spent_amount' in item) {
        // We no longer need to sum expenses for total income chart
        // monthlyTotals[monthYear].expense += (item as Expense).spent_amount || 0;
      }
    });

    // Sort months chronologically
    const sortedMonths = Object.keys(monthlyTotals).sort((a, b) => {
      const [monthA, yearA] = a.split(' ');
      const [monthB, yearB] = b.split(' ');
      const dateA = new Date(`${monthA} 1, ${yearA}`);
      const dateB = new Date(`${monthB} 1, ${yearB}`);
      return dateA.getTime() - dateB.getTime();
    });

    // Map to the desired format, using only income total
    return sortedMonths.map(monthYear => ({
      monthYear,
      // Changed to display total income instead of net earnings
      earnings: monthlyTotals[monthYear].income
    }));
  }

  private aggregateIncomeByCategory(incomes: Income[]): { category: string, amount: number }[] {
    const categoryTotals: { [key: string]: number } = {};

    incomes.forEach(income => {
      const category = income.income_category?.name || 'Uncategorized'; // Access the nested category name
      if (!categoryTotals[category]) {
        categoryTotals[category] = 0;
      }
      categoryTotals[category] += income.income_amount || 0;
    });

    return Object.keys(categoryTotals).map(category => ({
      category,
      amount: categoryTotals[category]
    }));
  }

  onClick(event: Event): void {
    event.preventDefault();
    console.log('Clicked');
  }
}
