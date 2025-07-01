using System.ComponentModel.DataAnnotations;
using TraintFinalProject.Model;
using TraintFinalProject.Model.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Http;

namespace Trainy.ViewModels
{
    public class OfferCreateModel
    {
        [Required(ErrorMessage = "Payment method is required")]
        public PaymentMethod PaymentMethod { get; set; }

        [Required(ErrorMessage = "Description is required")]
        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string Description { get; set; }

        [Required(ErrorMessage = "Weight is required")]
        [Range(0.1, double.MaxValue, ErrorMessage = "Weight must be greater than 0")]
        public double Weight { get; set; }

        [Required(ErrorMessage = "Category is required")]
        [StringLength(100, ErrorMessage = "Category cannot exceed 100 characters")]
        public string Category { get; set; }

        [Required(ErrorMessage = "Breakable status is required")]
        public bool IsBreakable { get; set; }

        [Required(ErrorMessage = "Price is required")]
        [Range(0.01, 999999.99, ErrorMessage = "Price must be between 0.01 and 999,999.99")]
        public decimal Price { get; set; }

        [Required(ErrorMessage = "Pickup station ID is required")]
        public int PickupStationId { get; set; }

        [Required(ErrorMessage = "Dropoff station ID is required")]
        public int DropoffStationId { get; set; }
        
        public IFormFile ImageFile { get; set; }
        
        public string Picture { get; set; }
    }

    public class OfferUpdateModel
    {
        [Required(ErrorMessage = "Description is required")]
        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string Description { get; set; }

        [Required(ErrorMessage = "Weight is required")]
        [Range(0.1, double.MaxValue, ErrorMessage = "Weight must be greater than 0")]
        public double Weight { get; set; }

        [Required(ErrorMessage = "Category is required")]
        [StringLength(100, ErrorMessage = "Category cannot exceed 100 characters")]
        public string Category { get; set; }

        [Required(ErrorMessage = "Breakable status is required")]
        public bool IsBreakable { get; set; }

        [Required(ErrorMessage = "Price is required")]
        [Range(0.01, 999999.99, ErrorMessage = "Price must be between 0.01 and 999,999.99")]
        public decimal Price { get; set; }

        [Required(ErrorMessage = "Pickup station ID is required")]
        public int PickupStationId { get; set; }

        [Required(ErrorMessage = "Dropoff station ID is required")]
        public int DropoffStationId { get; set; }
    }

    public class OfferViewModel
    {
        public int ID { get; set; }
        public PaymentMethod PaymentMethod { get; set; }
        public string OfferStatus { get; set; }
        public DateTime OfferTime { get; set; }
        public string Description { get; set; }
        public DateTime LastUpdate { get; set; }
        public string Picture { get; set; }
        public double Weight { get; set; }
        public string Category { get; set; }
        public bool IsBreakable { get; set; }
        public decimal Price { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string SenderId { get; set; }
        public string SenderName { get; set; }
        public string CourierId { get; set; }
        public string CourierName { get; set; }
        public int PickupStationId { get; set; }
        public string PickupStationName { get; set; }
        public int DropoffStationId { get; set; }
        public string DropoffStationName { get; set; }
        public int RequestsCount { get; set; }
        public int AcceptedRequestsCount { get; set; }
    }

    public static class OfferExtensions
    {
        public static Offer ToModel(this OfferCreateModel viewModel, string senderId)
        {
            return new Offer
            {
                PaymentMethod = viewModel.PaymentMethod,
                OfferStatus = OfferStatus.Pending,
                OfferTime = DateTime.UtcNow,
                Description = viewModel.Description,
                LastUpdate = DateTime.UtcNow,
                Weight = viewModel.Weight,
                Category = viewModel.Category,
                IsBreakable = viewModel.IsBreakable,
                Price = viewModel.Price,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                SenderId = senderId,
                PickupStationId = viewModel.PickupStationId,
                DropoffStationId = viewModel.DropoffStationId
            };
        }

        public static Offer ToModel(this OfferUpdateModel viewModel, Offer offer)
        {
            offer.Description = viewModel.Description;
            offer.Weight = viewModel.Weight;
            offer.Category = viewModel.Category;
            offer.IsBreakable = viewModel.IsBreakable;
            offer.Price = viewModel.Price;
            offer.PickupStationId = viewModel.PickupStationId;
            offer.DropoffStationId = viewModel.DropoffStationId;
            offer.LastUpdate = DateTime.UtcNow;
            offer.UpdatedAt = DateTime.UtcNow;
            return offer;
        }

        public static OfferViewModel ToViewModel(this Offer offer)
        {
            return new OfferViewModel
            {
                ID = offer.ID,
                PaymentMethod = offer.PaymentMethod,
                OfferStatus = offer.OfferStatus.ToString(),
                OfferTime = offer.OfferTime,
                Description = offer.Description,
                LastUpdate = offer.LastUpdate,
                Picture = offer.Picture,
                Weight = offer.Weight,
                Category = offer.Category,
                IsBreakable = offer.IsBreakable,
                Price = offer.Price,
                CreatedAt = offer.CreatedAt,
                UpdatedAt = offer.UpdatedAt,
                SenderId = offer.SenderId,
                SenderName = offer.Sender?.User.Name,
                CourierId = offer.CourierId,
                CourierName = offer.Courier?.User.Name,
                PickupStationId = offer.PickupStationId,
                PickupStationName = offer.PickupStation?.Name,
                DropoffStationId = offer.DropoffStationId,
                DropoffStationName = offer.DropoffStation?.Name,
                RequestsCount = offer.Requests?.Count ?? 0,
                AcceptedRequestsCount = offer.Requests?.Count(r => r.Status == RequestStatus.Accepted) ?? 0
            };
        }

        public static List<OfferViewModel> ToViewModelList(this List<Offer> offers)
        {
            return offers.Select(o => o.ToViewModel()).ToList();
        }
    }
}