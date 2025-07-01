using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Trainy.ViewModels
{
    public class OfferDetailsViewModel
    {
        public OfferViewModel Offer { get; set; }
        public List<AdminRequestViewModel> Requests { get; set; }
    }

    public class AdminRequestViewModel
    {
        public int ID { get; set; }
        
        [Display(Name = "الرسالة")]
        public string Message { get; set; }
        
        [Display(Name = "الحالة")]
        public string Status { get; set; }
        
        [Display(Name = "تاريخ الإنشاء")]
        public DateTime CreatedAt { get; set; }
        
        [Display(Name = "تاريخ التحديث")]
        public DateTime UpdatedAt { get; set; }
        
        [Display(Name = "تاريخ الطلب")]
        public DateTime ReqTime { get; set; }
        
        [Display(Name = "اسم المندوب")]
        public string CourierName { get; set; }
        
        [Display(Name = "صورة المندوب")]
        public string CourierProfileImage { get; set; }
    }

    public class RequestDetailViewModel : AdminRequestViewModel
    {
        [Display(Name = "رقم الهاتف")]
        public string CourierPhone { get; set; }
        
        [Display(Name = "البريد الإلكتروني")]
        public string CourierEmail { get; set; }
        
        public string CourierId { get; set; }
        
        public int OfferId { get; set; }
        
        [Display(Name = "وصف العرض")]
        public string OfferDescription { get; set; }
        
        [Display(Name = "محطة الاستلام")]
        public string PickupStationName { get; set; }
        
        [Display(Name = "محطة التسليم")]
        public string DropoffStationName { get; set; }
    }
} 