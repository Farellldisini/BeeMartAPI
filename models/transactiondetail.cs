namespace BeeMart.API.Models;

public class TransactionDetail
{
    public string TransactionDetailID { get; set; } = string.Empty;
    public string TransactionID { get; set; } = string.Empty;
    public string ProductID { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Discount { get; set; }
    public decimal Subtotal { get; set; }
    public Byte Stsrc { get; set; }
    public DateTime Datein { get; set; } 
    public string Userin { get; set; } = string.Empty;
    public DateTime? Dateup { get; set; } = null;
    public string Userup { get; set; } = string.Empty;
    
}