import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, finalize } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Employee } from '../models/employee.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = 'http://localhost:8080/api/employees';
  private employees$ = new BehaviorSubject<Employee[]>([]);
  private isLoading = false;

  constructor(private http: HttpClient) {
    this.loadEmployees();
  }

  loadEmployees(): void {
    // Prevent multiple simultaneous requests
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.http.get<Employee[]>(this.apiUrl).pipe(
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe(
      (data) => {
        console.log('Employees loaded from backend:', data);
        this.employees$.next(data);
      },
      (error) => {
        console.error('Error loading employees:', error);
        this.employees$.next([]);
      }
    );
  }

  getEmployees(): Observable<Employee[]> {
    return this.employees$.asObservable();
  }

  addEmployee(employee: Employee): Observable<Employee> {
    console.log('Sending POST request with data:', employee);
    return this.http.post<Employee>(this.apiUrl, employee).pipe(
      tap((response) => {
        console.log('Employee created successfully:', response);
        // Reload the employee list after a small delay to ensure backend is updated
        setTimeout(() => this.loadEmployees(), 500);
      }),
      catchError((error) => {
        console.error('Error creating employee:', error);
        throw error;
      })
    );
  }

  updateEmployee(employee: Employee): Observable<Employee> {
    console.log('Sending PUT request with data:', employee);
    const url = `${this.apiUrl}/${employee.id}`;
    return this.http.put<Employee>(url, employee).pipe(
      tap((response) => {
        console.log('Employee updated successfully:', response);
        // Reload the employee list after a small delay to ensure backend is updated
        setTimeout(() => this.loadEmployees(), 500);
      }),
      catchError((error) => {
        console.error('Error updating employee:', error);
        throw error;
      })
    );
  }

  deleteEmployee(id: string): Observable<any> {
    console.log('Sending DELETE request for id:', id);
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete(url).pipe(
      tap((response) => {
        console.log('Employee deleted successfully:', response);
        // Reload the employee list after a small delay to ensure backend is updated
        setTimeout(() => this.loadEmployees(), 500);
      }),
      catchError((error) => {
        console.error('Error deleting employee:', error);
        throw error;
      })
    );
  }

  activateEmployee(id: string): Observable<any> {
    return this.deleteEmployee(id);
  }

  deactivateEmployee(id: string): Observable<any> {
    return this.deleteEmployee(id);
  }
}