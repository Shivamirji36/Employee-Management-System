import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Employee } from '../models/employee.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private employees$ = new BehaviorSubject<Employee[]>(this.getMockEmployees());

  constructor() { }

  getEmployees(): Observable<Employee[]> {
    return this.employees$.asObservable();
  }

  addEmployee(employee: Employee): void {
    const current = this.employees$.value;
    this.employees$.next([...current, employee]);
  }

  updateEmployee(employee: Employee): void {
    const current = this.employees$.value;
    const index = current.findIndex(e => e.id === employee.id);
    if (index !== -1) {
      current[index] = employee;
      this.employees$.next([...current]);
    }
  }

  deleteEmployee(id: string): void {
    const current = this.employees$.value;
    this.employees$.next(current.filter(e => e.id !== id));
  }

  activateEmployee(id: string): void {
    this.updateEmployeeStatus(id, 'Active');
  }

  deactivateEmployee(id: string): void {
    this.updateEmployeeStatus(id, 'Inactive');
  }

  private updateEmployeeStatus(id: string, status: 'Active' | 'Inactive'): void {
    const current = this.employees$.value;
    const index = current.findIndex(e => e.id === id);
    if (index !== -1) {
      current[index].status = status;
      this.employees$.next([...current]);
    }
  }

  // Mock data for testing - replace with HTTP calls later
  private getMockEmployees(): Employee[] {
    return [
      {
        id: 'Rajdip-1',
        name: 'Mr. Rajdip1 S',
        email: 'rajdip1@gmail.com',
        phone: '2004033333',
        gender: 'M',
        age: 65,
        dateOfBirth: '10-12-1960',
        employeeGroup: 'Physician',
        designation: 'Specialist',
        department: 'Internal Medicines',
        reportingManager: '',
        status: 'Active'
      },
      {
        id: 'Rajdip-2',
        name: 'Mr. Rajdip2 S',
        email: 'rajdip2@gmail.com',
        phone: '2004033334',
        gender: 'F',
        age: 62,
        dateOfBirth: '15-03-1963',
        employeeGroup: 'Physician',
        designation: 'Specialist',
        department: 'Internal Medicines',
        reportingManager: '',
        status: 'Active'
      },
      {
        id: 'Rajdip-3',
        name: 'Mr. Rajdip3 S',
        email: 'rajdip3@gmail.com',
        phone: '2004033335',
        gender: 'M',
        age: 58,
        dateOfBirth: '20-06-1967',
        employeeGroup: 'Physician',
        designation: 'Specialist',
        department: 'Internal Medicines',
        reportingManager: '',
        status: 'Inactive'
      },
      {
        id: 'Rajdip-10',
        name: 'Mr. Rajdip10 S',
        email: 'rajdip10@gmail.com',
        phone: '2004033342',
        gender: 'F',
        age: 65,
        dateOfBirth: '10-12-1960',
        employeeGroup: 'Physician',
        designation: 'Specialist',
        department: 'Internal Medicines',
        reportingManager: '',
        status: 'Active'
      }
    ];
  }
}