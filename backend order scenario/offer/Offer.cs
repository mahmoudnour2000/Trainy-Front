using System;
using System.Collections;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Traint.Models.Model.UserRols;
using TraintFinalProject.Model.Enums;

namespace TraintFinalProject.Model
{
    public class Offer
    {
        public int ID { get; set; }
        public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.VodafoneCash;
        public OfferStatus OfferStatus { get; set; } = OfferStatus.Pending;
        public DateTime OfferTime { get; set; }
        public string Description { get; set; }
        public DateTime LastUpdate { get; set; } = DateTime.Now;
        public string? Picture { get; set; }
        public double Weight { get; set; }
        public string Category { get; set; }
        public bool IsBreakable { get; set; }
        public decimal Price { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsDeleted { get; set; }

        public string? CourierId { get; set; }
        public virtual Courier? Courier { get; set; } // Changed from Courier to User
        public string SenderId { get; set; }
        public virtual Sender Sender { get; set; } // Changed from Sender to User
        public int PickupStationId { get; set; }
        public virtual Station PickupStation { get; set; }
        public int DropoffStationId { get; set; }
        public virtual Station DropoffStation { get; set; }
        public virtual ICollection<Request> Requests { get; set; }
        public virtual ICollection<DeliveryChat> DeliveryChats { get; set; }
        //new Addition
        public virtual Transaction Transaction { get; set; }
    }
}