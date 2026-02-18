export interface PersonDetails {
  email: string;
  designation: string;
  employeeGroup: string;
  reportingManager: string;
  department: string;
  status: string;
  relievingDate: string;
  site: string;
}

export interface Address {
  country: string;
  state: string;
  city: string;
  zipCode: string;
  addressLine1: string;
  addressLine2: string;
}

export interface Employee {
  id?: string;
  employeeId?: string;
  name?: string;
  email?: string;
  phone?: string;
  gender?: string;
  age?: number;
  dateOfBirth?: string;
  employeeGroup?: string;
  designation?: string;
  department?: string;
  reportingManager?: string;
  status?: 'Active' | 'Inactive' | string;
  profilePicture?: string;
  salutation?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dob?: string;
  mobile?: string;
  personDetails?: PersonDetails;
  address?: Address;
}