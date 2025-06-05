import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-revenue-sources-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      <canvas #revenueSourcesChartCanvas></canvas>
    </div>
  `,
  styles: [`
    .chart-container {
      position: relative;
      height: 300px; // Adjust height as needed
      width: 100%;
    }
  `]
})
export class RevenueSourcesComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('revenueSourcesChartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() chartData: { category: string, amount: number }[] = [];

  private chart: Chart | undefined;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (this.chartData && this.chartData.length > 0) {
      this.renderChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartData'] && !changes['chartData'].firstChange) {
      this.renderChart();
    }
  }

  private renderChart(): void {
    setTimeout(() => {
      const canvas = this.chartCanvas?.nativeElement;
      if (!canvas) {
        console.error('Revenue sources chart canvas not found!');
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Could not get canvas context for revenue sources chart');
        return;
      }

      if (this.chart) {
        this.chart.destroy(); // Destroy existing chart if it exists
      }

      this.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: this.chartData.map(data => data.category),
          datasets: [{
            data: this.chartData.map(data => data.amount),
            backgroundColor: [
              '#4e73df',
              '#1cc88a',
              '#36b9cc',
              '#f6c23e',
              '#e74a3b',
              '#858796'
            ],
            hoverBackgroundColor: [
              '#2e59d9',
              '#17a673',
              '#2c9faf',
              '#f4b619',
              '#e02d0b',
              '#747682'
            ],
            hoverBorderColor: 'rgba(234, 236, 244, 1)',
          }],
        },
        options: {
          maintainAspectRatio: false,
          responsive: true,
          cutout: '80%', // Adjust for donut hole size
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
            },
            tooltip: {
              callbacks: {
                label: function(context: any) {
                  let label = context.label || '';
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
          },
        },
      });
    }, 0);
  }
} 