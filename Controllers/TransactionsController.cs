using BeeMart.API.Data;
using BeeMart.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BeeMart.API.Controllers;

[ApiController]
[Route("api/v1/transactions")]
public class TransactionsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public TransactionsController(ApplicationDbContext context)
    {
        _context = context;
    }

    public class CreateTransactionDetailDto
    {
        public string IdProduct { get; set; } = string.Empty;
        public int Qty { get; set; }
        public decimal Price { get; set; }
        public decimal Discount { get; set; }
        public decimal SubTotal { get; set; }
    }

    public class CreateTransactionDto
    {
        public string InvoiceNo { get; set; } = string.Empty;
        public DateTime? TransactionDate { get; set; }
        public string IdUser { get; set; } = string.Empty;
        public int IdPaymentMethod { get; set; }
        public decimal TotalPrice { get; set; }
        public List<CreateTransactionDetailDto> Details { get; set; } = new();
    }

    [HttpPost]
    public async Task<IActionResult> CreateTransaction([FromBody] CreateTransactionDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.InvoiceNo))
        {
            return BadRequest(new { message = "Nomor invoice tidak boleh kosong." });
        }

        if (dto.Details == null || !dto.Details.Any())
        {
            return BadRequest(new { message = "Keranjang belanja tidak boleh kosong." });
        }

        var existingInvoice = await _context.Transactions
            .AnyAsync(t => t.InvoiceNo == dto.InvoiceNo);
        if (existingInvoice)
        {
            return BadRequest(new { message = "Nomor invoice sudah terdaftar." });
        }

        using var dbTransaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var transId = Guid.NewGuid().ToString();
            var txDate = dto.TransactionDate ?? DateTime.Now;

            var transaction = new Transaction
            {
                IdTransaction = transId,
                InvoiceNo = dto.InvoiceNo,
                TransactionDate = txDate,
                IdUser = dto.IdUser,
                IdPaymentMethod = dto.IdPaymentMethod,
                TotalPrice = dto.TotalPrice,
                Stsrc = true,
                Datein = DateTime.Now,
                Userin = dto.IdUser,
                Dateup = null,
                Userup = string.Empty
            };

            _context.Transactions.Add(transaction);

            foreach (var detail in dto.Details)
            {
                var product = await _context.Products.FindAsync(detail.IdProduct);
                if (product == null)
                {
                    await dbTransaction.RollbackAsync();
                    return BadRequest(new { message = $"Produk dengan ID {detail.IdProduct} tidak ditemukan." });
                }

                if (product.Stock < detail.Qty)
                {
                    await dbTransaction.RollbackAsync();
                    return BadRequest(new { message = $"Jumlah barang '{product.Name}' yang dimasukkan melebihi sisa stok." });
                }

                // Decrement stock
                product.Stock -= detail.Qty;

                var detailEntity = new TransactionDetail
                {
                    IdTransactionDetail = Guid.NewGuid().ToString(),
                    IdTransaction = transId,
                    IdProduct = detail.IdProduct,
                    Qty = detail.Qty,
                    Price = detail.Price,
                    Discount = detail.Discount,
                    SubTotal = detail.SubTotal,
                    Stsrc = true,
                    Datein = DateTime.Now,
                    Userin = dto.IdUser,
                    Dateup = null,
                    Userup = string.Empty
                };

                _context.TransactionDetails.Add(detailEntity);
            }

            await _context.SaveChangesAsync();
            await dbTransaction.CommitAsync();

            return Ok(new
            {
                message = "Transaksi berhasil disimpan.",
                idTransaction = transaction.IdTransaction,
                invoiceNo = transaction.InvoiceNo
            });
        }
        catch (Exception ex)
        {
            await dbTransaction.RollbackAsync();
            return StatusCode(500, new { message = "Terjadi kesalahan saat menyimpan transaksi.", error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetTransactions(
        [FromQuery] string? date,
        [FromQuery] string? userId,
        [FromQuery] string? role,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;

        var query = _context.Transactions.AsQueryable();

        // Date filter
        if (!string.IsNullOrWhiteSpace(date) && DateTime.TryParse(date, out var parsedDate))
        {
            var startOfDay = parsedDate.Date;
            var endOfDay = startOfDay.AddDays(1);
            query = query.Where(t => t.TransactionDate >= startOfDay && t.TransactionDate < endOfDay);
        }

        // Role-based authorization filter
        // Kasir only sees their own transactions; Admin sees all
        if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(userId))
        {
            query = query.Where(t => t.IdUser == userId);
        }

        // Order by TransactionDate ascending
        query = query.OrderBy(t => t.TransactionDate);

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        var pagedTransactions = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        // Fetch user mapping
        var userIds = pagedTransactions.Select(t => t.IdUser).Distinct().ToList();
        var users = await _context.Users
            .Where(u => userIds.Contains(u.IdUser))
            .ToDictionaryAsync(u => u.IdUser, u => u.FullName.Length > 0 ? u.FullName : u.Username);

        // Fetch payment method mapping
        var pmIds = pagedTransactions.Select(t => t.IdPaymentMethod).Distinct().ToList();
        var paymentMethods = await _context.PaymentMethods
            .Where(pm => pmIds.Contains(pm.IdPaymentMethod))
            .ToDictionaryAsync(pm => pm.IdPaymentMethod, pm => pm.MethodName);

        // Fetch detail item counts
        var txIds = pagedTransactions.Select(t => t.IdTransaction).ToList();
        var itemCounts = await _context.TransactionDetails
            .Where(td => txIds.Contains(td.IdTransaction))
            .GroupBy(td => td.IdTransaction)
            .Select(g => new { IdTransaction = g.Key, TotalItems = g.Sum(x => x.Qty) })
            .ToDictionaryAsync(x => x.IdTransaction, x => x.TotalItems);

        var result = pagedTransactions.Select(t => new
        {
            idTransaction = t.IdTransaction,
            invoiceNo = t.InvoiceNo,
            transactionDate = t.TransactionDate.ToString("yyyy-MM-dd HH:mm"),
            idUser = t.IdUser,
            cashier = users.ContainsKey(t.IdUser) ? users[t.IdUser] : t.IdUser,
            idPaymentMethod = t.IdPaymentMethod,
            payment = paymentMethods.ContainsKey(t.IdPaymentMethod) ? paymentMethods[t.IdPaymentMethod] : "Cash",
            totalItems = itemCounts.ContainsKey(t.IdTransaction) ? itemCounts[t.IdTransaction] : 0,
            totalPrice = t.TotalPrice
        }).ToList();

        return Ok(new
        {
            page,
            pageSize,
            totalCount,
            totalPages,
            data = result
        });
    }
}
