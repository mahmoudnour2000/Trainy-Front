using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;
using Trainy.Repository;
using Trainy.Repositories;
using TraintFinalProject.Model;
using System.Security.Claims;
using System.Linq;

public class PublicChatHub : Hub
{
    private readonly PublicChatRoomRepository _chatRepo;
    private readonly UserProfileRepository _userRepo;

    public PublicChatHub(PublicChatRoomRepository chatRepo, UserProfileRepository userRepo)
    {
        _chatRepo = chatRepo;
        _userRepo = userRepo;
    }

    public override async Task OnConnectedAsync()
    {
        Console.WriteLine($"✅ User {Context.ConnectionId} connected to PublicChatHub");
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        Console.WriteLine($"❌ User {Context.ConnectionId} disconnected from PublicChatHub: {exception?.Message}");
        await base.OnDisconnectedAsync(exception);
    }

    public async Task SendMessage(string userName, string message)
    {
        var userId = Context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(userName) || string.IsNullOrWhiteSpace(message))
            return;

        var user = await _userRepo.GetByUsernameAsync(userName);
        if (user == null)
        {
            Console.WriteLine($"❌ User not found for userId: {userId}");
            return;
        }

        var chatMessage = new PublicChatRoom
        {
            UserId = user.Id,
            Message = message,
            MessageTime = DateTime.Now
        };

        try
        {
            // نضمن إن الحفظ يتم أولاً
            _chatRepo.Add(chatMessage); // الحفظ بـ Add من BaseManager
            Console.WriteLine($"✅ Message saved to database with ID: {chatMessage.PublicChatRoomId}");

            // نرسل الرسالة بعد التأكد من الحفظ
            var messageData = new
            {
                id = chatMessage.PublicChatRoomId,
                name = user.Name ?? user.UserName,
                image = user.Image ?? "/images/default.png",
                message = message,
                time = chatMessage.MessageTime.ToString("HH:mm"),
                userId = user.Id // نضيف userId للريبورت
            };

            await Clients.All.SendAsync("ReceiveMessage", messageData);
            Console.WriteLine($"✅ Message sent to all clients: {messageData}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error in SendMessage: {ex.Message}");
        }
    }

    // ✅ ميثود جديدة لعرض آخر 10 رسائل عند دخول الشات
    public async Task LoadRecentMessages()
    {
        Console.WriteLine($"📥 Loading recent messages for user {Context.ConnectionId}");

        try
        {
            var recentMessages = await _chatRepo.GetRecentMessagesAsync(10);
            Console.WriteLine($"📋 Found {recentMessages.Count()} recent messages");

            var messagesDto = recentMessages.Select(m => new
            {
                id = m.PublicChatRoomId,
                name = m.User.Name ?? m.User.UserName,
                image = m.User.Image ?? "/images/default.png",
                message = m.Message,
                time = m.MessageTime.ToString("HH:mm"),
                userId = m.UserId // نضيف userId للريبورت
            }).ToList();

            await Clients.Caller.SendAsync("LoadMessages", messagesDto);
            Console.WriteLine($"✅ Sent {messagesDto.Count} messages to caller");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error in LoadRecentMessages: {ex.Message}");
        }
    }
}