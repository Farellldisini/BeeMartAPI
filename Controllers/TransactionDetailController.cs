using BeeMart.API.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BeeMart.API.Controllers;

[ApiController]
[Route("api/v1/transactionDetail")]
public class TransactionDetailController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public TransactionDetailController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetTransactionDetail()
    {
        var transactionDetail = await _context.TransactionDetails.ToListAsync();

        return Ok(transactionDetail);
    }
}