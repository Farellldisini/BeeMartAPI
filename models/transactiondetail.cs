using System.ComponentModel.DataAnnotations;

namespace BeeMart.API.Models;

public class TransactionDetail
{   
    [Key]
    public string IdTransactionDetail{ get; set; } = string.Empty;
    public string IdTransaction { get; set; } = string.Empty;
    public string IdProduct { get; set; } = string.Empty;
    public int Qty{ get; set; }
    public decimal Discount { get; set; }
    public decimal SubTotal { get; set; }
    public Byte Stsrc { get; set; }
    public DateTime Datein { get; set; } 
    public string Userin { get; set; } = string.Empty;
    public DateTime? Dateup { get; set; } = null;
    public string Userup { get; set; } = string.Empty;
    
}