using System;
using System.Collections.Generic;
using Trainy.Repositories;
using TrainyFinalProject.TrainyContextFile;
using TraintFinalProject.Model;
using TraintFinalProject.Model.Enums;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace Trainy.Repositories
{
    public class RequestRepository : BaseManager<Request>
    {
        public RequestRepository(TrainyContext _context) : base(_context)
        {
        }

        public List<Request> GetRequestsBySender(string senderId)
        {
            return GetList(r => r.Offer.SenderId == senderId).ToList();
        }

        public List<Request> GetRequestsByCourier(string courierId)
        {
            return GetList(r => r.CourierId == courierId).ToList();
        }

        public override void Delete(int id)
        {
            base.Delete(id);
        }

        public void UpdateStatus(int requestId, RequestStatus status)
        {
            var request = GetById(requestId);
            request.Status = status;
            request.UpdatedAt = DateTime.UtcNow;
            if (status == RequestStatus.Rejected)
            {
                request.IsDeleted = true; // Mark as deleted when rejected
            }
            Update(request);
        }

        public async Task<Request> GetRequestByIdWithDetailsAsync(int requestId)
        {
            return await _context.Requests
                .Include(r => r.Courier).ThenInclude(c => c.User)
                .Include(r => r.Offer).ThenInclude(o => o.PickupStation)
                .Include(r => r.Offer).ThenInclude(o => o.DropoffStation)
                .FirstOrDefaultAsync(r => r.ID == requestId && !r.IsDeleted);
        }
    }
}