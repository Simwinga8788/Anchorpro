using System.Security.Cryptography;
using System.Text;

namespace AnchorPro.Services
{
    /// <summary>AES-256-GCM symmetric encryption for storing sensitive config values.</summary>
    public class EncryptionService
    {
        // 32-byte key derived from a fixed passphrase + app name.
        // In production, override via ANCHORPRO_ENCRYPTION_KEY env var (32 chars).
        private readonly byte[] _key;

        public EncryptionService(IConfiguration config)
        {
            var raw = config["Encryption:Key"] ?? "AnchorPro-Default-Key-32-Chars!!";
            // Derive exactly 32 bytes
            _key = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
        }

        public string Encrypt(string plaintext)
        {
            var nonce = new byte[AesGcm.NonceByteSizes.MaxSize]; // 12 bytes
            RandomNumberGenerator.Fill(nonce);

            var plaintextBytes = Encoding.UTF8.GetBytes(plaintext);
            var ciphertext = new byte[plaintextBytes.Length];
            var tag = new byte[AesGcm.TagByteSizes.MaxSize]; // 16 bytes

            using var aes = new AesGcm(_key, AesGcm.TagByteSizes.MaxSize);
            aes.Encrypt(nonce, plaintextBytes, ciphertext, tag);

            // Format: base64(nonce + tag + ciphertext)
            var combined = new byte[nonce.Length + tag.Length + ciphertext.Length];
            Buffer.BlockCopy(nonce, 0, combined, 0, nonce.Length);
            Buffer.BlockCopy(tag, 0, combined, nonce.Length, tag.Length);
            Buffer.BlockCopy(ciphertext, 0, combined, nonce.Length + tag.Length, ciphertext.Length);
            return Convert.ToBase64String(combined);
        }

        public string Decrypt(string cipherBase64)
        {
            var combined = Convert.FromBase64String(cipherBase64);
            var nonce = combined[..12];
            var tag = combined[12..28];
            var ciphertext = combined[28..];
            var plaintext = new byte[ciphertext.Length];

            using var aes = new AesGcm(_key, AesGcm.TagByteSizes.MaxSize);
            aes.Decrypt(nonce, ciphertext, tag, plaintext);
            return Encoding.UTF8.GetString(plaintext);
        }
    }
}
