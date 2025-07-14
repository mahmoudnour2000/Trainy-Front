using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Hubs;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Traint.Models.Model.UserRols;
using TraintFinalProject.Model;
using TraintFinalProject.Model.Enums;
using Trainy.Repositories;
using Trainy.Services;
using Trainy.ViewModels;

namespace TraintFinalProject.Services
{
    public class TrainTrackingService
    {
        private readonly TrainTrackingRepository _trackingRepository;
        private readonly TrainManager _trainManager; // Added to access Train table
        private readonly NotificationService _notificationService;
        private readonly IHubContext<TrainTrackingHub> _hubContext;
        private readonly IHubContext<TrainChatHub> _trainChatHubContext;
        private readonly ILogger<TrainTrackingService> _logger;
        private readonly UserManager<User> _userManager;
        private readonly TokenService _tokenService;

        public TrainTrackingService(
            TrainTrackingRepository trackingRepository,
            TrainManager trainManager, // Added dependency
            NotificationService notificationService,
            IHubContext<TrainTrackingHub> hubContext,
            IHubContext<TrainChatHub> trainChatHubContext,
            UserManager<User> userManager,
            TokenService tokenService,
            ILogger<TrainTrackingService> logger)
        {
            _trackingRepository = trackingRepository;
            _trainManager = trainManager; // Initialize TrainManager
            _notificationService = notificationService;
            _hubContext = hubContext;
            _trainChatHubContext = trainChatHubContext;
            _userManager = userManager;
            _tokenService = tokenService;
            _logger = logger;
        }

        public async Task<(bool Succeeded, string Message, string RefreshToken)> AssignGuideRoleAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return (false, "المستخدم غير موجود", null);

            if (await _userManager.IsInRoleAsync(user, "Guide"))
                return (false, "أنت بالفعل قائد رحلة", null);

            var roleResult = await _userManager.AddToRoleAsync(user, "Guide");
            if (!roleResult.Succeeded)
                return (false, $"فشل في إضافة دور قائد الرحلة: {string.Join(", ", roleResult.Errors.Select(e => e.Description))}", null);

            var existingGuide = await _trackingRepository.GetGuideByUserIdAsync(userId);
            if (existingGuide == null)
            {
                var guide = new Guide
                {
                    UserId = userId,
                    TrainTrackings = new List<TrainTracking>()
                };
                await _trackingRepository.AddAsync(guide);
            }

            var refreshToken = await _tokenService.GenerateRefreshTokenAsync(user);
            return (true, "تم إضافة دور قائد الرحلة بنجاح", refreshToken);
        }

        public async Task<TrainTracking> GetActiveTrackingAsync(int trainId)
        {
            _logger.LogInformation("Fetching active tracking for TrainID: {TrainId}", trainId);
            return await _trackingRepository.GetActiveTrackingByTrainIdAsync(trainId);
        }

        public async Task<PaginationViewModel<TrainTrackingItemViewModel>> GetActiveTrackingsAsync(string searchText, int pageNumber, int pageSize)
        {
            _logger.LogInformation("Fetching active trackings, SearchText: {SearchText}, PageNumber: {PageNumber}, PageSize: {PageSize}", searchText, pageNumber, pageSize);
            var (trackings, totalCount) = await _trackingRepository.GetActiveTrackingsAsync(searchText, pageNumber, pageSize);
            var trains = trackings.Select(t => new TrainTrackingItemViewModel
            {
                TrainId = t.TrainID,
                TrainNo = t.Train?.No ?? "Unknown",
                IsTracked = true,
                Status = t.Status,
                CurrentStationName = t.CurrentStation?.Name ?? "Unknown",
                LastUpdated = t.LastUpdated,
                Latitude = t.Latitude,
                Longitude = t.Longitude,
                GuideName = t.Guide?.UserName ?? "غير متوفر"
            }).ToList();

            return new PaginationViewModel<TrainTrackingItemViewModel>
            {
                Data = trains,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalCount = totalCount
            };
        }

