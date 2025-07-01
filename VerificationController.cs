using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using TraintFinalProject.Model;
using TraintFinalProject.Model.Enums;
using Trainy.Services;
using Trainy.ViewModels;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Options;

namespace WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VerificationController : ControllerBase
    {
        private readonly VerificationService _verificationService;
        private readonly UserManager<User> _userManager;
        private readonly Cloudinary _cloudinary;

        public VerificationController(VerificationService verificationService,
            UserManager<User> userManager,
            IOptions<CloudinarySettings> cloudinarySettings)
        {
            _verificationService = verificationService;
            _userManager = userManager;

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

        private async Task<string> UploadToCloudinaryAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return null;

            if (file.Length > 10 * 1024 * 1024) // 10MB limit
                throw new InvalidOperationException("حجم الملف يجب أن يكون أقل من 10MB");

            try
            {
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, file.OpenReadStream()),
                    PublicId = $"verification/doc_{Guid.NewGuid()}",
                    Transformation = new Transformation().Width(1000).Height(1000).Crop("limit").FetchFormat("auto")
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);

                if (uploadResult.Error != null)
                    throw new InvalidOperationException($"خطأ في رفع الصورة: {uploadResult.Error.Message}");

                return uploadResult.SecureUrl.AbsoluteUri;
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"خطأ أثناء رفع الصورة: {ex.Message}");
            }
        }

        [HttpPost("submit")]
        [Authorize] // Any logged-in user can submit
        public async Task<IActionResult> SubmitVerificationRequest([FromForm] VerificationRequestCreateModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User ID not found in token.");

            if (model.Photo1 == null || model.Photo2 == null)
                return BadRequest(new { message = "يجب إرفاق صورتين للهوية" });

            //Validate role
            if (model.RequestedRole != "Sender" && model.RequestedRole != "Courier")
            {
                return BadRequest(new { message = "الدور المطلوب غير صالح. يجب أن يكون 'Sender' أو 'Courier'" });
            }

            try
            {
                // Upload files to Cloudinary
                model.Photo1Url = await UploadToCloudinaryAsync(model.Photo1);
                model.Photo2Url = await UploadToCloudinaryAsync(model.Photo2);

                if (string.IsNullOrEmpty(model.Photo1Url) || string.IsNullOrEmpty(model.Photo2Url))
                {
                    return StatusCode(StatusCodes.Status500InternalServerError,
                        new { message = "حدث خطأ أثناء حفظ صور الهوية" });
                }

                var (succeeded, message, verification) = await _verificationService.SubmitVerificationAsync(model, userId);

                if (!succeeded)
                    return BadRequest(new { message });

                return Ok(new { message, verification });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new { message = $"حدث خطأ أثناء معالجة الطلب: {ex.Message}" });
            }
        }

        [HttpGet("my-status")]
        [Authorize] // Any logged-in user can check their status
        public async Task<IActionResult> GetMyVerificationStatus([FromQuery] string? requestedRole = null)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User ID not found in token.");

            var statuses = await _verificationService.GetUserVerificationStatusAsync(userId, requestedRole);
            if (!statuses.Any() && !string.IsNullOrEmpty(requestedRole))
                return NotFound(new { message = $"No verification history found for the role: {requestedRole}." });
            if (!statuses.Any())
                return Ok(new { message = "No verification history found.", Verifications = statuses });

            return Ok(statuses);
        }

    }
} 