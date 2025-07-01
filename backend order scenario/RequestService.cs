using Microsoft.AspNetCore.Identity;
using Trainy.Repositories;
using TraintFinalProject.Model;
using Trainy.ViewModels;
using TraintFinalProject.Model.Enums;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using System.Linq;
using System.Collections.Generic;
using System;
using TrainyFinalProject.TrainyContextFile;
using Traint.Models.Model.UserRols;

namespace Trainy.Services
{
    public class RequestService
    {
        private readonly RequestRepository _requestRepository;
        private readonly OfferRepository _offerRepository;
        private readonly UserManager<User> _userManager;
        private readonly EmailSenderService _emailSenderService;
        private readonly WalletService _walletService;
        private readonly VerificationRepository _verificationRepository;
        private readonly TrainyContext _context;

        public RequestService(
            RequestRepository requestRepository,
            OfferRepository offerRepository,
            UserManager<User> userManager,
            EmailSenderService emailSenderService,
            WalletService walletService,
            VerificationRepository verificationRepository,
            TrainyContext context)
        {
            _requestRepository = requestRepository;
            _offerRepository = offerRepository;
            _userManager = userManager;
            _emailSenderService = emailSenderService;
            _walletService = walletService;
            _verificationRepository = verificationRepository;
            _context = context;
        }

        public async Task<(bool CanProceed, string Message)> CheckUserRoleAsync(string userId, string requiredRole)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return (false, "User not found.");
            }