        public async Task UpdateTrackingAsync(TrainTrackingUpdateDto dto, string guideId)
        {
            _logger.LogInformation("Updating tracking for TrainID: {TrainId}", dto.TrainId);
            (int currentStationId, int? nextStationId, string nextStationName) = await GetStationIdsAsync(dto.TrainId, dto.Latitude, dto.Longitude);
            var tracking = await _trackingRepository.GetActiveTrackingByTrainIdAsync(dto.TrainId);

            if (tracking == null)
            {
                _logger.LogInformation("Creating new tracking for TrainID: {TrainId}", dto.TrainId);
                tracking = new TrainTracking
                {
                    TrainID = dto.TrainId,
                    CurrentStationId = currentStationId,
                    NextStationId = nextStationId,
                    Latitude = dto.Latitude,
                    Longitude = dto.Longitude,
                    GuideId = guideId,
                    ExpectedArrival = dto.ExpectedArrival,
                    Status = "OnTime",
                    LastUpdated = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                };
                await _trackingRepository.AddTrackingAsync(tracking);
            }
            else
            {
                _logger.LogInformation("Updating existing tracking for TrainID: {TrainId}", dto.TrainId);
                tracking.Latitude = dto.Latitude;
                tracking.Longitude = dto.Longitude;
                tracking.CurrentStationId = currentStationId;
                tracking.NextStationId = nextStationId;
                tracking.ExpectedArrival = dto.ExpectedArrival;
                tracking.LastUpdated = DateTime.UtcNow;
                tracking.Status = CalculateStatus(tracking);
                tracking.DistanceToNextStation = await _trackingRepository.CalculateDistanceToNextStationAsync(tracking.ID);

                await _trackingRepository.UpdateTrackingAsync(tracking);
            }

            // Update Train table with latest tracking info
            UpdateTrainFromTracking(dto.TrainId, tracking);

            _logger.LogInformation("Sending notification and SignalR update for TrainID: {TrainId}", dto.TrainId);
            await _notificationService.SendLocationUpdateNotificationAsync(dto.TrainId, tracking);
            await _hubContext.Clients.Group($"train-{dto.TrainId}").SendAsync("ReceiveTrainUpdate", ToViewModel(tracking, nextStationName));

            // Check if train reached final destination and close chat
            await CheckAndCloseTrainChat(dto.TrainId, tracking);
        }

        public async Task UpdateGpsAsync(GpsUpdateDto dto, string guideId)
        {
            _logger.LogInformation("Updating GPS for TrainID: {TrainId}", dto.TrainId);
            (int currentStationId, int? nextStationId, string nextStationName) = await GetStationIdsAsync(dto.TrainId, dto.Latitude, dto.Longitude);
            var tracking = await _trackingRepository.GetActiveTrackingByTrainIdAsync(dto.TrainId);

            if (tracking == null)
            {
                _logger.LogInformation("Creating new GPS tracking for TrainID: {TrainId}", dto.TrainId);
                tracking = new TrainTracking
                {
                    TrainID = dto.TrainId,
                    CurrentStationId = currentStationId,
                    NextStationId = nextStationId,
                    Latitude = dto.Latitude,
                    Longitude = dto.Longitude,
                    GuideId = guideId,
                    ExpectedArrival = dto.ExpectedArrival,
                    Speed = dto.Speed,
                    Status = "OnTime",
                    LastUpdated = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                };
                await _trackingRepository.AddTrackingAsync(tracking);
            }
            else
            {
                _logger.LogInformation("Updating existing GPS tracking for TrainID: {TrainId}", dto.TrainId);
                tracking.Latitude = dto.Latitude;
                tracking.Longitude = dto.Longitude;
                tracking.CurrentStationId = currentStationId;
                tracking.NextStationId = nextStationId;
                tracking.ExpectedArrival = dto.ExpectedArrival;
                tracking.Speed = dto.Speed;
                tracking.LastUpdated = DateTime.UtcNow;
                tracking.Status = CalculateStatus(tracking);
                tracking.DistanceToNextStation = await _trackingRepository.CalculateDistanceToNextStationAsync(tracking.ID);

                await _trackingRepository.UpdateTrackingAsync(tracking);
            }

            // Update Train table with latest tracking info
            UpdateTrainFromTracking(dto.TrainId, tracking);

            _logger.LogInformation("Sending GPS notification and SignalR update for TrainID: {TrainId}", dto.TrainId);
            await _notificationService.SendLocationUpdateNotificationAsync(dto.TrainId, tracking);
            await _hubContext.Clients.Group($"train-{dto.TrainId}").SendAsync("ReceiveTrainUpdate", ToViewModel(tracking, nextStationName));

            // Check if train reached final destination and close chat
            await CheckAndCloseTrainChat(dto.TrainId, tracking);
        }

