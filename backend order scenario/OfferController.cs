using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Trainy.Services;
using Trainy.ViewModels;
using TraintFinalProject.Model.Enums;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using TraintFinalProject.Model;
using Microsoft.AspNetCore.Http;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Options;
using System.IO;
using System.Threading.Tasks;

namespace Trainy.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OfferController : ControllerBase
    {
        private readonly OfferService _offerService;
        private readonly Cloudinary _cloudinary;

        public OfferController(OfferService offerService, IOptions<WebAPI.CloudinarySettings> cloudinarySettings)
        {
            _offerService = offerService;
            
            // Initialize Cloudinary
            if (string.IsNullOrEmpty(cloudinarySettings.Value.CloudName) || 
                string.IsNullOrEmpty(cloudinarySettings.Value.ApiKey) || 
                string.IsNullOrEmpty(cloudinarySettings.Value.ApiSecret))
            {
                throw new ArgumentException("Cloudinary settings are not properly configured. Please check appsettings.json.");
            }
            
            Account account = new Account(
                cloudinarySettings.Value.CloudName,
                cloudinarySettings.Value.ApiKey,
                cloudinarySettings.Value.ApiSecret
            );
            _cloudinary = new Cloudinary(account);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateOffer([FromForm] OfferCreateModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var senderId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(senderId))
                    return Unauthorized("Sender ID not found in token.");

                var (canProceed, message) = await _offerService.CheckUserVerifiedAndHasRoleAsync(senderId, "Sender");
                if (!canProceed)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message });
                }

                // Handle image upload if present
                if (model.ImageFile != null && model.ImageFile.Length > 0)
                {
                    if (model.ImageFile.Length > 10 * 1024 * 1024) // 10MB limit
                        return BadRequest(new { message = "حجم الصورة يجب أن يكون أقل من 10MB" });

                    var uploadParams = new ImageUploadParams
                    {
                        File = new FileDescription(model.ImageFile.FileName, model.ImageFile.OpenReadStream()),
                        PublicId = $"offers/offer_{Guid.NewGuid()}",
                        Transformation = new Transformation().Width(800).Height(600).Crop("fill").FetchFormat("auto")
                    };

                    var uploadResult = await _cloudinary.UploadAsync(uploadParams);

                    if (uploadResult.Error != null)
                        return BadRequest(new { message = $"خطأ في رفع الصورة: {uploadResult.Error.Message}" });

                    model.Picture = uploadResult.SecureUrl.AbsoluteUri;
                }

                _offerService.CreateOffer(model, senderId);
                return Ok(new { message = "تم إنشاء العرض بنجاح" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "حدث خطأ أثناء إنشاء العرض", error = ex.Message });
            }
        }

        [HttpGet]
        [Authorize(Roles = "Sender,Courier")]
        public IActionResult GetOffers(int pageNumber = 1, int pageSize = 4)
        {
            try
            {
                var result = _offerService.GetOffers(pageNumber, pageSize);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving offers", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Sender,Courier")]
        public IActionResult GetOfferById(int id)
        {
            try
            {
                var offer = _offerService.GetOfferById(id);
                return Ok(offer);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the offer", error = ex.Message });
            }
        }

        [HttpGet("sender/{senderId}")]
        [Authorize(Roles = "Sender")]
        public IActionResult GetOffersBySender(string senderId)
        {
            try
            {
                var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (currentUserId != senderId)
                    return Unauthorized("You are not authorized to view these offers.");

                var offers = _offerService.GetOffersBySender(senderId);
                return Ok(offers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving offers", error = ex.Message });
            }
        }

        [HttpGet("courier/{courierId}")]
        [Authorize(Roles = "Courier")]
        public IActionResult GetOffersByCourier(string courierId)
        {
            try
            {
                var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (currentUserId != courierId)
                    return Unauthorized("You are not authorized to view these offers.");

                var offers = _offerService.GetOffersByCourier(courierId);
                return Ok(offers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving offers", error = ex.Message });
            }
        }

        [HttpGet("station/{stationId}")]
        [Authorize(Roles = "Sender,Courier")]
        public IActionResult GetOffersByStation(int stationId)
        {
            try
            {
                var offers = _offerService.GetOffersByStation(stationId);
                return Ok(offers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving offers", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Sender")]
        public IActionResult UpdateOffer(int id, [FromBody] OfferUpdateModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var senderId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(senderId))
                    return Unauthorized("Sender ID not found in token.");

                _offerService.UpdateOffer(id, model, senderId);
                return Ok(new { message = "Offer updated successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the offer", error = ex.Message });
            }
        }

        [HttpPut("{id}/status")]
        [Authorize(Roles = "Sender,Courier,Admin")]
        public async Task<IActionResult> UpdateOfferStatus(int id, [FromBody] OfferStatus status)
        {
            try
            {
                // Validate the status value
                if (!Enum.IsDefined(typeof(OfferStatus), status))
                {
                    return BadRequest(new { message = "Invalid offer status. Valid values are: Canceled, OnWay, Delivered, Pending, InProgress, Completed" });
                }
                
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User ID not found in token.");

                await _offerService.UpdateOfferStatus(id, status, userId);
                return Ok(new { message = "Offer status updated successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the offer status", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Sender,Admin")]
        public async Task<IActionResult> DeleteOffer(int id)
        {
            try
            {
                var senderId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(senderId) && !User.IsInRole("Admin"))
                    return Unauthorized("User ID not found in token.");

                await _offerService.DeleteOffer(id, senderId);
                return Ok(new { message = "Offer deleted successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the offer", error = ex.Message });
            }
        }
    }
}