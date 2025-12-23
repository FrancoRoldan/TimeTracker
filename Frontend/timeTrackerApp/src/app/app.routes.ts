import { Routes } from '@angular/router';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';
import { LogindGuard } from './guards/login.guard';
import { IsAuthenticatedGuard } from './guards/is-authenticated.guard';
import { LayoutComponent } from './shared/layouts/layout.component';

export const routes: Routes = [
    // Public routes (not authenticated)
    {
        path: "auth",
        loadChildren: () => import("./auth/auth.routes").then(m => m.routes),
        canActivate: [IsAuthenticatedGuard]
    },

    // Protected routes (require authentication)
    {
        path: "",
        component: LayoutComponent,
        canActivate: [LogindGuard],
        children: [
            {
                path: "",
                redirectTo: "dashboard",
                pathMatch: "full"
            },
            {
                path: "dashboard",
                loadComponent: () => import("./dashboard/dashboard.component").then(m => m.DashboardComponent)
            },
            {
                path: "companies",
                loadChildren: () => import("./company/company.routes").then(m => m.routes)
            },
            {
                path: "projects",
                loadChildren: () => import("./project/project.routes").then(m => m.routes)
            },
            {
                path: "issues",
                loadChildren: () => import("./issue/issue.routes").then(m => m.routes)
            },
            {
                path: "time-entries",
                loadChildren: () => import("./time-entry/time-entry.routes").then(m => m.routes)
            },
            {
                path: "user",
                loadChildren: () => import("./user/user.routes").then(m => m.routes)
            },
            {
                path: "reports",
                loadChildren: () => import("./reports/reports.routes").then(m => m.routes)
            }
        ]
    },

    // Fallback
    {
        path: "**",
        component: NotFoundComponent
    }
];
