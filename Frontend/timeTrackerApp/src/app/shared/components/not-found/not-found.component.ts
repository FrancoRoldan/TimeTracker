import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-not-found',
    imports: [
        CommonModule,
    ],
    template: `<h2>¡página no encontrada!</h2>`,
    styleUrl: './not-found.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotFoundComponent { }
