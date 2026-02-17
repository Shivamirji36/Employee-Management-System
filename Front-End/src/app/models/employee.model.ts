export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  age: number;
  dateOfBirth: string;
  employeeGroup: string;
  designation: string;
  department: string;
  reportingManager: string;
  status: 'Active' | 'Inactive';
  profilePicture?: string;
  salutation?: string;
}