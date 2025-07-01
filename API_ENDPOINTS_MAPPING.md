# API Endpoints Mapping - Frontend ↔ Backend

## 🎯 **Overview**
This document maps all Angular frontend service methods to their corresponding .NET backend API endpoints.

---

## 📦 **Offer Service** → OfferController.cs

| Frontend Method | Backend Endpoint | HTTP Method | Auth Required | Description |
|----------------|------------------|-------------|---------------|-------------|
| `getOffers()` | `/api/Offer` | GET | ✅ Sender,Courier | Get paginated offers |
| `getOfferById()` | `/api/Offer/{id}` | GET | ✅ Sender,Courier | Get specific offer |
| `createOffer()` | `/api/Offer` | POST | ✅ Sender | Create new offer with image upload |
| `updateOffer()` | `/api/Offer/{id}` | PUT | ✅ Sender | Update existing offer |
| `updateOfferStatus()` | `/api/Offer/{id}/status` | PUT | ✅ Sender,Courier,Admin | Update offer status |
| `deleteOffer()` | `/api/Offer/{id}` | DELETE | ✅ Sender,Admin | Delete offer |
| `getOffersBySender()` | `/api/Offer/sender/{senderId}` | GET | ✅ Sender | Get offers by sender |
| `getOffersByCourier()` | `/api/Offer/courier/{courierId}` | GET | ✅ Courier | Get offers by courier |
| `getOffersByStation()` | `/api/Offer/station/{stationId}` | GET | ✅ Sender,Courier | Get offers by station |

### 📝 **Form Data Fields for File Upload:**
- **Field Name**: `ImageFile` (not `image`)
- **File Types**: Image files (JPG, PNG)
- **Size Limit**: 10MB

### 🔄 **Offer Status Enum:**
```typescript
enum OfferStatus {
  Pending = 0,
  InProgress = 1,
  OnWay = 2,
  Delivered = 3,
  Completed = 4,
  Canceled = 5
}
```

---

## 📬 **Request Service** → RequestController.cs

| Frontend Method | Backend Endpoint | HTTP Method | Auth Required | Description |
|----------------|------------------|-------------|---------------|-------------|
| `getRequests()` | `/api/Request` | GET | ✅ Admin | Get all requests (admin only) |
| `getRequestById()` | `/api/Request/{id}` | GET | ✅ Auth | Get specific request |
| `createRequest()` | `/api/Request` | POST | ✅ Courier | Create new request |
| `updateRequest()` | `/api/Request/{id}` | PUT | ✅ Courier | Update request |
| `updateRequestStatus()` | `/api/Request/{id}/status` | PUT | ✅ Sender,Courier,Admin | Update request status |
| `deleteRequest()` | `/api/Request/{id}` | DELETE | ✅ Courier,Admin | Delete request |
| `acceptRequest()` | `/api/Request/{requestId}/accept` | POST | ✅ Sender | Accept courier request |
| `rejectRequest()` | `/api/Request/{requestId}/reject` | POST | ✅ Sender | Reject courier request |
| `getRequestsForOffer()` | `/api/Request/offer/{offerId}` | GET | ✅ Sender | Get requests for specific offer |
| `getRequestsByCourier()` | `/api/Request/courier/{courierId}` | GET | ✅ Courier | Get requests by courier |
| `hasExistingRequest()` | Frontend Helper | - | - | Check if courier has pending request |

### 🔄 **Request Status Enum:**
```typescript
enum RequestStatus {
  Pending = 0,
  Accepted = 1,
  Rejected = 2,
  Completed = 3
}
```

---

## ✅ **Verification Service** → VerificationController.cs

| Frontend Method | Backend Endpoint | HTTP Method | Auth Required | Description |
|----------------|------------------|-------------|---------------|-------------|
| `submitVerification()` | `/api/Verification/submit` | POST | ✅ Auth | Submit verification documents |
| `getMyVerificationStatus()` | `/api/Verification/my-status` | GET | ✅ Auth | Get user's verification status |
| `refreshVerificationStatus()` | Frontend Helper | - | - | Refresh status from backend |

### 📝 **Form Data Fields for File Upload:**
- **RequestedRole**: 'Sender' or 'Courier'
- **NationalId**: 14-digit national ID
- **Photo1**: ID document image
- **Photo2**: Selfie with ID image
- **File Size Limit**: 10MB per image

### 🔄 **Verification Status Enum:**
```typescript
type VerificationStatusType = 'NotSubmitted' | 'Pending' | 'Approved' | 'Rejected';
```

---

## 🔐 **Authentication & Authorization**

### **Role-Based Access:**
- **Sender**: Can create offers, view own offers, accept/reject requests
- **Courier**: Can view offers, create requests, update own requests
- **Admin**: Full access to all endpoints

### **Verification Requirements:**
- **Creating Offers**: Requires approved Sender verification
- **Creating Requests**: Requires approved Courier verification
- **Backend Validation**: Controllers check verification status automatically

---

## 🌐 **Environment Configuration**

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5299/api/',
  hubUrl: 'http://localhost:5299/',
};
```

---

## ✅ **Validation & Error Handling**

### **Backend Error Responses:**
- **400 Bad Request**: Validation errors, invalid data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions or unverified user
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side errors

### **Frontend Error Handling:**
All services include proper error handling with Arabic error messages where applicable.

---

## 🚀 **Ready for Production**

All frontend services are now **100% compatible** with the backend API endpoints. The data will properly flow to and from your .NET database through these mapped endpoints.

### **Next Steps:**
1. ✅ Frontend services updated and mapped
2. ✅ FormData field names corrected
3. ✅ Status enums synchronized
4. ✅ Authentication integration ready
5. ✅ Verification workflow complete

Your Angular application is now fully connected to your .NET backend! 🎉 