// src/app/core/models/user.ts
export interface User {
  Id: string;
  Name: string;
  Email: string;
  PhoneNumber: string;
  Governorate: string;
  City: string;
  Image?: string; 
  CreatedAt?: string; // أضفنا joinDate عشان تتطابق مع الـ HTML
  Balance?: number;
}
export enum PaymentMethod {
  EtisalatCash = 0,
  VodafoneCash = 1,
  PayPal = 2,
  Stripe = 3,
  AccountNumber = 4
}
export enum OfferStatus {
  Canceled = 'Canceled',
  OnWay = 'OnWay',
  Delivered = 'Delivered',
  Pending = 'Pending',
  InProgress = 'InProgress',
  Completed = 'Completed'
}

export interface Offer {
  ID: number;
  PaymentMethod: PaymentMethod;
  OfferStatus: OfferStatus;
  OfferTime: string;
  Description: string;
  LastUpdate: string;
  Picture?: string;
  Weight: number;
  Category: string;
  IsBreakable: boolean;
  Price: number;
  CreatedAt: string;
  UpdatedAt: string;
  SenderId: string;
  SenderName: string;
  CourierId?: string;
  CourierName?: string;
  PickupStationId: number;
  PickupStationName: string;
  DropoffStationId: number;
  DropoffStationName: string;
  RequestsCount: number;
  AcceptedRequestsCount: number;
  Requests: Request[];
} 

export interface Request {
  Id: number;
  OfferId: number;
  OfferDescription?: string;
  CourierId: string;
  CourierName?: string;
  Message: string;
  CreatedAt: string;
  UpdatedAt: string;
  SenderId?: string;
  FromStationId: number;
  ReqTime: string;
  RequestStatus: RequestStatus; 
}

export enum RequestStatus {
  Pending = 0,
  Accepted = 1,
  Rejected = 2,
  completed = 3
}


// src/app/core/models/user.ts
export interface UserOffersResponse {
  sentOffers: Offer[];
  requestedOffers: Offer[];
}

 export interface DecodedToken {
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role": string;
  exp: number;
  [key: string]: any;
}


