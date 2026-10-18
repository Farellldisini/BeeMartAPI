namespace BeeMart.API.Models;

public class TransactionDetail
{
    public int TransactionDetailID { get; set; }
    public int TransactionID { get; set; }
    public int ProductID { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}