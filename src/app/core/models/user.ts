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

export interface Offer {
  Id: number;
  Description: string;
  PaymentMethod: string;
  OfferStatus: string;
  OfferTime: string;
  Weight: number;
  Category: string;
  IsBreakable: boolean;
  Price: number;
  CreatedAt: string;
  UpdatedAt: string;
  SenderId: string;
  CourierId?: string;
  PickupStationId: number;
  DropoffStationId: number;
}


export interface Request {
  Id: number;
  Message: string;
  Status: string;
  ReqTime: string;
  CourierId: string;
  CreatedAt: string;
  UpdatedAt: string;
  OfferId: number;
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


