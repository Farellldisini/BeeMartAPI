namespace BeeMart.API.Models;

public class Product
{
    public string ProductID { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal Weight { get; set; }
    public int Stock { get; set; }
    public decimal Price { get; set; }
    public decimal Discount { get; set; }
    public Byte Stsrc { get; set; }
    public string Userin { get; set; } = string.Empty;
    public DateTime? dateup { get; set; } = null;
    public string Userup { get; set; } = string.Empty;


    
}