        public async Task UpdateManualAsync(ManualUpdateDto dto, string guideId)
        {
            _logger.LogInformation("Updating manual tracking for TrainID: {TrainId}", dto.TrainId);
            (int currentStationId, int? nextStationId, string nextStationName) = await GetStationIdsAsync(dto.TrainId, dto.Latitude, dto.Longitude);
            var tracking = await _trackingRepository.GetActiveTrackingByTrainIdAsync(dto.TrainId);

            if (tracking == null)
            {
                _logger.LogInformation("Creating new manual tracking for TrainID: {TrainId}", dto.TrainId);
                tracking = new TrainTracking
                {
                    TrainID = dto.TrainId,
                    CurrentStationId = currentStationId,
                    NextStationId = nextStationId,
                    Latitude = dto.Latitude,
                    Longitude = dto.Longitude,
                    GuideId = guideId,
                    ExpectedArrival = dto.ExpectedArrival,
                    Status = "OnTime",
                    LastUpdated = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                };
                await _trackingRepository.AddTrackingAsync(tracking);
            }
            else
            {
                _logger.LogInformation("Updating existing manual tracking for TrainID: {TrainId}", dto.TrainId);
                tracking.Latitude = dto.Latitude;
                tracking.Longitude = dto.Longitude;
                tracking.CurrentStationId = currentStationId;
                tracking.NextStationId = nextStationId;
                tracking.ExpectedArrival = dto.ExpectedArrival;
                tracking.LastUpdated = DateTime.UtcNow;
                tracking.Status = CalculateStatus(tracking);
                tracking.DistanceToNextStation = await _trackingRepository.CalculateDistanceToNextStationAsync(tracking.ID);

                await _trackingRepository.UpdateTrackingAsync(tracking);
            }

            // Update Train table with latest tracking info
            UpdateTrainFromTracking(dto.TrainId, tracking);

            _logger.LogInformation("Sending manual notification and SignalR update for TrainID: {TrainId}", dto.TrainId);
            await _notificationService.SendLocationUpdateNotificationAsync(dto.TrainId, tracking);
            await _hubContext.Clients.Group($"train-{dto.TrainId}").SendAsync("ReceiveTrainUpdate", ToViewModel(tracking, nextStationName));

            // Check if train reached final destination and close chat
            await CheckAndCloseTrainChat(dto.TrainId, tracking);
        }

        public async Task<List<TrainTrackingViewModel>> GetTrackingHistoryAsync(int trainId, DateTime? startDate, DateTime? endDate)
        {
            _logger.LogInformation("Fetching tracking history for TrainID: {TrainId}, StartDate: {StartDate}, EndDate: {EndDate}", trainId, startDate, endDate);
            var history = await _trackingRepository.GetTrackingHistoryAsync(trainId, startDate, endDate);
            return history.Select(t => new TrainTrackingViewModel
            {
                ID = t.ID,
                TrainID = t.TrainID,
                TrainNo = t.Train?.No ?? "Unknown",
                CurrentStationId = t.CurrentStationId,
                CurrentStationName = t.CurrentStation?.Name ?? "Unknown",
                NextStationId = t.NextStationId,
                NextStationName = t.NextStation?.Name ?? "غير متوفر",
                Latitude = t.Latitude,
                Longitude = t.Longitude,
                ExpectedArrival = t.ExpectedArrival,
                Status = t.Status,
                DistanceToNextStation = t.DistanceToNextStation,
                Speed = t.Speed,
                LastUpdated = t.LastUpdated,
                GuideId = t.GuideId,
                GuideName = t.Guide?.UserName ?? "غير متوفر"
            }).ToList();
        }

