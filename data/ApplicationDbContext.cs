using BeeMart.API.Models;
using Microsoft.EntityFrameworkCore;

namespace BeeMart.API.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<PaymentMethod> PaymentMethods => Set<PaymentMethod>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<TransactionDetail> TransactionDetails
        => Set<TransactionDetail>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>().ToTable("msuser");
        modelBuilder.Entity<Product>().ToTable("MsProduct");
        modelBuilder.Entity<PaymentMethod>().ToTable("ltpaymentmethod");
        modelBuilder.Entity<Transaction>().ToTable("trtransaction");
        modelBuilder.Entity<TransactionDetail>()
            .ToTable("trtransactiondetail");
    }
}