using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using TraintFinalProject.Model.Enums;

namespace TraintFinalProject.Model
{
    public class RequestConfiguration : IEntityTypeConfiguration<Request>
    {
        public void Configure(EntityTypeBuilder<Request> builder)
        {
            builder.HasKey(r => r.ID);
            builder.Property(r => r.Message).HasMaxLength(500).IsRequired(); // Updated to Message
            builder.Property(r => r.CreatedAt).HasDefaultValueSql("GETUTCDATE()").IsRequired();
            builder.Property(r => r.UpdatedAt).HasDefaultValueSql("GETUTCDATE()").IsRequired();

            builder.HasQueryFilter(r => !r.IsDeleted);
            builder.Property(r => r.IsDeleted).HasDefaultValue(false);

            builder.Property(r => r.Status)
                .IsRequired()
                .HasConversion<string>()
                .HasDefaultValue(RequestStatus.Pending);

            builder.Property(r => r.ReqTime).IsRequired().HasDefaultValueSql("GETUTCDATE()");

            builder.HasOne(r => r.Courier)
                .WithMany(c => c.Requests)
                .HasForeignKey(r => r.CourierId)
                .OnDelete(DeleteBehavior.NoAction);

            builder.HasOne(r => r.Offer)
                .WithMany(o => o.Requests)
                .HasForeignKey(r => r.OfferId)
                .OnDelete(DeleteBehavior.NoAction);

            // Configure the station property
            builder.Property(r => r.FromStationId).IsRequired();

            builder.HasIndex(r => r.CreatedAt);
            builder.HasIndex(r => r.UpdatedAt);
            builder.HasIndex(r => r.IsDeleted);
            builder.HasIndex(r => r.CourierId);
            builder.HasIndex(r => r.OfferId);
            builder.HasIndex(r => r.FromStationId);
        }
    }
}