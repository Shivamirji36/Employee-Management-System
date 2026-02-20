import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Employee } from '../models/employee.model';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private apiUrl = 'http://localhost:8080/api/employees';

  constructor(private http: HttpClient) {}

  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.apiUrl).pipe(
      tap((data) => {
        console.log('Fetched employees:', data);
        data.forEach((emp) => {
          if (emp.employeeId && !emp.id) {
            emp.id = emp.employeeId;
          }
        });
      }),
      catchError(this.handleError),
    );
  }

  addEmployee(employee: Employee): Observable<Employee> {
    console.log('Sending employee data to backend:', employee);
    return this.http.post<Employee>(this.apiUrl, employee).pipe(
      tap((response) => {
        console.log('Employee created successfully:', response);
        if (response.employeeId && !response.id) {
          response.id = response.employeeId;
        }
      }),
      catchError(this.handleError),
    );
  }

  updateEmployee(employee: Employee): Observable<Employee> {
    const id = employee.employeeId || employee.id;
    console.log('Updating employee:', employee);
    return this.http.put<Employee>(`${this.apiUrl}/${id}`, employee).pipe(
      tap((response) => {
        console.log('Employee updated successfully:', response);
        if (response.employeeId && !response.id) {
          response.id = response.employeeId;
        }
      }),
      catchError(this.handleError),
    );
  }

  deleteEmployee(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => console.log('Employee deleted successfully')),
      catchError(this.handleError),
    );
  }

  activateEmployee(id: string): Observable<Employee> {
    return this.http
      .put<Employee>(`${this.apiUrl}/${id}/activate`, {})
      .pipe(catchError(this.handleError));
  }

  deactivateEmployee(id: string): Observable<Employee> {
    return this.http
      .put<Employee>(`${this.apiUrl}/${id}/deactivate`, {})
      .pipe(catchError(this.handleError));
  }

  downloadEmployeeReport(employeeId: string): Observable<Blob> {
    return this.http.get(`http://localhost:8080/api/employees/report/${employeeId}`, {
      responseType: 'blob',
    });
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
      console.error('Client-side error:', errorMessage);
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      console.error('Server-side error:', error);
      console.error('Error details:', error.error);
    }

    return throwError(() => new Error(errorMessage));
  }
}
