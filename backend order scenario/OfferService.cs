using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Trainy.Repositories;
using TraintFinalProject.Model;
using Trainy.ViewModels;
using TraintFinalProject.Model.Enums;
using System.Threading.Tasks;
using System.Linq;

namespace Trainy.Services
{
    public class OfferService
    {
        private readonly OfferRepository _offerRepository;
        private readonly UserManager<User> _userManager;
        private readonly VerificationRepository _verificationRepository;

        public OfferService(OfferRepository offerRepository, UserManager<User> userManager, VerificationRepository verificationRepository)
        {
            _offerRepository = offerRepository;
            _userManager = userManager;
            _verificationRepository = verificationRepository;
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
                return (false, $"You do not have the '{requiredRole}' role. Please ensure you are verified for this role.");
            }

            var isVerified = await _verificationRepository.IsUserVerifiedForRoleAsync(userId, requiredRole);
            if (!isVerified)
            {
                return (false, $"You have the '{requiredRole}' role, but your verification is not approved or found. Please complete the verification process or contact support.");
            }
            return (true, "User is verified and has the role.");
        }

        public void CreateOffer(OfferCreateModel model, string senderId)
        {
            var offer = model.ToModel(senderId);
            _offerRepository.Add(offer);
        }

        public PaginationViewModel<OfferViewModel> GetOffers(int pageNumber = 1, int pageSize = 4)
        {
            var query = _offerRepository.GetList(filter: null);
            
            var totalCount = query.Count();
            var offers = query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return new PaginationViewModel<OfferViewModel>
            {
                Data = offers.Select(o => o.ToViewModel()).ToList(),
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalCount = totalCount
            };
        }

        public OfferViewModel GetOfferById(int id)
        {
            var offer = _offerRepository.GetById(id);
            return offer.ToViewModel();
        }
        
        public async Task<Offer> GetOfferByIdAsync(int id)
        {
            return await _offerRepository.GetOfferByIdAsync(id);
        }

        public List<OfferViewModel> GetOffersBySender(string senderId)
        {
            var offers = _offerRepository.GetOffersBySender(senderId);
            return offers.ToViewModelList();
        }

        public List<OfferViewModel> GetOffersByCourier(string courierId)
        {
            var offers = _offerRepository.GetOffersByCourier(courierId);
            return offers.ToViewModelList();
        }

        public List<OfferViewModel> GetOffersByStation(int stationId)
        {
            var offers = _offerRepository.GetOffersByStation(stationId);
            return offers.ToViewModelList();
        }

        public void UpdateOffer(int id, OfferUpdateModel model, string senderId)
        {
            var offer = _offerRepository.GetById(id);
            if (offer.SenderId != senderId)
                throw new UnauthorizedAccessException("You are not authorized to update this offer.");

            if (offer.OfferStatus != OfferStatus.Pending)
                throw new InvalidOperationException("Cannot update an offer that is not in Pending status.");

            var updatedOffer = model.ToModel(offer);
            _offerRepository.Update(updatedOffer);
        }

        public async Task UpdateOfferStatus(int id, OfferStatus status, string userId)
        {
            var offer = _offerRepository.GetById(id);
            var user = await _userManager.FindByIdAsync(userId);

            if (offer.SenderId != userId && offer.CourierId != userId && !await _userManager.IsInRoleAsync(user, "Admin"))
                throw new UnauthorizedAccessException("You are not authorized to update this offer's status.");

            if (status == OfferStatus.Completed && offer.OfferStatus != OfferStatus.InProgress)
                throw new InvalidOperationException("Offer must be InProgress to mark as Completed.");

            offer.OfferStatus = status;
            offer.LastUpdate = DateTime.UtcNow;
            offer.UpdatedAt = DateTime.UtcNow;
            _offerRepository.Update(offer);
        }

        public async Task DeleteOffer(int id, string senderId)
        {
            var offer = _offerRepository.GetById(id);
            var user = await _userManager.FindByIdAsync(senderId);
            
            if (!string.IsNullOrEmpty(senderId))
            {
                if (user == null)
                {
                    throw new KeyNotFoundException("User not found.");
                }
                if (!await _userManager.IsInRoleAsync(user, "Admin") && offer.SenderId != senderId)
                {
                    throw new UnauthorizedAccessException("You are not authorized to delete this offer.");
                }
            }
            else
            {
                // This block might be redundant if controller endpoint has [Authorize(Roles="Admin")] for specific delete paths
                // However, if a general DeleteOffer is called by admin without senderId, an explicit check might be desired here or in controller.
                // For now, assume the controller authorization handles Admin role for deletion without specific senderId.
                // If an admin is deleting, they don't need to be the senderId.
            }

            if (offer.OfferStatus != OfferStatus.Pending)
                throw new InvalidOperationException("Cannot delete an offer that is not in Pending status.");

            _offerRepository.Delete(id);
        }

        public async Task<PaginatedResult<OfferViewModel>> GetOffersForAdminAsync(
            int pageNumber, 
            int pageSize, 
            OfferStatus? statusFilter = null, 
            DateTime? fromDate = null, 
            DateTime? toDate = null, 
            string sortOrder = "desc",
            string userId = null)
        {
            var offers = await _offerRepository.GetOffersForAdminAsync(pageNumber, pageSize, statusFilter, fromDate, toDate, sortOrder, userId);
            var totalCount = await _offerRepository.GetOfferCountForAdminAsync(statusFilter, fromDate, toDate, userId);
            
            var offerViewModels = offers.Select(MapToAdminOfferViewModel).ToList();
            return new PaginatedResult<OfferViewModel>(offerViewModels, totalCount, pageNumber, pageSize);
        }

        public async Task<OfferDetailsViewModel> GetOfferWithRequestsAsync(int offerId)
        {
            var offer = await _offerRepository.GetOfferWithRequestsAsync(offerId);
            if (offer == null)
            {
                return null;
            }
            
            var offerViewModel = MapToOfferDetailsViewModel(offer);
            return offerViewModel;
        }

        public async Task DeleteOfferByAdminAsync(int offerId, string adminUsername)
        {
            var offer = await _offerRepository.GetOfferByIdAsync(offerId);
            if (offer == null)
            {
                throw new KeyNotFoundException("العرض غير موجود");
            }
            
            offer.IsDeleted = true;
            offer.UpdatedAt = DateTime.UtcNow;
            
            _offerRepository.Update(offer);
        }

        private OfferViewModel MapToAdminOfferViewModel(Offer offer)
        {
            // No need to parse the enum since we already have it directly from the entity
            var offerStatus = offer.OfferStatus;
            
            return new OfferViewModel
            {
                ID = offer.ID,
                Description = offer.Description,
                OfferStatus = offer.OfferStatus.ToString(),
                OfferTime = offer.OfferTime,
                LastUpdate = offer.LastUpdate,
                Picture = offer.Picture,
                Weight = offer.Weight,
                Category = offer.Category,
                IsBreakable = offer.IsBreakable,
                Price = offer.Price,
                CreatedAt = offer.CreatedAt,
                UpdatedAt = offer.UpdatedAt,
                PickupStationName = offer.PickupStation?.Name,
                DropoffStationName = offer.DropoffStation?.Name,
                SenderName = offer.Sender?.User?.UserName,
                CourierName = offer.Courier?.User?.UserName,
                RequestsCount = offer.Requests?.Count(r => !r.IsDeleted) ?? 0,
                AcceptedRequestsCount = offer.Requests?.Count(r => !r.IsDeleted && r.Status == RequestStatus.Accepted) ?? 0
            };
        }

        private OfferDetailsViewModel MapToOfferDetailsViewModel(Offer offer)
        {
            var offerViewModel = MapToAdminOfferViewModel(offer);
            
            var requestViewModels = offer.Requests?
                .Where(r => !r.IsDeleted)
                .Select(r => new AdminRequestViewModel
                {
                    ID = r.ID,
                    Message = r.Message,
                    Status = r.Status.ToString(),
                    CreatedAt = r.CreatedAt,
                    UpdatedAt = r.UpdatedAt,
                    CourierName = r.Courier?.User?.UserName,
                    CourierProfileImage = r.Courier?.User?.Image,
                    ReqTime = r.ReqTime
                })
                .ToList() ?? new List<AdminRequestViewModel>();
            
            return new OfferDetailsViewModel
            {
                Offer = offerViewModel,
                Requests = requestViewModels
            };
        }

        // Create a separate class for API-specific ViewModels to avoid namespace conflicts
        public class ApiOfferDetailsViewModel
        {
            public int Id { get; set; }
            public string Description { get; set; }
            public string OfferStatus { get; set; }
            public DateTime OfferTime { get; set; }
            public DateTime LastUpdate { get; set; }
            public string Picture { get; set; }
            public double Weight { get; set; }
            public string Category { get; set; }
            public bool IsBreakable { get; set; }
            public decimal Price { get; set; }
            public string PickupStationName { get; set; }
            public string DropoffStationName { get; set; }
            public int PickupStationId { get; set; }
            public int DropoffStationId { get; set; }
            public string SenderName { get; set; }
            public string SenderId { get; set; }
            public string CourierName { get; set; }
            public string CourierId { get; set; }
            public List<ApiRequestViewModel> Requests { get; set; }
        }

        public class ApiRequestViewModel
        {
            public int Id { get; set; }
            public string Message { get; set; }
            public string Status { get; set; }
            public DateTime CreatedAt { get; set; }
            public DateTime UpdatedAt { get; set; }
            public DateTime ReqTime { get; set; }
            public string CourierId { get; set; }
            public string CourierName { get; set; }
            public string CourierProfileImage { get; set; }
        }

        public ApiOfferDetailsViewModel GetOfferDetailsForApi(int id)
        {
            var offer = _offerRepository.GetById(id, o => o.Sender, o => o.Courier, o => o.PickupStation, o => o.DropoffStation, o => o.Requests);
            if (offer == null)
            {
                return null;
            }
            
            var requestViewModels = offer.Requests?
                .Where(r => !r.IsDeleted)
                .Select(r => new ApiRequestViewModel
                {
                    Id = r.ID,
                    Message = r.Message,
                    Status = r.Status.ToString(),
                    CreatedAt = r.CreatedAt,
                    UpdatedAt = r.UpdatedAt,
                    ReqTime = r.ReqTime,
                    CourierId = r.CourierId,
                    CourierName = r.Courier?.User?.UserName,
                    CourierProfileImage = r.Courier?.User?.Image
                })
                .ToList() ?? new List<ApiRequestViewModel>();
            
            return new ApiOfferDetailsViewModel
            {
                Id = offer.ID,
                Description = offer.Description,
                OfferStatus = offer.OfferStatus.ToString(),
                OfferTime = offer.OfferTime,
                LastUpdate = offer.LastUpdate,
                Picture = offer.Picture,
                Weight = offer.Weight,
                Category = offer.Category,
                IsBreakable = offer.IsBreakable,
                Price = offer.Price,
                PickupStationName = offer.PickupStation?.Name,
                DropoffStationName = offer.DropoffStation?.Name,
                PickupStationId = offer.PickupStationId,
                DropoffStationId = offer.DropoffStationId,
                SenderName = offer.Sender?.User?.UserName,
                SenderId = offer.SenderId,
                CourierName = offer.Courier?.User?.UserName,
                CourierId = offer.CourierId,
                Requests = requestViewModels
            };
        }
    }
}