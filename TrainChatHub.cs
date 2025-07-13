using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;
using Trainy.Repository;
using TraintFinalProject.Model;
using System.Security.Claims;
using System.Linq;
using Trainy.Repositories;
using System.Web.Mvc;


[Authorize]
public class TrainChatHub : Hub
{
    private readonly TrainChatRoomRepository _chatRepo;
    private readonly UserProfileRepository _userRepo;

    public TrainChatHub(TrainChatRoomRepository chatRepo, UserProfileRepository userRepo)
    {
        _chatRepo = chatRepo;
        _userRepo = userRepo;
    }

    public async Task JoinTrainGroup(int trainId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"Train_{trainId}");
    }

    public async Task SendMessage(int trainId, string userName, string message)
    {
        var userId = Context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(userName) || string.IsNullOrWhiteSpace(message))
            return;

        var user = await _userRepo.GetByUsernameAsync(userName);
        if (user == null) return;

        var chatMessage = new ChatRoom
        {
            TrainId = trainId,
            UserId = user.Id,
            Message = message,
            MessageTime = DateTime.Now,
            IsActive = true
        };

        _chatRepo.AddMessageAsync(chatMessage);

        await Clients.Group($"Train_{trainId}").SendAsync("ReceiveMessage", new
        {
            id = chatMessage.ChatRoomId,
            name = user.Name ?? user.UserName,
            image = user.Image ?? "/images/default.png",
            message = message,
            time = chatMessage.MessageTime.ToString("HH:mm"),
            userId = user.Id
        });
    }

    public async Task LoadRecentMessages(int trainId)
    {
        var recentMessages = await _chatRepo.GetRecentMessagesAsync(trainId, 10);

        var messagesDto = recentMessages.Select(m => new
        {
            id = m.ChatRoomId,
            name = m.User.Name ?? m.User.UserName,
            image = m.User.Image ?? "/images/default.png",
            message = m.Message,
            time = m.MessageTime.ToString("HH:mm"),
            userId = m.UserId
        }).ToList();

        await Clients.Caller.SendAsync("LoadMessages", messagesDto);
    }
}
