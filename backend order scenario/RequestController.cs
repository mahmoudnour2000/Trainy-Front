using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Trainy.Services;
using Trainy.ViewModels;
using TraintFinalProject.Model.Enums;

namespace Trainy.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RequestController : ControllerBase
    {
        private readonly RequestService _requestService;

        public RequestController(RequestService requestService)
        {
            _requestService = requestService;
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateRequest([FromBody] RequestCreateModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var courierId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(courierId))
                    return Unauthorized("Courier ID not found in token.");

                var (canProceed, message) = await _requestService.CheckUserVerifiedAndHasRoleAsync(courierId, "Courier");
                if (!canProceed)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message });
                }

                // Check if the courier already has a request for this offer
                var hasExistingRequest = await _requestService.HasExistingRequestAsync(model.OfferId, courierId);
                if (hasExistingRequest)
                    return BadRequest(new { message = "You have already submitted a request for this offer." });

                await _requestService.CreateRequest(model, courierId);
                return Ok(new { message = "Request created successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the request", error = ex.Message });
            }
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public IActionResult GetRequests(int pageNumber = 1, int pageSize = 10)
        {
            try
            {
                var requests = _requestService.GetRequests(pageNumber, pageSize);
                return Ok(requests);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving requests", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetRequestById(int id)
        {
            try
            {
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User ID not found in token.");

                var request = await _requestService.GetRequestByIdAsync(id);
                
                // Check if user is authorized to view this request
                if (!User.IsInRole("Admin") && 
                    userId != request.CourierId && 
                    userId != request.SenderId)
                {
                    return Unauthorized("You are not authorized to view this request.");
                }

                return Ok(request);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the request", error = ex.Message });
            }
        }

        [HttpPost("{requestId}/accept")]
        [Authorize(Roles = "Sender")]
        public async Task<IActionResult> AcceptRequest(int requestId)
        {
            try
            {
                var senderId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(senderId))
                    return Unauthorized("Sender ID not found in token.");

                await _requestService.AcceptRequest(requestId, senderId);
                return Ok(new { message = "Request accepted successfully" });
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
                return StatusCode(500, new { message = "An error occurred while accepting the request", error = ex.Message });
            }
        }

        [HttpPost("{requestId}/reject")]
        [Authorize(Roles = "Sender")]
        public async Task<IActionResult> RejectRequest(int requestId)
        {
            try
            {
                var senderId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(senderId))
                    return Unauthorized("Sender ID not found in token.");

                await _requestService.RejectRequest(requestId, senderId);
                return Ok(new { message = "Request rejected successfully" });
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
                return StatusCode(500, new { message = "An error occurred while rejecting the request", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Courier")]
        public async Task<IActionResult> UpdateRequest(int id, [FromBody] RequestUpdateModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var courierId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(courierId))
                    return Unauthorized("Courier ID not found in token.");

                await _requestService.UpdateRequest(id, model, courierId);
                return Ok(new { message = "Request updated successfully" });
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
                return StatusCode(500, new { message = "An error occurred while updating the request", error = ex.Message });
            }
        }

        [HttpPut("{id}/status")]
        [Authorize(Roles = "Sender,Courier,Admin")]
        public async Task<IActionResult> UpdateRequestStatus(int id, [FromBody] RequestStatus status)
        {
            try
            {
                // Validate the status value
                if (!Enum.IsDefined(typeof(RequestStatus), status))
                {
                    return BadRequest(new { message = "Invalid request status. Valid values are: Pending, Accepted, Rejected, completed" });
                }

                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User ID not found in token.");

                await _requestService.UpdateRequestStatus(id, status, userId);
                return Ok(new { message = "Request status updated successfully" });
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
                return StatusCode(500, new { message = "An error occurred while updating the request status", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Courier,Admin")]
        public async Task<IActionResult> DeleteRequest(int id)
        {
            try
            {
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId) && !User.IsInRole("Admin"))
                    return Unauthorized("User ID not found in token.");

                await _requestService.DeleteRequest(id, userId);
                return Ok(new { message = "Request deleted successfully" });
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
                return StatusCode(500, new { message = "An error occurred while deleting the request", error = ex.Message });
            }
        }

        [HttpGet("offer/{offerId}")]
        [Authorize(Roles = "Sender")]
        public IActionResult GetRequestsByOffer(int offerId, int pageNumber = 1, int pageSize = 4)
        {
            try
            {
                var requests = _requestService.GetRequestsByOffer(offerId, pageNumber, pageSize);
                return Ok(requests);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving requests", error = ex.Message });
            }
        }

        [HttpGet("courier/{courierId}")]
        [Authorize(Roles = "Courier")]
        public IActionResult GetRequestsByCourier(string courierId, int pageNumber = 1, int pageSize = 4)
        {
            try
            {
                var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (currentUserId != courierId)
                    return Unauthorized("You are not authorized to view these requests.");

                var requests = _requestService.GetRequestsByCourier(courierId, pageNumber, pageSize);
                return Ok(requests);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving requests", error = ex.Message });
            }
        }
    }
}