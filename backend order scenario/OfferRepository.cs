using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TraintFinalProject.Model;
using Trainy.Repositories;
using TrainyFinalProject.TrainyContextFile;
using Microsoft.EntityFrameworkCore;
using TraintFinalProject.Model.Enums;

namespace Trainy.Repositories
{
    public class OfferRepository : BaseManager<Offer>
    {

        public OfferRepository(TrainyContext _context) : base(_context)
        {
        }

        public List<Offer> GetOffersBySender(string senderId)
        {
            return GetList(
                o => o.SenderId == senderId
            ).ToList();
        }
        public List<Offer> GetOffersByCourier(string courierId)
        {
            return GetList(o => o.CourierId == courierId).ToList();
        }

        public List<Offer> GetOffersByStation(int stationId)
        {
            return GetList(o => o.PickupStationId == stationId || o.DropoffStationId == stationId).ToList();
        }

        public void Delete(int id)
        {
            base.Delete(id); // Now calls the soft delete method in BaseManager<T>
        }

        public async Task<List<Offer>> GetOffersForAdminAsync(
            int pageNumber,
            int pageSize,
            OfferStatus? statusFilter,
            DateTime? fromDate,
            DateTime? toDate,
            string sortOrder,
            string userId = null)
        {
            var query = _context.Offers
                .Include(o => o.Sender).ThenInclude(s => s.User)
                .Include(o => o.Courier).ThenInclude(c => c.User)
                .Include(o => o.PickupStation)
                .Include(o => o.DropoffStation)
                .Include(o => o.Requests)
                .Where(o => !o.IsDeleted);

            // Apply filters
            if (statusFilter.HasValue)
            {
                query = query.Where(o => o.OfferStatus == statusFilter.Value);
            }

            if (fromDate.HasValue)
            {
                var fromDateUtc = fromDate.Value.ToUniversalTime();
                query = query.Where(o => o.CreatedAt >= fromDateUtc);
            }

            if (toDate.HasValue)
            {
                var toDateUtc = toDate.Value.AddDays(1).ToUniversalTime();
                query = query.Where(o => o.CreatedAt < toDateUtc);
            }

            // Filter by user ID if provided
            if (!string.IsNullOrEmpty(userId))
            {
                query = query.Where(o => o.SenderId == userId || o.CourierId == userId);
            }

            // Apply sorting
            query = sortOrder.ToLower() == "asc" 
                ? query.OrderBy(o => o.CreatedAt) 
                : query.OrderByDescending(o => o.CreatedAt);

            // Apply pagination
            return await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<int> GetOfferCountForAdminAsync(
            OfferStatus? statusFilter,
            DateTime? fromDate,
            DateTime? toDate,
            string userId = null)
        {
            var query = _context.Offers.Where(o => !o.IsDeleted);

            // Apply filters
            if (statusFilter.HasValue)
            {
                query = query.Where(o => o.OfferStatus == statusFilter.Value);
            }

            if (fromDate.HasValue)
            {
                var fromDateUtc = fromDate.Value.ToUniversalTime();
                query = query.Where(o => o.CreatedAt >= fromDateUtc);
            }

            if (toDate.HasValue)
            {
                var toDateUtc = toDate.Value.AddDays(1).ToUniversalTime();
                query = query.Where(o => o.CreatedAt < toDateUtc);
            }

            // Filter by user ID if provided
            if (!string.IsNullOrEmpty(userId))
            {
                query = query.Where(o => o.SenderId == userId || o.CourierId == userId);
            }

            return await query.CountAsync();
        }

        public async Task<Offer> GetOfferWithRequestsAsync(int offerId)
        {
            return await _context.Offers
                .Include(o => o.Sender).ThenInclude(s => s.User)
                .Include(o => o.Courier).ThenInclude(c => c.User)
                .Include(o => o.PickupStation)
                .Include(o => o.DropoffStation)
                .Include(o => o.Requests).ThenInclude(r => r.Courier).ThenInclude(c => c.User)
                .FirstOrDefaultAsync(o => o.ID == offerId && !o.IsDeleted);
        }
        
        public async Task<Offer> GetOfferByIdAsync(int offerId)
        {
            return await _context.Offers
                .Include(o => o.Sender).ThenInclude(s => s.User)
                .Include(o => o.Courier).ThenInclude(c => c.User)
                .Include(o => o.PickupStation)
                .Include(o => o.DropoffStation)
                .FirstOrDefaultAsync(o => o.ID == offerId && !o.IsDeleted);
        }
        
        public async Task<Offer> GetOfferByIdAsync(int offerId, params System.Linq.Expressions.Expression<Func<Offer, object>>[] includeProperties)
        {
            var query = _context.Offers.AsQueryable();
            
            foreach (var includeProperty in includeProperties)
            {
                query = query.Include(includeProperty);
            }
            
            return await query.FirstOrDefaultAsync(o => o.ID == offerId && !o.IsDeleted);
        }
    }
}