            if (await _userManager.IsInRoleAsync(user, requiredRole))
            {
                return (true, "User has the required role.");
            }
            return (false, $"User does not have the required role: {requiredRole}. Please complete the verification process if you haven't.");
        }

        public async Task<(bool CanProceed, string Message)> CheckUserVerifiedAndHasRoleAsync(string userId, string requiredRole)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return (false, "User not found.");
            }

            var isInRole = await _userManager.IsInRoleAsync(user, requiredRole);
            if (!isInRole)
            {
                // Special case: If a user is verified as a Courier and wants to be a Sender, we'll handle it
                if (requiredRole == "Sender" && await _userManager.IsInRoleAsync(user, "Courier"))
                {
                    // Check if the user is verified as a Courier
                    var isCourierVerified = await _verificationRepository.IsUserVerifiedForRoleAsync(userId, "Courier");
                    if (isCourierVerified)
                    {
                        // Add the Sender role automatically
                        var roleResult = await _userManager.AddToRoleAsync(user, "Sender");
                        if (roleResult.Succeeded)
                        {
                            // Create a Sender entity if it doesn't exist
                            var existingSender = await _context.Senders.FirstOrDefaultAsync(s => s.UserId == userId);
                            if (existingSender == null)
                            {
                                var sender = new Sender
                                {
                                    UserId = userId,
                                    Offers = new List<Offer>(),
                                    DeliveryChats = new List<DeliveryChat>()
                                };
                                _context.Senders.Add(sender);
                                await _context.SaveChangesAsync();
                            }
                            return (true, "User is automatically verified as a Sender because they are already verified as a Courier.");
                        }
                        else
                        {
                            return (false, "Failed to add Sender role automatically. Please contact support.");
                        }
                    }
                }
                return (false, $"You do not have the '{requiredRole}' role. Please ensure you are verified for this role.");
            }

            var isVerified = await _verificationRepository.IsUserVerifiedForRoleAsync(userId, requiredRole);
            if (!isVerified)
            {
                return (false, $"You have the '{requiredRole}' role, but your verification is not approved or found. Please complete the verification process or contact support.");
            }
            return (true, "User is verified and has the role.");
        }

        public async Task<bool> HasExistingRequestAsync(int offerId, string courierId)
        {
            return await _requestRepository.GetList(r => r.OfferId == offerId && r.CourierId == courierId && !r.IsDeleted)
                .AnyAsync();
        }

        public async Task CreateRequest(RequestCreateModel model, string courierId)
        {
            var offer = _offerRepository.GetById(model.OfferId);
            if (offer == null)
                throw new KeyNotFoundException($"Offer with ID {model.OfferId} not found.");

            if (offer.OfferStatus != OfferStatus.Pending)
                throw new InvalidOperationException("This offer is not available for requests.");

            // Check if the courier already has a request for this offer
            var hasExistingRequest = await HasExistingRequestAsync(model.OfferId, courierId);
            if (hasExistingRequest)
                throw new InvalidOperationException("You have already submitted a request for this offer.");

            var request = model.ToModel(courierId);
            _requestRepository.Add(request);

            // Notify the Sender via email
            var sender = offer.Sender;
            var courier = await _userManager.FindByIdAsync(courierId);
            if (sender != null && courier != null)
            {
                var emailBody = $@"
                    <html>
                        <body style='font-family: Arial, sans-serif; padding: 20px;'>
                            <h2>New Request for Your Offer</h2>
                            <p>Hello {sender.User.UserName},</p>
                            <p>A courier ({courier.UserName}) has submitted a request for your offer (ID: {offer.ID}).</p>
                            <p><strong>Offer Description:</strong> {offer.Description}</p>
                            <p><strong>Request Message:</strong> {model.Message}</p>
                            <p>Please review the request and accept or reject it.</p>
                        </body>
                    </html>";
                await _emailSenderService.SendEmailAsync(sender.User.Email, "New Request for Your Offer", emailBody);
            }
        }

        public async Task AcceptRequest(int requestId, string senderId)
        {
            if (requestId <= 0)
                throw new ArgumentException("RequestId must be greater than zero.", nameof(requestId));

            if (string.IsNullOrEmpty(senderId))
                throw new ArgumentException("SenderId cannot be null or empty.", nameof(senderId));

            var request = _requestRepository.GetById(requestId);
            if (request == null)
                throw new InvalidOperationException("Request not found.");

            var offer = request.Offer;
            if (offer == null)
                throw new InvalidOperationException("Offer not found for this request.");

            if (offer.SenderId != senderId)
                throw new UnauthorizedAccessException("You are not authorized to accept this request.");

            if (request.Status != RequestStatus.Pending)
            {
                throw new InvalidOperationException("This request has already been processed.");
            }

            if (offer.OfferStatus != OfferStatus.Pending)
                throw new InvalidOperationException("This offer is not available for requests.");

            // خصم الفلوس من محفظة الـ Sender وتعليقها كـ Transaction
            _walletService.DeductForRequestAcceptance(offer.ID, senderId, request.CourierId);

            // Update the request status
            _requestRepository.UpdateStatus(requestId, RequestStatus.Accepted);

            // Update the offer
            offer.CourierId = request.CourierId;
            offer.OfferStatus = OfferStatus.InProgress;
            offer.UpdatedAt = DateTime.UtcNow;
            offer.LastUpdate = DateTime.UtcNow;
            _offerRepository.Update(offer);

            // Notify the Courier via email
            var courier = request.Courier;
            if (courier != null)
            {
                var emailBody = $@"
                    <html>
                        <body style='font-family: Arial, sans-serif; padding: 20px;'>
                            <h2>Your Request Has Been Accepted</h2>
                            <p>Hello {courier.User.UserName},</p>
                            <p>Your request for offer (ID: {offer.ID}) has been accepted!</p>
                            <p><strong>Offer Description:</strong> {offer.Description}</p>
                            <p>Please proceed with the delivery as agreed.</p>
                        </body>
                    </html>";
                await _emailSenderService.SendEmailAsync(courier.User.Email, "Request Accepted", emailBody);
            }
        }

        public async Task RejectRequest(int requestId, string senderId)
        {
            var request = _requestRepository.GetById(requestId);
            if (request == null)
                throw new InvalidOperationException("Request not found.");

            var offer = request.Offer;
            if (offer == null)
                throw new InvalidOperationException("Offer not found for this request.");

            if (offer.SenderId != senderId)
                throw new UnauthorizedAccessException("You are not authorized to reject this request.");

            if (request.Status != RequestStatus.Pending)
                throw new InvalidOperationException("This request has already been processed.");

            // Update the request status
            _requestRepository.UpdateStatus(requestId, RequestStatus.Rejected);

            // Notify the Courier via email
            var courier = request.Courier;
            if (courier != null)
            {
                var emailBody = $@"
                    <html>
                        <body style='font-family: Arial, sans-serif; padding: 20px;'>
                            <h2>Your Request Has Been Rejected</h2>
                            <p>Hello {courier.User.UserName},</p>
                            <p>Your request for offer (ID: {offer.ID}) has been rejected by the sender.</p>
                            <p><strong>Offer Description:</strong> {offer.Description}</p>
                        </body>
                    </html>";
                await _emailSenderService.SendEmailAsync(courier.User.Email, "Request Rejected", emailBody);
            }
        }

        public PaginationViewModel<RequestViewModel> GetRequestsByOffer(int offerId, int pageNumber = 1, int pageSize = 4)
        {
            var query = _requestRepository.GetList(r => r.OfferId == offerId);
            var totalCount = query.Count();
            var requests = query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return new PaginationViewModel<RequestViewModel>
            {
                Data = requests.ToViewModelList(),
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalCount = totalCount
            };
        }

        public PaginationViewModel<RequestViewModel> GetRequestsByCourier(string courierId, int pageNumber = 1, int pageSize = 4)
        {
            var query = _requestRepository.GetList(r => r.CourierId == courierId);
            var totalCount = query.Count();
            var requests = query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return new PaginationViewModel<RequestViewModel>
            {
                Data = requests.ToViewModelList(),
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalCount = totalCount
            };
        }

        // New methods to support the RequestController

        public PaginationViewModel<RequestViewModel> GetRequests(int pageNumber = 1, int pageSize = 10)
        {
            var query = _requestRepository.GetList(r => true);
            var totalCount = query.Count();
            var requests = query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return new PaginationViewModel<RequestViewModel>
            {
                Data = requests.ToViewModelList(),
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalCount = totalCount
            };
        }

        public async Task<RequestViewModel> GetRequestByIdAsync(int id)
        {
            var request = _requestRepository.GetById(id);
            if (request == null)
                throw new KeyNotFoundException($"Request with ID {id} not found.");

            return request.ToViewModel();
        }

        public async Task UpdateRequest(int id, RequestUpdateModel model, string courierId)
        {
            var request = _requestRepository.GetById(id);
            if (request == null)
                throw new KeyNotFoundException($"Request with ID {id} not found.");

            if (request.CourierId != courierId)
                throw new UnauthorizedAccessException("You are not authorized to update this request.");

            if (request.Status != RequestStatus.Pending)
                throw new InvalidOperationException("Only pending requests can be updated.");

            // Update request properties
            request.Message = model.Message;
            request.FromStationId = model.FromStationId;
            request.UpdatedAt = DateTime.UtcNow;

            _requestRepository.Update(request);
        }

        public async Task UpdateRequestStatus(int id, RequestStatus status, string userId)
        {
            var request = _requestRepository.GetById(id);
            if (request == null)
                throw new KeyNotFoundException($"Request with ID {id} not found.");

            var offer = request.Offer;
            
            // Check authorization
            bool isAuthorized = false;
            if (request.CourierId == userId) // Courier can update their own request
                isAuthorized = true;
            else if (offer != null && offer.SenderId == userId) // Sender can update requests for their offers
                isAuthorized = true;
            else
            {
                // Check if user is admin
                var user = await _userManager.FindByIdAsync(userId);
                if (user != null && await _userManager.IsInRoleAsync(user, "Admin"))
                    isAuthorized = true;
            }

            if (!isAuthorized)
                throw new UnauthorizedAccessException("You are not authorized to update this request's status.");

            // Update the status
            _requestRepository.UpdateStatus(id, status);

            // If request is completed, update the offer status if needed
            if (status == RequestStatus.completed && offer != null && offer.OfferStatus == OfferStatus.InProgress)
            {
                offer.OfferStatus = OfferStatus.Completed;
                offer.UpdatedAt = DateTime.UtcNow;
                _offerRepository.Update(offer);
            }
        }

        public async Task DeleteRequest(int id, string userId)
        {
            var request = _requestRepository.GetById(id);
            if (request == null)
                throw new KeyNotFoundException($"Request with ID {id} not found.");

            // Check authorization - only courier who created the request or admin can delete it
            bool isAuthorized = false;
            if (request.CourierId == userId)
                isAuthorized = true;
            else
            {
                // Check if user is admin
                var user = await _userManager.FindByIdAsync(userId);
                if (user != null && await _userManager.IsInRoleAsync(user, "Admin"))
                    isAuthorized = true;
            }

            if (!isAuthorized)
                throw new UnauthorizedAccessException("You are not authorized to delete this request.");

            // Only pending requests can be deleted
            if (request.Status != RequestStatus.Pending)
                throw new InvalidOperationException("Only pending requests can be deleted.");

            _requestRepository.Delete(id);
        }

        public async Task<RequestDetailViewModel> GetRequestDetailByIdAsync(int requestId)
        {
            var request = await _requestRepository.GetRequestByIdWithDetailsAsync(requestId);
            if (request == null)
            {
                return null;
            }
            
            return new RequestDetailViewModel
            {
                ID = request.ID,
                Message = request.Message,
                Status = request.Status.ToString(),
                CreatedAt = request.CreatedAt,
                UpdatedAt = request.UpdatedAt,
                ReqTime = request.ReqTime,
                CourierId = request.CourierId,
                CourierName = request.Courier?.User?.UserName,
                CourierProfileImage = request.Courier?.User?.Image,
                CourierPhone = request.Courier?.User?.PhoneNumber,
                CourierEmail = request.Courier?.User?.Email,
                OfferId = request.OfferId,
                OfferDescription = request.Offer?.Description,
                PickupStationName = request.Offer?.PickupStation?.Name,
                DropoffStationName = request.Offer?.DropoffStation?.Name
            };
        }
    }
}
