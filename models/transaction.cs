using System.ComponentModel.DataAnnotations;

namespace BeeMart.API.Models;

public class Transaction
{
    [Key]
    public string IdTransaction { get; set; } = string.Empty;
    public string InvoiceNo { get; set; } = string.Empty;
    public DateTime TransactionDate { get; set; }
    public string IdUser { get; set; } = string.Empty;
    public int IdPaymentMethod { get; set; }
    public decimal TotalPrice { get; set; }
    public Byte Stsrc { get; set; }
    public DateTime Datein { get; set; }
    public string Userin { get; set; } = string.Empty;
    public DateTime? Dateup { get; set; } = null;
    public string Userup { get; set; } = string.Empty;
}