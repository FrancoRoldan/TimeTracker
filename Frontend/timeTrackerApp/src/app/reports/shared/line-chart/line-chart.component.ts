import { Component, Input, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, MatProgressSpinnerModule, MatCardModule],
  template: `
    <div class="chart-container">
      @if (_title()) {
        <h3 class="chart-title">{{ _title() }}</h3>
      }

      @if (_isLoading()) {
        <div class="loading-spinner">
          <mat-spinner [diameter]="40"></mat-spinner>
        </div>
      } @else if (_data().length === 0) {
        <div class="no-data">
          <p>No data available</p>
        </div>
      } @else {
        <div class="chart-wrapper">
          <canvas
            baseChart
            [data]="lineChartData()"
            [options]="lineChartOptions"
            [type]="'line'">
          </canvas>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .chart-container {
      padding: 20px;
      background-color: var(--mat-sys-surface);
      border-radius: 8px;
      border: 1px solid var(--mat-sys-outline-variant);
    }

    .chart-title {
      margin: 0 0 16px 0;
      font-size: 18px;
      font-weight: 500;
      color: var(--mat-sys-on-surface);
    }

    .chart-wrapper {
      position: relative;
      height: 300px;
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 300px;
    }

    .no-data {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 300px;
      background-color: var(--mat-sys-tertiary-container);
      border-radius: 4px;
      color: var(--mat-sys-on-tertiary-container);
    }

    .no-data p {
      margin: 0;
      font-size: 16px;
      opacity: 0.7;
    }
  `]
})
export class LineChartComponent implements OnInit {
  protected _data = signal<number[]>([]);
  protected _labels = signal<string[]>([]);
  protected _title = signal<string>('');
  protected _isLoading = signal<boolean>(false);
  protected _label = signal<string>('Hours');

  @Input() set data(value: number[]) {
    this._data.set(value);
  }

  @Input() set labels(value: string[]) {
    this._labels.set(value);
  }

  @Input() set title(value: string) {
    this._title.set(value);
  }

  @Input() set isLoading(value: boolean) {
    this._isLoading.set(value);
  }

  @Input() set label(value: string) {
    this._label.set(value);
  }


  public lineChartData = signal<ChartConfiguration['data']>({
    datasets: [],
    labels: []
  });

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: 'rgba(255, 255, 255, 0.9)'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      }
    }
  };

  constructor() {
    // Update chart data when inputs change
    effect(() => {
      this.updateChartData();
    });
  }

  ngOnInit(): void {
    this.updateChartData();
  }

  private updateChartData(): void {
    // Use bright, vibrant colors that work well in dark mode
    const lineColor = 'rgb(100, 150, 255)'; // Bright blue
    const fillColor = 'rgba(100, 150, 255, 0.2)'; // Light blue with transparency
    const pointColor = 'rgb(100, 150, 255)';
    const pointBorderColor = 'rgba(255, 255, 255, 0.8)';

    this.lineChartData.set({
      labels: this._labels(),
      datasets: [
        {
          data: this._data(),
          label: this._label(),
          fill: true,
          tension: 0.4,
          borderColor: lineColor,
          borderWidth: 3,
          backgroundColor: fillColor,
          pointBackgroundColor: pointColor,
          pointBorderColor: pointBorderColor,
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointHoverBackgroundColor: pointColor,
          pointHoverBorderColor: pointBorderColor,
          pointHoverBorderWidth: 3
        }
      ]
    });
  }
}
