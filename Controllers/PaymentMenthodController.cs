using BeeMart.API.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BeeMart.API.Controllers;

[ApiController]
[Route("api/v1/paymentmethod")]
public class PaymentmethodController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PaymentmethodController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetTransactionDetail()
    {
        var paymentmethod = await _context.PaymentMethods.ToListAsync();

        return Ok(paymentmethod);
    }
}