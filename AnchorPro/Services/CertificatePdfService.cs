using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace AnchorPro.Services
{
    /// <summary>
    /// Renders a Payment Certificate as a PDF for emailing to a client/consultant — mirrors the
    /// layout of anchor-pro-web's certificates/[id]/print page (kept in sync by hand since this
    /// is a separately-authored server-side document, not a render of that React page).
    /// </summary>
    public class CertificatePdfService : ICertificatePdfService
    {
        private static readonly Dictionary<string, string> CurrencySymbols = new()
        {
            ["ZMW"] = "K",
            ["USD"] = "$",
            ["ZAR"] = "R",
            ["KES"] = "KSh",
            ["GBP"] = "£",
        };

        /// <summary>Shared with callers (e.g. the certificate email body) so amounts read the same everywhere.</summary>
        public static string Money(decimal amount, string currencyCode)
        {
            var symbol = CurrencySymbols.TryGetValue(currencyCode.ToUpperInvariant(), out var s) ? s : currencyCode;
            return $"{symbol} {amount:N2}";
        }

        private static readonly string[] StatusLabels =
        {
            "Draft", "Submitted to Consultant", "Queried", "Approved", "Issued", "Paid"
        };

        public byte[] GenerateCertificatePdf(PaymentCertificate cert, Tenant tenant, string currencyCode)
        {
            var statusLabel = StatusLabels[(int)cert.Status];

            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    // "Lato" is the font QuestPDF bundles and registers automatically in every
                    // environment (no OS font dependency) — safe to rely on in any deployment.
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Lato"));

                    page.Header().Column(col =>
                    {
                        col.Item().Row(row =>
                        {
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text(tenant.Name?.ToUpperInvariant() ?? "COMPANY NAME")
                                    .FontSize(18).Bold().FontColor("#10b981");
                                if (!string.IsNullOrWhiteSpace(tenant.Address))
                                    c.Item().Text(tenant.Address).FontSize(9).FontColor(Colors.Grey.Darken1);
                                var contactLine = string.Join(" · ", new[] { tenant.ContactEmail, tenant.ContactPhone }
                                    .Where(v => !string.IsNullOrWhiteSpace(v)));
                                if (!string.IsNullOrWhiteSpace(contactLine))
                                    c.Item().Text(contactLine).FontSize(8).FontColor(Colors.Grey.Medium);
                            });

                            row.RelativeItem().Column(c =>
                            {
                                c.Item().AlignRight().Text("INTERIM PAYMENT CERTIFICATE").FontSize(14).Bold();
                                c.Item().AlignRight().Text($"Certificate No: {cert.CertificateNumber}").FontSize(10).SemiBold();
                                c.Item().AlignRight().Text($"Period: {cert.PeriodStartDate:d MMM yyyy} – {cert.PeriodEndDate:d MMM yyyy}").FontSize(9).FontColor(Colors.Grey.Darken1);
                                c.Item().AlignRight().Text($"Status: {statusLabel}").FontSize(9).SemiBold().FontColor("#10b981");
                            });
                        });
                        col.Item().PaddingTop(10).LineHorizontal(2).LineColor("#10b981");
                    });

                    page.Content().PaddingTop(20).Column(col =>
                    {
                        col.Spacing(16);

                        // Project / certification info
                        col.Item().Row(row =>
                        {
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text("PROJECT").FontSize(8).FontColor(Colors.Grey.Medium);
                                c.Item().Text(cert.Project?.Name ?? "Project").FontSize(12).SemiBold();
                                if (!string.IsNullOrWhiteSpace(cert.ConsultantName))
                                    c.Item().Text($"Consultant: {cert.ConsultantName}").FontSize(9).FontColor(Colors.Grey.Darken1);
                            });
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text("CERTIFICATION DETAILS").FontSize(8).FontColor(Colors.Grey.Medium);
                                c.Item().Text($"Retention Rate: {cert.RetentionPercentage}%").FontSize(9);
                                if (cert.ApprovedAt.HasValue)
                                    c.Item().Text($"Approved On: {cert.ApprovedAt:d MMM yyyy}").FontSize(9);
                            });
                        });

                        if (cert.Status == CertificateStatus.Queried && !string.IsNullOrWhiteSpace(cert.ConsultantNotes))
                        {
                            col.Item().Background("#fffbeb").Border(1).BorderColor("#fde68a").Padding(10).Column(c =>
                            {
                                c.Item().Text("CONSULTANT QUERY").FontSize(8).Bold().FontColor("#92400e");
                                c.Item().Text(cert.ConsultantNotes).FontSize(9).FontColor("#78350f");
                            });
                        }

                        // Line items
                        col.Item().Column(c =>
                        {
                            c.Item().Text("MEASURED WORK VALUATION").FontSize(8).FontColor(Colors.Grey.Medium);
                            c.Item().Table(table =>
                            {
                                table.ColumnsDefinition(cd =>
                                {
                                    cd.RelativeColumn(1);   // Item
                                    cd.RelativeColumn(3);   // Description
                                    cd.RelativeColumn(1);   // Unit
                                    cd.RelativeColumn(1.2f); // This Period
                                    cd.RelativeColumn(1.5f); // Cumulative Value
                                    cd.RelativeColumn(1);   // % Done
                                });

                                table.Header(header =>
                                {
                                    string[] headers = { "Item", "Description", "Unit", "This Period", "Cumulative Value", "% Done" };
                                    foreach (var h in headers)
                                        header.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text(h).FontSize(8).Bold();
                                });

                                foreach (var item in cert.Items.OrderBy(i => i.BoqItem?.ItemNumber))
                                {
                                    var boqItem = item.BoqItem;
                                    table.Cell().Padding(4).Text(boqItem?.ItemNumber ?? "").FontSize(8).FontColor("#2563eb");
                                    table.Cell().Padding(4).Text(boqItem?.Description ?? "").FontSize(8);
                                    table.Cell().Padding(4).Text(boqItem?.UnitOfMeasure ?? "").FontSize(8).FontColor(Colors.Grey.Darken1);
                                    table.Cell().Padding(4).AlignRight().Text(item.CurrentQuantityCompleted.ToString("N0")).FontSize(8);
                                    table.Cell().Padding(4).AlignRight().Text(Money(item.CumulativeValueCompleted, currencyCode)).FontSize(8).SemiBold();
                                    table.Cell().Padding(4).AlignCenter().Text($"{Math.Round(item.PercentageComplete)}%").FontSize(8);
                                }
                            });
                        });

                        // Variations
                        if (cert.Variations.Count > 0)
                        {
                            col.Item().Column(c =>
                            {
                                c.Item().Text("APPROVED VARIATIONS INCLUDED").FontSize(8).FontColor(Colors.Grey.Medium);
                                c.Item().Table(table =>
                                {
                                    table.ColumnsDefinition(cd =>
                                    {
                                        cd.RelativeColumn(1);
                                        cd.RelativeColumn(3);
                                        cd.RelativeColumn(1.5f);
                                    });
                                    table.Header(header =>
                                    {
                                        string[] headers = { "VO #", "Title", "Valued Amount" };
                                        foreach (var h in headers)
                                            header.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text(h).FontSize(8).Bold();
                                    });
                                    foreach (var cv in cert.Variations)
                                    {
                                        table.Cell().Padding(4).Text(cv.Variation?.VariationNumber ?? "").FontSize(8).FontColor("#2563eb");
                                        table.Cell().Padding(4).Text(cv.Variation?.Title ?? "").FontSize(8);
                                        table.Cell().Padding(4).AlignRight().Text(Money(cv.ValuedAmount, currencyCode)).FontSize(8).SemiBold();
                                    }
                                });
                            });
                        }

                        // Summary
                        col.Item().AlignRight().Width(260).Column(c =>
                        {
                            c.Item().Row(r => { r.RelativeItem().Text("Gross Valuation to Date").FontSize(9); r.ConstantItem(100).AlignRight().Text(Money(cert.GrossValuationToDate, currencyCode)).FontSize(9).SemiBold(); });
                            c.Item().Row(r => { r.RelativeItem().Text($"Retention ({cert.RetentionPercentage}%)").FontSize(9); r.ConstantItem(100).AlignRight().Text($"-{Money(cert.RetentionDeductionToDate, currencyCode)}").FontSize(9).FontColor(Colors.Red.Medium); });
                            c.Item().Row(r => { r.RelativeItem().Text("Previous Certificates Paid").FontSize(9); r.ConstantItem(100).AlignRight().Text($"-{Money(cert.PreviousCertificatesPaid, currencyCode)}").FontSize(9); });
                            c.Item().PaddingTop(4).BorderTop(2).BorderColor(Colors.Grey.Lighten2).PaddingTop(4).Row(r =>
                            {
                                r.RelativeItem().Text("Net Amount Due This Period").FontSize(11).Bold();
                                r.ConstantItem(100).AlignRight().Text(Money(cert.NetAmountDue, currencyCode)).FontSize(11).Bold().FontColor("#10b981");
                            });
                        });

                        // Sign-off
                        col.Item().PaddingTop(20).BorderTop(1).BorderColor(Colors.Grey.Lighten2).PaddingTop(16).Row(row =>
                        {
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().PaddingBottom(24).Text("Contractor Signature: _______________________").FontSize(9);
                                c.Item().Text("Date: _______________").FontSize(8).FontColor(Colors.Grey.Medium);
                            });
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().PaddingBottom(24).Text("Consultant / QS Signature: _______________________").FontSize(9);
                                c.Item().Text("Date: _______________").FontSize(8).FontColor(Colors.Grey.Medium);
                            });
                        });
                    });

                    page.Footer().AlignCenter().Text(t =>
                    {
                        t.Span("Generated by Anchor Pro").FontSize(7).FontColor(Colors.Grey.Medium);
                    });
                });
            }).GeneratePdf();
        }
    }
}
