using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using TraintFinalProject.Model.Enums;

namespace TraintFinalProject.Model
{
    public class OfferConfiguration : IEntityTypeConfiguration<Offer>
    {
        public void Configure(EntityTypeBuilder<Offer> builder)
        {
            builder.HasKey(o => o.ID);
            builder.Property(o => o.CreatedAt).HasDefaultValueSql("GETUTCDATE()").IsRequired();
            builder.Property(o => o.UpdatedAt).HasDefaultValueSql("GETUTCDATE()").IsRequired();
            builder.Property(o => o.Price).HasColumnType("decimal(18,2)").IsRequired();

            builder.HasQueryFilter(o => !o.IsDeleted);
            builder.Property(o => o.IsDeleted).HasDefaultValue(false);

            builder.Property(o => o.OfferTime).IsRequired().HasDefaultValueSql("GETUTCDATE()");

            builder.Property(o => o.PaymentMethod)
                .IsRequired()
                .HasConversion<string>()
                .HasDefaultValue(PaymentMethod.VodafoneCash);

            builder.Property(o => o.OfferStatus)
                .IsRequired()
                .HasConversion<string>()
                .HasDefaultValue(OfferStatus.Pending);

            builder.Property(o => o.Description).HasMaxLength(500).IsRequired();
            builder.Property(o => o.Category).HasMaxLength(100).IsRequired();
            builder.Property(o => o.Weight).IsRequired();
            builder.Property(o => o.LastUpdate).IsRequired();

            builder.HasOne(o => o.Courier)
                .WithMany(c => c.Offers) // No navigation property on User for offers as Courier
                .HasForeignKey(o => o.CourierId)
                .OnDelete(DeleteBehavior.NoAction)
                .IsRequired(false);

            builder.HasOne(o => o.Sender)
                .WithMany(s => s.Offers) // No navigation property on User for offers as Sender
                .HasForeignKey(o => o.SenderId)
                .OnDelete(DeleteBehavior.NoAction);

            builder.HasOne(o => o.PickupStation)
                .WithMany(srs => srs.PickupOffers)
                .HasForeignKey(o => o.PickupStationId)
                .OnDelete(DeleteBehavior.NoAction);

            builder.HasOne(o => o.DropoffStation)
                .WithMany(srs => srs.DropoffOffers)
                .HasForeignKey(o => o.DropoffStationId)
                .OnDelete(DeleteBehavior.NoAction);

            builder.HasIndex(o => o.CreatedAt);
            builder.HasIndex(o => o.UpdatedAt);
            builder.HasIndex(o => o.IsDeleted);
            builder.HasIndex(o => o.CourierId);
            builder.HasIndex(o => o.SenderId);
            builder.HasIndex(o => o.PickupStationId);
            builder.HasIndex(o => o.DropoffStationId);

         
        }
    }
}