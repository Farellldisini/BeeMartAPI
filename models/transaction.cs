namespace BeeMart.API.Models;

public class Transaction
{
    public int TransactionID { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public int UserID { get; set; }
    public DateTime TransactionDate { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
}