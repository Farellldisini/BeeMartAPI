using System.ComponentModel.DataAnnotations;

namespace BeeMart.API.Models;

public class PaymentMethod
{
    [Key]
    public int IdPaymentMethod { get; set; }
    public string MethodName { get; set; } = string.Empty;
    public bool Stsrc { get; set; }
    public DateTime Datein { get; set; }
    public string Userin { get; set; } = string.Empty;
    public DateTime? Dateup { get; set; } = null;
    public string? Userup { get; set; } = null;
}