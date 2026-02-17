import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Employee } from '../../models/employee.model';
import { EmployeeService } from '../../services/employee.service';
import { EmployeeModalComponent } from '../employee-modal/employee-modal.component';

// PrimeNG Modules
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    EmployeeModalComponent,
    TableModule,
    ButtonModule,
    TagModule
  ],
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css']
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

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe(
      (data: Employee[]) => {
        this.employees = data;
      }
    );
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedEmployee = null;
    
    if (this.empModal) {
      this.empModal.visible = true;
      this.empModal.visibleChange.emit(true);
      this.cdr.detectChanges();
    }
  }

  openEditModal(employee: Employee): void {
    this.isEditMode = true;
    this.selectedEmployee = { ...employee };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  getStatusSeverity(status: string): 'success' | 'danger' {
    return status === 'Active' ? 'success' : 'danger';
  }

  exportData(): void {
    // export action
  }

  onEmployeeSaved(): void {
    this.closeModal();
    this.loadEmployees();
  }

}
