import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
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
    this.darkMode.set(!darkModeValue);
    this.setDarkMode(!darkModeValue);
    this.updateDomdarkMode(!darkModeValue);
  }
}
