import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncomeService } from '../../services/income.service';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { Income } from '../../interfaces/fetch-data.interface';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  monthlyIncome: number = 0;
  annualIncome: number = 0;
  loading: boolean = true;
  error: string | null = null;

  constructor(private incomeService: IncomeService) {}

  ngOnInit(): void {
    this.loadIncomeData();
  }

  loadIncomeData(): void {
    this.loading = true;
    this.error = null;

    // Get current date
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);
    const startOfCurrentYear = startOfYear(now);
    const endOfCurrentYear = endOfYear(now);

    // Load all incomes
    this.incomeService.getIncomes().subscribe({
      next: (incomes: Income[]) => {
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

        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load income data';
        this.loading = false;
        console.error('Error loading income data:', err);
      }
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

  onClick(event: Event): void {
    event.preventDefault();
    console.log('Clicked');
  }
}
