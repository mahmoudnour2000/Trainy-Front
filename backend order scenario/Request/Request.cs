using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Traint.Models.Model.UserRols;
using TraintFinalProject.Model.Enums;

namespace TraintFinalProject.Model
{
    public class Request
    {
        public int ID { get; set; }
        public string Message { get; set; } // Renamed from Description
        public RequestStatus Status { get; set; } = RequestStatus.Pending;
        public DateTime ReqTime { get; set; }
        public string CourierId { get; set; }
        public virtual Courier Courier { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsDeleted { get; set; }
        public int OfferId { get; set; }
        public virtual Offer Offer { get; set; }
        public int FromStationId { get; set; }
    }
}