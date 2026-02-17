import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';


import { Employee } from '../../models/employee.model';
import { EmployeeService } from '../../services/employee.service';

// PrimeNG Modules
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  selector: 'app-employee-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    ButtonModule,
    SelectModule,
    CheckboxModule
  ],
  templateUrl: './employee-modal.component.html'
})
export class EmployeeModalComponent implements OnInit {

  @Input() employee: Employee | null = null;
  @Input() isEditMode = false;
  @Input() visible: boolean = false;

  @Output() save = new EventEmitter<void>();
  @Output() visibleChange = new EventEmitter<boolean>();

  employeeForm!: FormGroup;
  // Designation add dialog
  showDesignationDialog = false;
  designationForm!: FormGroup;
  // Employee group add dialog
  showEmployeeGroupDialog = false;
  employeeGroupForm!: FormGroup;

  genderOptions = [
    { label: 'Male', value: 'M' },
    { label: 'Female', value: 'F' },
    { label: 'Other', value: 'O' }
  ];

  statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' }
  ];

  salutationOptions = [
    { label: 'Baby.', value: 'BABY' },
    { label: 'B/O.', value: 'B/O' },
    { label: 'Dr.', value: 'DR' },
    { label: 'Mast.', value: 'MAST' },
    { label: 'Miss.', value: 'MISS' },
    { label: 'Mr.', value: 'MR' },
    { label: 'Mrs.', value: 'MRS' },
    { label: 'Ms.', value: 'MS' }
  ];

  designationOptions = [
    { label: 'developer', value: 'Developer' },
    { label: 'diet specialist', value: 'Diet Specialist' },
    { label: 'Front desk executive', value: 'Front desk executive' },
    { label: 'IT manager', value: 'IT Manager' },
    { label: 'Lab technician', value: 'Lab technician' },
    { label: 'Nurse', value: 'Nurse' },
  ];

  employeeOptions = [
    { label: 'Finance and Accounts', value: 'Finance and Accounts' },
    { label: 'IT team', value: 'IT team' },
    { label: 'LABORATORY', value: 'LABORATORY' },
    { label: 'Physician', value: 'Physician' },
  ];

  employeeDepOptions = [
    { label: 'Ambulance Department', value: 'Ambulance Department' },
    { label: 'Canary Test', value: 'Canary Test' },
    { label: 'Cardiology Department', value: 'Cardiology Department' },
    { label: 'Dermatology Department', value: 'Dermatology Department' },
    { label: 'dWise department', value: 'dWise department' },
    { label: 'ER', value: 'ER' },
    { label: 'Excel Main', value: 'Excel Main' },
    { label: 'External Sub Department', value: 'External Sub Department' },
    { label: 'External Medicine', value: 'External Medicine' },
    { label: 'Finance and Accounts', value: 'Finance and Accounts' },
    { label: 'IT team', value: 'IT team' },
    { label: 'LABORATORY', value: 'LABORATORY' },
    { label: 'Physician', value: 'Physician' },
  ];

  countryOptions = [
    { label: 'India', value: 'India' },
    { label: 'United States', value: 'United States' },
  ];

  stateOptions = [
    { label: 'Andhra Pradesh', value: 'Andhra Pradesh' },
    { label: 'Bihar', value: 'Bihar' },
    { label: 'Gujarat', value: 'Gujarat' },
    { label: 'Haryana', value: 'Haryana' },
    { label: 'Karnataka', value: 'Karnataka' },
    { label: 'Kerala', value: 'Kerala' },
    { label: 'Madhya Pradesh', value: 'Madhya Pradesh' },
    { label: 'Maharashtra', value: 'Maharashtra' },
    { label: 'Punjab', value: 'Punjab' },
    { label: 'Rajasthan', value: 'Rajasthan' },
    { label: 'Tamil Nadu', value: 'Tamil Nadu' },
    { label: 'Telangana', value: 'Telangana' },
    { label: 'Uttar Pradesh', value: 'Uttar Pradesh' },
    { label: 'West Bengal', value: 'West Bengal' },
  ];

  cityOptions = [
    { label: 'Ahmedabad', value: 'Ahmedabad' },
    { label: 'Bangalore', value: 'Bangalore' },
    { label: 'Chennai', value: 'Chennai' },
    { label: 'Hyderabad', value: 'Hyderabad' },
    { label: 'Indore', value: 'Indore' },
    { label: 'Jaipur', value: 'Jaipur' },
    { label: 'Kolkata', value: 'Kolkata' },
    { label: 'Lucknow', value: 'Lucknow' },
    { label: 'Mumbai', value: 'Mumbai' },
    { label: 'Patna', value: 'Patna' },
    { label: 'Pune', value: 'Pune' },
  ];

  employeeSiteOptions = [
    { label: 'Gokula Developers', value: 'Gokula Developers' },
  ];

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
  this.initializeForm();
  this.initializeDesignationForm();
  this.initializeEmployeeGroupForm();
  this.loadSavedOptions();
}

  /**
   * Load persisted options from localStorage (if any) so newly added options persist across reloads.
   */
  loadSavedOptions(): void {
    try {
      const des = localStorage.getItem('designationOptions');
      if (des) {
        const parsed = JSON.parse(des);
        if (Array.isArray(parsed) && parsed.length) {
          this.designationOptions = parsed;
        }
      }

      const groups = localStorage.getItem('employeeOptions');
      if (groups) {
        const parsedG = JSON.parse(groups);
        if (Array.isArray(parsedG) && parsedG.length) {
          this.employeeOptions = parsedG;
        }
      }
    } catch (e) {
      // ignore parse errors and continue with defaults
      console.warn('Failed to load saved options', e);
    }
    // ensure UI picks up the changes
    this.cdr.detectChanges();
  }

  initializeDesignationForm(): void {
    this.designationForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      description: ['', Validators.required]
    });
  }

  initializeEmployeeGroupForm(): void {
    this.employeeGroupForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      description: ['', Validators.required]
    });
  }



  initializeForm(): void {
    this.employeeForm = this.fb.group({
      salutation: ['', Validators.required],
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      gender: ['M', Validators.required],
      dateOfBirth: [null, Validators.required],
      phone: ['', Validators.required],
      noPhone: [false],
      id: [this.employee?.id || this.generateEmployeeId()],
      email: ['', [Validators.required, Validators.email]],
      designation: ['', Validators.required],
      employeeGroup: [''],
      reportingManager: [''],
      department: ['', Validators.required],
      relievingDate: [null],
      site: [''],
      country: [''],
      state: [''],
      city: [''],
      zipCode: [''],
      age: [25, [Validators.required, Validators.min(18), Validators.max(100)]],
      status: ['Active', Validators.required],
    });

    this.employeeForm.get('noPhone')?.valueChanges.subscribe(checked => {
    const phoneControl = this.employeeForm.get('phone');

    if (checked) {
      phoneControl?.disable();
      phoneControl?.clearValidators();
      phoneControl?.setValue('');
    } else {
      phoneControl?.enable();
      phoneControl?.setValidators(Validators.required);
    }

    phoneControl?.updateValueAndValidity();
  });

    if (this.isEditMode) {
      this.employeeForm.get('id')?.disable();
    }
  }

  generateEmployeeId(): string {
    return `EMP-${Date.now()}`;
  }

  handleHide(): void {
  this.visible = false;
  this.visibleChange.emit(false);
}


  onClear(): void {
  this.employeeForm.reset();

  this.employeeForm.patchValue({
    id: this.generateEmployeeId(),
    status: 'Active'
  });
}


  onSubmit(): void {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    const formValue = this.employeeForm.getRawValue();

    const request = this.isEditMode
      ? this.employeeService.updateEmployee(formValue)
      : this.employeeService.addEmployee(formValue);

    request.subscribe({
      next: () => this.save.emit(),
      error: (err) => console.error('Operation failed:', err)
    });
  }

  // Allow parent to open the dialog programmatically to avoid change-detection timing issues
  open(): void {
    this.visible = true;
  }

  // Designation dialog handlers
  openDesignationDialog(): void {
    this.designationForm.reset();
    this.showDesignationDialog = true;
  }

  closeDesignationDialog(): void {
    this.showDesignationDialog = false;
  }

  saveDesignation(): void {
    if (this.designationForm.invalid) {
      this.designationForm.markAllAsTouched();
      return;
    }

    const { name, code, description } = this.designationForm.value;
    const optionCode = code && code.toString().trim() ? code.toString().trim() : `${name.replace(/\s+/g, '_')}_${Date.now()}`;

    // Add new designation option and persist
    this.designationOptions = [...this.designationOptions, { label: name, value: optionCode }];
    try {
      localStorage.setItem('designationOptions', JSON.stringify(this.designationOptions));
    } catch (e) {
      console.warn('Failed to persist designation options', e);
    }

    // Select the newly created designation in the main form
    this.employeeForm.patchValue({ designation: optionCode });
    this.showDesignationDialog = false;
    // ensure the dropdown overlay updates
    this.cdr.detectChanges();
  }

  // Employee group dialog handlers
  openEmployeeGroupDialog(): void {
    this.employeeGroupForm.reset();
    this.showEmployeeGroupDialog = true;
  }

  closeEmployeeGroupDialog(): void {
    this.showEmployeeGroupDialog = false;
  }

  saveEmployeeGroup(): void {
    if (this.employeeGroupForm.invalid) {
      this.employeeGroupForm.markAllAsTouched();
      return;
    }

    const { name, code, description } = this.employeeGroupForm.value;
    const optionCode = code && code.toString().trim() ? code.toString().trim() : `${name.replace(/\s+/g, '_')}_${Date.now()}`;

    // Add new employee group option and persist
    this.employeeOptions = [...this.employeeOptions, { label: name, value: optionCode }];
    try {
      localStorage.setItem('employeeOptions', JSON.stringify(this.employeeOptions));
    } catch (e) {
      console.warn('Failed to persist employee group options', e);
    }

    // Select the newly created group in the main form
    this.employeeForm.patchValue({ employeeGroup: optionCode });

    this.showEmployeeGroupDialog = false;
    // ensure the dropdown overlay updates
    this.cdr.detectChanges();
  }

}