        private string CalculateStatus(TrainTracking tracking)
        {
            var now = DateTime.UtcNow;

            // إذا وصل القطار (لا توجد محطة تالية أو السرعة = 0 في المحطة الأخيرة)
            if (tracking.CurrentStationId == tracking.NextStationId && tracking.NextStationId != null)
                return "Arrived";

            // إذا كان متأخر جداً (أكثر من 30 دقيقة)
            if (tracking.ExpectedArrival < now.AddMinutes(-30))
                return "Late";

            // إذا كان متأخر قليلاً (5-30 دقيقة)
            if (tracking.ExpectedArrival < now.AddMinutes(-5))
                return "Delayed";

            // إذا كان يتحرك بسرعة جيدة
            if (tracking.Speed.HasValue && tracking.Speed > 0)
                return "OnTrack";

            // الحالة الافتراضية
            return "OnTime";
        }

        public async Task<(int CurrentStationId, int? NextStationId, string NextStationName)> GetStationIdsAsync(int trainId, double latitude, double longitude)
        {
            _logger.LogInformation("Calculating station IDs for TrainID: {TrainId}, Latitude: {Latitude}, Longitude: {Longitude}", trainId, latitude, longitude);

            var stations = await _trackingRepository.GetStationsAsync();
            if (!stations.Any())
            {
                _logger.LogError("No stations found in the database for TrainID: {TrainId}", trainId);
                throw new Exception("No stations found in the database");
            }

            foreach (var station in stations)
            {
                _logger.LogInformation("Station ID: {StationId}, Name: {Name}, Latitude: {Latitude}, Longitude: {Longitude}, IsDeleted: {IsDeleted}",
                    station.ID, station.Name, station.Latitude, station.Longitude, station.IsDeleted);
            }

            var currentStation = stations
                .Select(s => new
                {
                    StationId = s.ID,
                    Distance = CalculateHaversineDistance(latitude, longitude, s.Latitude, s.Longitude)
                })
                .Where(s => s.Distance < 20000)
                .OrderBy(s => s.Distance)
                .FirstOrDefault();

            if (currentStation == null)
            {
                _logger.LogError("No station found within 20 km for TrainID: {TrainId}, Latitude: {Latitude}, Longitude: {Longitude}", trainId, latitude, longitude);
                throw new Exception("No nearby station found within 20 km");
            }

            int currentStationId = currentStation.StationId;
            _logger.LogInformation("Closest station found for TrainID: {TrainId}: StationID: {StationId}, Distance: {Distance} meters", trainId, currentStationId, currentStation.Distance);

            var trainStations = await _trackingRepository.GetTrainStationsAsync(trainId);
            if (!trainStations.Any())
            {
                _logger.LogWarning("No station schedule found for TrainID: {TrainId}", trainId);
                return (currentStationId, null, "هذه هي المحطة الأخيرة");
            }

            foreach (var ts in trainStations)
            {
                _logger.LogInformation("TrainID: {TrainId}, StationID: {StationId}, Order: {Order}, StationName: {StationName}, StationIsNull: {StationIsNull}",
                    trainId, ts.StationID, ts.Order, ts.Station?.Name ?? "Unknown", ts.Station == null);
            }

            var currentStationOrder = trainStations
                .FirstOrDefault(ts => ts.StationID == currentStationId)?.Order;

            if (currentStationOrder == null)
            {
                _logger.LogWarning("Current station (StationID: {StationId}) not found in train schedule for TrainID: {TrainId}", currentStationId, trainId);
                return (currentStationId, null, "هذه هي المحطة الأخيرة");
            }

            _logger.LogInformation("Current station order for TrainID: {TrainId}, StationID: {StationId} is {Order}", trainId, currentStationId, currentStationOrder);

            var nextStation = trainStations
                .Where(ts => ts.Order > currentStationOrder)
                .OrderBy(ts => ts.Order)
                .FirstOrDefault();

            int? nextStationId = nextStation?.StationID;
            string nextStationName = nextStation != null && nextStation.Station != null
                ? nextStation.Station.Name
                : "هذه هي المحطة الأخيرة";

            if (nextStationId.HasValue)
            {
                _logger.LogInformation("Next station found for TrainID: {TrainId}: StationID: {NextStationId}, Order: {NextOrder}, Name: {NextStationName}",
                    trainId, nextStationId, nextStation.Order, nextStationName);
            }
            else
            {
                _logger.LogInformation("No next station found for TrainID: {TrainId}, Current Order: {CurrentOrder}", trainId, currentStationOrder);
            }

            return (currentStationId, nextStationId, nextStationName);
        }

