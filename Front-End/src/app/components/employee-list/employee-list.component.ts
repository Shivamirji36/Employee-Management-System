import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  ChangeDetectionStrategy
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Employee } from '../../models/employee.model';
import { EmployeeService } from '../../services/employee.service';
import { EmployeeModalComponent } from '../employee-modal/employee-modal.component';

// PrimeNG Modules
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';


@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    EmployeeModalComponent,
    TableModule,
    ButtonModule,
    TagModule,
    MenuModule
  ],
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeListComponent implements OnInit {

  employees: Employee[] = [];
  showModal = false;
  selectedEmployee: Employee | null = null;
  isEditMode = false;

  @ViewChild('empModal') empModal?: EmployeeModalComponent;

  constructor(
    private employeeService: EmployeeService,
    private cdr: ChangeDetectorRef
  ) {}

  // Open the PrimeNG menu on mousedown and stop event propagation so parent row
  // handlers don't interfere. Using mousedown ensures the menu is shown before
  // any focus/blur or click logic from the row can run.
  openMenu(event: Event, menuRef: any): void {
    event.preventDefault();
    event.stopPropagation();
    if (menuRef && typeof menuRef.toggle === 'function') {
      menuRef.toggle(event as any);
    }
  }

  ngOnInit(): void {
    this.loadEmployees();
  }


  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe((data: Employee[]) => {
      this.employees = data;
      this.cdr.markForCheck();
    });
  }


  openAddModal(): void {
    this.isEditMode = false;
    this.selectedEmployee = null;
    this.showModal = true;
    this.cdr.markForCheck();
  }


  openEditModal(employee: Employee): void {
    this.isEditMode = true;
    this.selectedEmployee = { ...employee };
    this.showModal = true;
    this.cdr.markForCheck();
  }


  deleteEmployee(id: string): void {
    if (!confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    this.employeeService.deleteEmployee(id).subscribe(() => {
      this.loadEmployees();
    });
  }


  getMenuItems(employee: Employee): MenuItem[] {
    return [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.openEditModal(employee)
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => this.deleteEmployee(employee.id)
      }
    ];
}

  getStatusSeverity(status: string): 'success' | 'danger' {
    return status === 'Active' ? 'success' : 'danger';
  }

  onEmployeeSaved(): void {
    this.showModal = false;
    this.loadEmployees();
  }
}
