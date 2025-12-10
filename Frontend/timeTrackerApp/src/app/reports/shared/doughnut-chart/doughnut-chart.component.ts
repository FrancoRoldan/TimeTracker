import { Component, Input, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-doughnut-chart',
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
            [data]="doughnutChartData()"
            [options]="doughnutChartOptions"
            [type]="'doughnut'">
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
      display: flex;
      justify-content: center;
      align-items: center;
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
export class DoughnutChartComponent implements OnInit {
  protected _data = signal<number[]>([]);
  protected _labels = signal<string[]>([]);
  protected _title = signal<string>('');
  protected _isLoading = signal<boolean>(false);

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

  public doughnutChartData = signal<ChartConfiguration['data']>({
    datasets: [],
    labels: []
  });

  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: {
          color: 'rgba(255, 255, 255, 0.9)',
          padding: 15,
          font: {
            size: 13
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const dataArray = (context.dataset.data as number[]).filter(d => typeof d === 'number');
            const total = dataArray.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value}h (${percentage}%)`;
          }
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
    const colors = this.generateColors(this._data().length);

    this.doughnutChartData.set({
      labels: this._labels(),
      datasets: [
        {
          data: this._data(),
          backgroundColor: colors,
          borderColor: 'rgba(30, 30, 30, 0.8)',
          borderWidth: 3,
          hoverBorderColor: 'rgba(255, 255, 255, 0.8)',
          hoverBorderWidth: 4
        }
      ]
    });
  }

  private generateColors(count: number): string[] {
    // Use vibrant, saturated colors that work well in dark mode
    const baseColors = [
      'rgb(255, 99, 132)',   // Bright red/pink
      'rgb(100, 255, 150)',  // Bright green
      'rgb(100, 150, 255)',  // Bright blue
      'rgb(255, 206, 86)',   // Bright yellow
      'rgb(255, 159, 64)',   // Bright orange
      'rgb(153, 102, 255)',  // Bright purple
      'rgb(54, 235, 235)',   // Bright cyan
      'rgb(255, 120, 200)',  // Bright pink
    ];

    const colors = [];

    for (let i = 0; i < count; i++) {
      if (i < baseColors.length) {
        colors.push(baseColors[i]);
      } else {
        // Generate additional colors with high saturation and brightness
        const hue = (i * 137.5) % 360; // Golden angle for better distribution
        const saturation = 80 + (i % 3) * 5;
        const lightness = 60 + (i % 3) * 5;
        colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
      }
    }

    return colors;
  }

  private hexToHsl(hex: string): [number, number, number] {
    // Remove # if present
    hex = hex.replace('#', '');

    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return [h * 360, s * 100, l * 100];
  }
}