        private double CalculateHaversineDistance(double lat1, double lon1, double lat2, double lon2)
        {
            const double R = 6371e3; // Earth's radius in meters
            var φ1 = lat1 * Math.PI / 180;
            var φ2 = lat2 * Math.PI / 180;
            var Δφ = (lat2 - lat1) * Math.PI / 180;
            var Δλ = (lon2 - lon1) * Math.PI / 180;

            var a = Math.Sin(Δφ / 2) * Math.Sin(Δφ / 2) +
                    Math.Cos(φ1) * Math.Cos(φ2) *
                    Math.Sin(Δλ / 2) * Math.Sin(Δλ / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            return R * c; // Distance in meters
        }

        private TrainTrackingViewModel ToViewModel(TrainTracking tracking, string nextStationName)
        {
            return new TrainTrackingViewModel
            {
                ID = tracking.ID,
                TrainID = tracking.TrainID,
                TrainNo = tracking.Train?.No ?? "Unknown",
                CurrentStationId = tracking.CurrentStationId,
                CurrentStationName = tracking.CurrentStation?.Name ?? "Unknown",
                NextStationId = tracking.NextStationId,
                NextStationName = nextStationName,
                Latitude = tracking.Latitude,
                Longitude = tracking.Longitude,
                ExpectedArrival = tracking.ExpectedArrival,
                Status = tracking.Status,
                DistanceToNextStation = tracking.DistanceToNextStation,
                Speed = tracking.Speed,
                LastUpdated = tracking.LastUpdated,
                GuideId = tracking.GuideId,
                GuideName = tracking.Guide?.UserName ?? "غير متوفر"
            };
        }

        /// <summary>
        /// تحديث جدول Trains بناءً على بيانات التتبع
        /// </summary>
        private void UpdateTrainFromTracking(int trainId, TrainTracking tracking)
        {
            var train = _trainManager.GetById(trainId);
            if (train != null)
            {
                train.Current_Location = tracking.CurrentStation?.Name ?? "Unknown";
                train.LastUpdate = DateTime.UtcNow;
                train.TrainStatus = ConvertTrackingStatusToTrainStatus(tracking.Status);
                _trainManager.Update(train);

                _logger.LogInformation("Updated train {TrainId} status to {Status} and location to {Location}",
                    trainId, tracking.Status, train.Current_Location);
            }
            else
            {
                _logger.LogWarning("Train with ID {TrainId} not found for updating", trainId);
            }
        }

        /// <summary>
        /// تحويل حالة التتبع إلى حالة القطار في جدول Trains
        /// </summary>
        private TrainStatus ConvertTrackingStatusToTrainStatus(string trackingStatus)
        {
            return trackingStatus switch
            {
                "OnTime" => TrainStatus.OnTime,
                "Late" => TrainStatus.Late,
                "Delayed" => TrainStatus.Delayed,
                "Arrived" => TrainStatus.Arrived,
                "Cancelled" => TrainStatus.Canceld,
                "Canceld" => TrainStatus.Canceld,
                "OnTrack" => TrainStatus.OnTrack,
                _ => TrainStatus.OnTime // الحالة الافتراضية
            };
        }

        /// <summary>
        /// فحص إذا وصل القطار للمحطة الأخيرة وإغلاق الشات
        /// </summary>
        private async Task CheckAndCloseTrainChat(int trainId, TrainTracking tracking)
        {
            // إذا وصل القطار (لا توجد محطة تالية)
            if (tracking.Status == "Arrived" || tracking.NextStationId == null)
            {
                _logger.LogInformation("Train {TrainId} reached final destination, closing chat", trainId);

                try
                {
                    // إغلاق الشات عبر SignalR
                    await _trainChatHubContext.Clients.All.SendAsync("CloseTrainChat", trainId);

                    _logger.LogInformation("Successfully closed chat for train {TrainId}", trainId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error closing chat for train {TrainId}", trainId);
                }
            }
        }
    }
}