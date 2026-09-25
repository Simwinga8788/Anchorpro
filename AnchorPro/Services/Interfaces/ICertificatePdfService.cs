using AnchorPro.Data.Entities;

namespace AnchorPro.Services.Interfaces
{
    public interface ICertificatePdfService
    {
        /// <summary>
        /// Renders a Payment Certificate as a PDF matching the on-screen print layout
        /// (Controllers/PaymentCertificatesController.cs GetById's Include chain must already
        /// be loaded on <paramref name="cert"/> — Project, Items.BoqItem, Variations.Variation).
        /// </summary>
        byte[] GenerateCertificatePdf(PaymentCertificate cert, Tenant tenant, string currencyCode);
    }
}
