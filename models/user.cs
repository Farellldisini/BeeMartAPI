using System.ComponentModel.DataAnnotations;

namespace BeeMart.API.Models;

public class User
{
    [Key]
    public string IdUser { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "Cashier";
    public bool Stsrc { get; set; }
    public DateTime? Datein { get; set; }
    public string Userin { get; set; } = string.Empty;
    public DateTime? Dateup { get; set; } = null;
    public string? Userup { get; set; } = null;
    
}