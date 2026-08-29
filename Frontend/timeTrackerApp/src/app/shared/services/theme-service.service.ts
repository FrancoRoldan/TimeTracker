import { Injectable, inject, signal } from '@angular/core';
import { TelemetryService } from './telemetry.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private telemetry = inject(TelemetryService);

  public darkMode = signal<boolean>(false);

  constructor() {
    const theme = localStorage.getItem("theme");

    if (theme) this.changeTheme(theme);
    this.darkMode.set(this.getDarkMode());
   }

  updateDomdarkMode(darkModeValue:boolean): void {
    let element = document.body as HTMLElement;
    
    if(darkModeValue){
      element.classList.add('dark-theme');
    }
    else{
      element.classList.remove("dark-theme");
    }
  }

  changeTheme(theme:string): void {
    this.telemetry.trackEvent('theme_changed', { tema: theme });
    let themeLink = document.body as HTMLElement;

    const actualTheme = themeLink.classList.value;

    const themes:string[] = actualTheme.split(" ");

    themes.forEach(theme => {
      if(theme){
        themeLink.classList.remove(theme);
      }
    });

    localStorage.setItem("theme", theme);

    themeLink.classList.add(theme);
  }

  setDarkMode(darkMode: boolean) {
    let darkModeValue = darkMode ? "true" : "false"; 
    localStorage.setItem("dark-mode", darkModeValue);
  } 

  getDarkMode(): boolean {
    if (!localStorage.getItem("dark-mode")) return true;
    const darkModeValue = localStorage.getItem("dark-mode") == "true" ? true: false;

    this.updateDomdarkMode(darkModeValue);

    return darkModeValue;
  }

  toogleDarkMode(){
    const darkModeValue = this.getDarkMode();
    this.telemetry.trackEvent('dark_mode_toggled', { activado: String(!darkModeValue) });
    this.darkMode.set(!darkModeValue);
    this.setDarkMode(!darkModeValue);
    this.updateDomdarkMode(!darkModeValue);
  }
}
