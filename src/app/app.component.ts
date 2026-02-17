import { Component } from '@angular/core';
import { EmployeeListComponent } from './components/employee-list/employee-list.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, EmployeeListComponent],
  template: `<app-employee-list></app-employee-list>`
})
export class AppComponent {}
