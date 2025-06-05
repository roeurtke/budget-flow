import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncomeService } from '../../services/income.service';
import { ExpenseService } from '../../services/expense.service';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, format, parseISO } from 'date-fns';
import { Income, Expense } from '../../interfaces/fetch-data.interface';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  monthlyIncome: number = 0;
  annualIncome: number = 0;
  monthlyExpense: number = 0;
  annualExpense: number = 0;
  loading: boolean = true;
  error: string | null = null;
  chart: Chart | undefined;
  monthlyEarningsData: { monthYear: string, earnings: number }[] = [];
  isViewInitialized: boolean = false;

  @ViewChild('earningsOverviewChart') chartCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(
    private incomeService: IncomeService,
    private expenseService: ExpenseService
  ) {}

  ngOnInit(): void {
    this.loadFinancialData();
  }

  ngAfterViewInit(): void {
    this.isViewInitialized = true;
    if (this.monthlyEarningsData.length > 0 || (!this.loading && this.error === null)) {
      this.renderEarningsChart(this.monthlyEarningsData);
    }
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

      // Prepare data for the chart and store it
      this.monthlyEarningsData = this.aggregateMonthlyData(allIncomes, allExpenses);

      // If the view is already initialized, render the chart now
      if (this.isViewInitialized) {
         this.renderEarningsChart(this.monthlyEarningsData);
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

  private renderEarningsChart(monthlyData: { monthYear: string, earnings: number }[]): void {
    // Defer rendering to ensure canvas is available
    setTimeout(() => {
      // Use the ViewChild reference to get the canvas element
      const canvas = this.chartCanvas?.nativeElement;
      if (!canvas) {
        console.error('Earnings overview chart canvas not found!');
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
          console.error('Could not get canvas context for chart');
          return;
      }

      if (this.chart) {
        this.chart.destroy(); // Destroy existing chart if it exists
      }


      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: monthlyData.map(data => data.monthYear),
          datasets: [{
            label: 'Total Income',
            data: monthlyData.map(data => data.earnings),
            backgroundColor: 'rgba(78, 115, 223, 0.05)',
            borderColor: 'rgba(78, 115, 223, 1)',
            pointRadius: 3,
            pointBackgroundColor: 'rgba(78, 115, 223, 1)',
            pointBorderColor: 'rgba(78, 115, 223, 1)',
            pointHoverRadius: 3,
            pointHoverBackgroundColor: 'rgba(78, 115, 223, 1)',
            pointHoverBorderColor: 'rgba(78, 115, 223, 1)',
            pointHitRadius: 10,
            pointBorderWidth: 2,
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          maintainAspectRatio: false,
          layout: {
            padding: {
              left: 10,
              right: 25,
              top: 25,
              bottom: 25
            }
          },
          scales: {
            x: {
              time: {
                  unit: 'month'
              },
              grid: {
                display: false,
                // Removed: drawBorder: false
              },
              ticks: {
                  maxTicksLimit: 12
              }
            },
            y: {
              ticks: {
                maxTicksLimit: 5,
                padding: 10,
                // Include a dollar sign in the ticks
                callback: function(value: any, index: any, values: any) {
                  return '$' + value;
                }
              },
              grid: {
                color: 'rgb(234, 236, 244)',
                // Removed: drawBorder: false,
                // Removed: zeroLineColor: 'rgb(234, 236, 244)',
                // Removed: zeroLineWidth: 1
              }
            },
          },
          plugins: {
              legend: {
                  display: false
              },
              tooltip: {
                  backgroundColor: 'rgb(255,255,255)',
                  bodyColor: '#858796',
                  titleMarginBottom: 10,
                  titleColor: '#6e707e',
                  titleFont: { weight: 'bold' },
                  borderColor: '#dddfeb',
                  borderWidth: 1,
                  xAlign: 'center',
                  intersect: false,
                  mode: 'index',
                  caretPadding: 10,
                  callbacks: {
                      label: function(context: any) {
                          let label = context.dataset.label || '';
                          if (label) {
                              label += ': ';
                          }
                          if (context.raw !== null) {
                              label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.raw);
                          }
                          return label;
                      }
                  }
              }
          }
        }
      });
    }, 0); // Use a minimal delay
  }

  onClick(event: Event): void {
    event.preventDefault();
    console.log('Clicked');
  }
}
