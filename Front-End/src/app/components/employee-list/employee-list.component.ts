import {
  Component,
  OnInit,
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
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';


@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    EmployeeModalComponent,
    TableModule,
    ButtonModule,
    TagModule,
    MenuModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
// ...existing code...

export class EmployeeListComponent implements OnInit {

  employees: Employee[] = [];
  showModal = false;
  selectedEmployee: Employee | null = null;
  isEditMode = false;

  // Cache menu items per employee ID
  private menuItemsMap: Map<string, MenuItem[]> = new Map();

  constructor(
    private employeeService: EmployeeService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService
  ) { }


  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe((data: Employee[]) => {
      this.employees = data;
      this.menuItemsMap.clear(); // Clear cache to avoid stale items
      this.cdr.markForCheck();
    });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedEmployee = null;
    this.showModal = true;
    this.cdr.detectChanges();
  }

  openEditModal(employee: Employee): void {
    this.isEditMode = true;
    this.selectedEmployee = { ...employee };
    this.showModal = true;
    this.cdr.detectChanges();
  }

  deleteEmployee(id: string): void {
    if (!confirm('Are you sure you want to delete this employee?')) {
      return;
    }
    this.employeeService.deleteEmployee(id).subscribe(() => {
      this.loadEmployees();
    });
  }

  // Use cached menu items for each employee
  getMenuItemsForEmployee(employee: Employee): MenuItem[] {
    const empId = employee.employeeId || employee.id;
    if (!this.menuItemsMap.has(empId!)) {
      this.menuItemsMap.set(empId!, [
        {
          label: 'Edit',
          icon: 'pi pi-pencil',
          command: () => this.openEditModal(employee)
        },
        {
          label: 'Delete',
          icon: 'pi pi-trash',
          command: () => this.deleteEmployee(empId!)
        }
      ]);
    }
    return this.menuItemsMap.get(empId!)!;
  }

  getStatusSeverity(status: string): 'success' | 'danger' {
    return status === 'Active' ? 'success' : 'danger';
  }

  onEmployeeSaved(): void {

    this.showModal = false;
    this.loadEmployees();

    this.messageService.add({
      severity: 'success',
      summary: 'Success Message',
      detail: this.isEditMode
        ? 'Employee Updated Successfully'
        : 'Employee details added successfully',
      life: 3000
    });

    this.cdr.markForCheck();
  }

}
// ...existing code...
