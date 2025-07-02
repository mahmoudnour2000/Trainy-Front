import { User } from './user';

export enum Gender {
  Male = 0,
  Female = 1
}

export interface IUserRegister {
  UserName: string,
  Email: string,
  Password: string,
  ConfirmPassword: string,
  Governorate: string,
  City: string,
  PhoneNumber: string,
  Gender: Gender,
  DateOfBirth: string,
}

export interface IUserLogin {
  LoginMethod: string;
  Password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
