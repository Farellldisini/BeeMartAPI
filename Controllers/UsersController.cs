using BeeMart.API.Data;
using BeeMart.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BeeMart.API.Controllers;

[ApiController]
[Route("api/v1/users")]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public UsersController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _context.Users.ToListAsync();
        return Ok(users);
    }

    public class LoginDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Invalid login" });
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Username.ToLower() == request.Username.Trim().ToLower());

        if (user == null)
        {
            return BadRequest(new { message = "Invalid login" });
        }

        // Validate role matches
        if (!string.Equals(user.Role, request.Role, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Invalid login" });
        }

        // Verify password using BCrypt
        bool passwordMatches = false;
        try
        {
            passwordMatches = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        }
        catch
        {
            // Fallback for plain text comparison if legacy
            passwordMatches = (request.Password == user.PasswordHash);
        }

        if (!passwordMatches)
        {
            return BadRequest(new { message = "Invalid login" });
        }

        return Ok(new
        {
            idUser = user.IdUser,
            username = user.Username,
            fullName = user.FullName,
            role = user.Role
        });
    }

    public class RegisterDto
    {
        public string Username { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = "Cashier";
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || 
            string.IsNullOrWhiteSpace(request.FullName) || 
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Username, Full Name, Password & Re-Password harus diisi" });
        }

        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Username.ToLower() == request.Username.Trim().ToLower());

        if (existingUser != null)
        {
            return BadRequest(new { message = "username has already exists" });
        }

        // Generate next 5-digit IdUser
        var userIds = await _context.Users.Select(u => u.IdUser).ToListAsync();
        int maxId = 0;
        foreach (var id in userIds)
        {
            if (int.TryParse(id, out int parsed) && parsed > maxId)
            {
                maxId = parsed;
            }
        }
        string newIdUser = (maxId + 1).ToString("D5");

        string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        var newUser = new User
        {
            IdUser = newIdUser,
            Username = request.Username.Trim(),
            FullName = request.FullName.Trim(),
            PasswordHash = passwordHash,
            Role = string.IsNullOrWhiteSpace(request.Role) ? "Cashier" : request.Role,
            Stsrc = true,
            Datein = DateTime.Now,
            Userin = "SYSTEM",
            Dateup = null,
            Userup = null
        };

        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Registration successful",
            idUser = newUser.IdUser,
            username = newUser.Username,
            fullName = newUser.FullName,
            role = newUser.Role
        });
    }
}
