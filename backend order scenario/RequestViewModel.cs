using System.ComponentModel.DataAnnotations;
using TraintFinalProject.Model;
using TraintFinalProject.Model.Enums;

namespace Trainy.ViewModels
{
    public class RequestCreateModel
    {
        [Required(ErrorMessage = "Offer ID is required")]
        public int OfferId { get; set; }

        [Required(ErrorMessage = "Message is required")]
        [StringLength(500, ErrorMessage = "Message cannot exceed 500 characters")]
        public string Message { get; set; }

        [Required(ErrorMessage = "From station is required")]
        public int FromStationId { get; set; }

        [Range(18, 100, ErrorMessage = "Age must be at least 18")]
        public int CourierAge { get; set; } = 18;
    }

    public class RequestUpdateModel
    {
        [Required(ErrorMessage = "Message is required")]
        [StringLength(500, ErrorMessage = "Message cannot exceed 500 characters")]
        public string Message { get; set; }

        [Required(ErrorMessage = "From station is required")]
        public int FromStationId { get; set; }
    }

    public class RequestViewModel
    {
        public int Id { get; set; }
        public int OfferId { get; set; }
        public string OfferDescription { get; set; }
        public string CourierId { get; set; }
        public string CourierName { get; set; }
        public string Message { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string SenderId { get; set; }
        public int FromStationId { get; set; }
    }

    // DeliveryChat ViewModels
    public class DeliveryChatViewModel
    {
        public int Id { get; set; }
        public int OfferId { get; set; }
        public string SenderId { get; set; }
        public string CourierId { get; set; }
        public string SenderName { get; set; }
        public string CourierName { get; set; }
        public string OfferDescription { get; set; }
        public string OfferStatus { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ChatMessageViewModel
    {
        public int Id { get; set; }
        public string Message { get; set; }
        public DateTime MessageTime { get; set; }
        public bool IsSender { get; set; }
        public bool IsRead { get; set; }
        public ChatMessageType MessageType { get; set; }
        public string SenderName { get; set; }
        public string CourierName { get; set; }
    }

    public class ChatDetailViewModel
    {
        public int ChatId { get; set; }
        public int OfferId { get; set; }
        public string SenderId { get; set; }
        public string CourierId { get; set; }
        public string OfferStatus { get; set; }
        public List<ChatMessageViewModel> Messages { get; set; }
        public string SenderName { get; set; }
        public string CourierName { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public static class RequestExtensions
    {
        public static RequestViewModel ToViewModel(this Request request)
        {
            return new RequestViewModel
            {
                Id = request.ID,
                OfferId = request.OfferId,
                OfferDescription = request.Offer?.Description,
                CourierId = request.CourierId,
                CourierName = request.Courier?.User?.UserName,
                Message = request.Message,
                CreatedAt = request.CreatedAt,
                UpdatedAt = request.UpdatedAt,
                SenderId = request.Offer?.SenderId,
                FromStationId = request.FromStationId
            };
        }

        public static List<RequestViewModel> ToViewModelList(this IEnumerable<Request> requests)
        {
            return requests.Select(r => r.ToViewModel()).ToList();
        }

        public static Request ToModel(this RequestCreateModel model, string courierId)
        {
            return new Request
            {
                OfferId = model.OfferId,
                CourierId = courierId,
                Message = model.Message,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                FromStationId = model.FromStationId
            };
        }
    }

    public static class DeliveryChatExtensions
    {
        public static DeliveryChatViewModel ToViewModel(this DeliveryChat chat)
        {
            return new DeliveryChatViewModel
            {
                Id = chat.Id,
                OfferId = chat.OfferId,
                SenderId = chat.SenderId,
                CourierId = chat.CourierId,
                SenderName = chat.Sender?.User?.UserName,
                CourierName = chat.Courier?.User?.UserName,
                OfferDescription = chat.Offer?.Description,
                OfferStatus = chat.Offer?.OfferStatus.ToString(),
                CreatedAt = chat.CreatedAt
            };
        }

        public static List<DeliveryChatViewModel> ToViewModelList(this IEnumerable<DeliveryChat> chats)
        {
            return chats.Select(c => c.ToViewModel()).ToList();
        }

        public static ChatMessageViewModel ToViewModel(this DeliveryChatMessage message, string senderName, string courierName)
        {
            return new ChatMessageViewModel
            {
                Id = message.Id,
                Message = message.Message,
                MessageTime = message.MessageTime,
                IsSender = message.IsSender,
                IsRead = message.IsRead,
                MessageType = message.MessageType,
                SenderName = senderName,
                CourierName = courierName
            };
        }
    }
}