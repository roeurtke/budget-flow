import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [`
    .chart-container {
      position: relative;
      height: 300px;
      width: 100%;
    }
  `]
})
export class ChartComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() monthlyData: { monthYear: string, earnings: number }[] = [];
  
  private chart: Chart | undefined;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (this.monthlyData.length > 0) {
      this.renderChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['monthlyData'] && !changes['monthlyData'].firstChange) {
      this.renderChart();
    }
  }

  private renderChart(): void {
    // Defer rendering to ensure canvas is available
    setTimeout(() => {
      const canvas = this.chartCanvas?.nativeElement;
      if (!canvas) {
        console.error('Chart canvas not found!');
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
          labels: this.monthlyData.map(data => data.monthYear),
          datasets: [{
            label: 'Total Income',
            data: this.monthlyData.map(data => data.earnings),
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
              },
              ticks: {
                maxTicksLimit: 12
              }
            },
            y: {
              ticks: {
                maxTicksLimit: 5,
                padding: 10,
                callback: function(value: any) {
                  return '$' + value;
                }
              },
              grid: {
                color: 'rgb(234, 236, 244)',
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
    }, 0);
  }
}
