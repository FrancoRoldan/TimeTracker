import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './shared/services/theme-service.service';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet],
    template: `
    <router-outlet></router-outlet>
    `,
    styles: ``
})
export class AppComponent {
  private config:ThemeService = inject(ThemeService);

  constructor() {

   }
  
}
