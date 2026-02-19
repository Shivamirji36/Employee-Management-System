import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';

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
import { OnChanges, SimpleChanges } from '@angular/core';


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
export class EmployeeModalComponent implements OnInit, OnChanges {

  @Input() employee: Employee | null = null;
  @Input() isEditMode = false;
  @Input() visible: boolean = false;

  @Output() save = new EventEmitter<void>();
  @Output() visibleChange = new EventEmitter<boolean>();

  employeeForm!: FormGroup;
  designationForm!: FormGroup;
  employeeGroupForm!: FormGroup;

  showDesignationDialog = false;
  showEmployeeGroupDialog = false;
  
  originalFormValue: any = null;

  ngOnChanges(changes: SimpleChanges): void {

  if (changes['employee'] && this.employee && this.employeeForm) {

    this.employeeForm.patchValue({
      salutation: this.employee.salutation,
      firstName: this.employee.firstName,
      middleName: this.employee.middleName,
      lastName: this.employee.lastName,
      gender: this.employee.gender,
      dateOfBirth: this.employee.dob ? new Date(this.employee.dob) : null,
      phone: this.employee.mobile,
      employeeId: this.employee.employeeId,

      email: this.employee.personDetails?.email,
      designation: this.employee.personDetails?.designation,
      employeeGroup: this.employee.personDetails?.employeeGroup,
      reportingManager: this.employee.personDetails?.reportingManager,
      department: this.employee.personDetails?.department,
      status: this.employee.personDetails?.status,
      relievingDate: this.employee.personDetails?.relievingDate
        ? new Date(this.employee.personDetails.relievingDate)
        : null,
      site: this.employee.personDetails?.site,

      country: this.employee.address?.country,
      state: this.employee.address?.state,
      city: this.employee.address?.city,
      zipCode: this.employee.address?.zipCode,
      addressLine1: this.employee.address?.addressLine1,
      addressLine2: this.employee.address?.addressLine2
    });

    if (this.isEditMode) {
      this.employeeForm.get('employeeId')?.disable({ emitEvent: false });
    }
  }
}



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
    { label: 'Developer', value: 'Developer' },
    { label: 'Diet Specialist', value: 'Diet Specialist' },
    { label: 'Front Desk Executive', value: 'Front Desk Executive' },
    { label: 'IT Manager', value: 'IT Manager' },
    { label: 'Lab Technician', value: 'Lab Technician' },
    { label: 'Nurse', value: 'Nurse' }
  ];

  employeeOptions = [
    { label: 'Finance and Accounts', value: 'Finance and Accounts' },
    { label: 'IT Team', value: 'IT Team' },
    { label: 'Laboratory', value: 'LABORATORY' },
    { label: 'Physician', value: 'Physician' }
  ];

  employeeDepOptions = [
    { label: 'Ambulance Department', value: 'Ambulance Department' },
    { label: 'Cardiology Department', value: 'Cardiology Department' },
    { label: 'Dermatology Department', value: 'Dermatology Department' },
    { label: 'ER', value: 'ER' },
    { label: 'Finance and Accounts', value: 'Finance and Accounts' }
  ];

  countryOptions = [
    { label: 'India', value: 'India' },
    { label: 'United States', value: 'United States' }
  ];

  stateOptions = [
    { label: 'Karnataka', value: 'Karnataka' },
    { label: 'Maharashtra', value: 'Maharashtra' },
    { label: 'Tamil Nadu', value: 'Tamil Nadu' },
    { label: 'Telangana', value: 'Telangana' }
  ];

  cityOptions = [
    { label: 'Bangalore', value: 'Bangalore' },
    { label: 'Mumbai', value: 'Mumbai' },
    { label: 'Hyderabad', value: 'Hyderabad' },
    { label: 'Chennai', value: 'Chennai' }
  ];

  employeeSiteOptions = [
    { label: 'Gokula Developers', value: 'Gokula Developers' }
  ];

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private cdr: ChangeDetectorRef
  ) {}

  // ================= VALIDATORS =================

  /**
   * Validator to ensure field contains only numbers
   */
  numericOnly(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Don't validate empty values
      }
      const valid = /^\d+$/.test(control.value);
      return valid ? null : { numericOnly: true };
    };
  }

  // ================= INIT =================

  ngOnInit(): void {
    this.initializeForm();
    this.initializeDesignationForm();
    this.initializeEmployeeGroupForm();
    this.loadSavedOptions();
  }

  // ================= LOAD LOCAL STORAGE =================

  loadSavedOptions(): void {
    try {
      const des = localStorage.getItem('designationOptions');
      if (des) {
        this.designationOptions = JSON.parse(des);
      }

      const groups = localStorage.getItem('employeeOptions');
      if (groups) {
        this.employeeOptions = JSON.parse(groups);
      }

    } catch (e) {
      console.warn('Failed to load saved options', e);
    }

    this.cdr.detectChanges();
  }

  // ================= FORM INIT =================

  initializeForm(): void {
    this.employeeForm = this.fb.group({
      salutation: ['', Validators.required],
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      gender: ['M', Validators.required],
      dateOfBirth: [null],
      phone: ['', [Validators.required, this.numericOnly()]],
      noPhone: [false],
      employeeId: [{ value: this.employee?.employeeId || this.employee?.employeeId || this.generateEmployeeId() }],
      email: ['', [Validators.required, Validators.email]],
      designation: [''],
      employeeGroup: [''],
      reportingManager: [''],
      department: ['', Validators.required],
      relievingDate: [null],
      site: ['', Validators.required],
      country: [''],
      state: [''],
      city: [''],
      zipCode: ['', this.numericOnly()],
      age: [25, [Validators.required, Validators.min(18), Validators.max(100)]],
      status: ['Active', Validators.required],
      addressLine1: [''],
      addressLine2: [''],

    });

    // No phone toggle logic
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

    // id control is created with disabled state when in edit mode to avoid
    // ExpressionChangedAfterItHasBeenCheckedError as recommended by Angular.
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

  generateEmployeeId(): string {
    return `EMP-${Date.now()}`;
  }

  // ================= ACTIONS =================

  handleHide(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onCancel(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onClear(): void {
    this.employeeForm.reset();
    this.employeeForm.patchValue({
      employeeId: this.generateEmployeeId(),
      status: 'Active'
    });
  }

  hasFormChanged(): boolean {
    if (!this.isEditMode || !this.originalFormValue) {
      return true;
    }
    const currentValue = this.employeeForm.getRawValue();
    return JSON.stringify(currentValue) !== JSON.stringify(this.originalFormValue);
  }

  onSubmit(): void {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      alert('Please fill all required fields correctly');
      return;
    }

    // Check if data has changed in edit mode
    if (this.isEditMode && !this.hasFormChanged()) {
      alert('No changes detected. No update needed.');
      return;
    }

    const formValue = this.employeeForm.getRawValue();

    // Split form data into three separate objects
    const personData = {
      salutation: formValue.salutation,
      firstName: formValue.firstName,
      middleName: formValue.middleName,
      lastName: formValue.lastName,
      gender: formValue.gender,
      dob: formValue.dateOfBirth,
      mobile: formValue.phone,
      employeeId: formValue.employeeId
    };

    const personDetailsData = {
      email: formValue.email,
      designation: formValue.designation,
      employeeGroup: formValue.employeeGroup,
      reportingManager: formValue.reportingManager,
      department: formValue.department,
      status: formValue.status,
      relievingDate: formValue.relievingDate,
      site: formValue.site
    };

    const addressData = {
      country: formValue.country,
      state: formValue.state,
      city: formValue.city,
      zipCode: formValue.zipCode,
      addressLine1: formValue.addressLine1,
      addressLine2: formValue.addressLine2
    };

    // Create the complete request object with nested structure
    const completeData = {
      ...personData,
      personDetails: personDetailsData,
      address: addressData
    };

    console.log('Submitting form data:', completeData);

    const request = this.isEditMode
      ? this.employeeService.updateEmployee(completeData)
      : this.employeeService.addEmployee(completeData);

    request.subscribe({
      next: (response) => {
        console.log('Form submitted successfully:', response);
        alert('Employee saved successfully!');
        this.save.emit();
        this.visible = false;
        this.visibleChange.emit(false);
        this.employeeForm.reset();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Operation failed:', err);
        alert('Error saving employee: ' + err.message);
      }
    });
  }

  // ================= DESIGNATION =================

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

    const { name, code } = this.designationForm.value;

    const optionCode =
      code?.trim() || `${name.replace(/\s+/g, '_')}_${Date.now()}`;

    this.designationOptions = [
      ...this.designationOptions,
      { label: name, value: optionCode }
    ];

    localStorage.setItem(
      'designationOptions',
      JSON.stringify(this.designationOptions)
    );

    this.employeeForm.patchValue({ designation: optionCode });

    this.showDesignationDialog = false;
    this.cdr.detectChanges();
  }

  // ================= EMPLOYEE GROUP =================

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

    const { name, code } = this.employeeGroupForm.value;

    const optionCode =
      code?.trim() || `${name.replace(/\s+/g, '_')}_${Date.now()}`;

    this.employeeOptions = [
      ...this.employeeOptions,
      { label: name, value: optionCode }
    ];

    localStorage.setItem(
      'employeeOptions',
      JSON.stringify(this.employeeOptions)
    );

    this.employeeForm.patchValue({ employeeGroup: optionCode });

    this.showEmployeeGroupDialog = false;
    this.cdr.detectChanges();
  }
}
