import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "",
    title: "User Info",
    loadComponent: () => import('./pages/user-info/user-info.component')
  }
];