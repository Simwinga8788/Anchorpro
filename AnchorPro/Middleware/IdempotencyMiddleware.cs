using AnchorPro.Data;
using AnchorPro.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Middleware
{
    /// <summary>
    /// Backs every mutating request that carries an Idempotency-Key header (sent by the frontend's
    /// offline sync queue on every POST/PUT/PATCH/DELETE — see anchor-pro-web/src/lib/api.ts) with
    /// real dedupe: if this exact key already produced a response, that response is replayed
    /// instead of re-running the handler. Without this, a diary entry created while offline that
    /// actually succeeded server-side — but whose confirmation was lost to a dropped connection —
    /// would be created a second time when the client's queue retries it once signal returns.
    /// </summary>
    public class IdempotencyMiddleware
    {
        private readonly RequestDelegate _next;

        public IdempotencyMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, ApplicationDbContext db)
        {
            var method = context.Request.Method;
            var isMutating = HttpMethods.IsPost(method) || HttpMethods.IsPut(method)
                || HttpMethods.IsPatch(method) || HttpMethods.IsDelete(method);

            if (!isMutating || !context.Request.Headers.TryGetValue("Idempotency-Key", out var keyHeader)
                || string.IsNullOrWhiteSpace(keyHeader))
            {
                await _next(context);
                return;
            }

            var key = keyHeader.ToString();

            var existing = await db.IdempotencyRecords.AsNoTracking().FirstOrDefaultAsync(r => r.Key == key);
            if (existing != null)
            {
                context.Response.StatusCode = existing.StatusCode;
                if (!string.IsNullOrEmpty(existing.ContentType))
                    context.Response.ContentType = existing.ContentType;
                if (!string.IsNullOrEmpty(existing.ResponseBody))
                    await context.Response.WriteAsync(existing.ResponseBody);
                return;
            }

            var originalBody = context.Response.Body;
            using var buffer = new MemoryStream();
            context.Response.Body = buffer;

            await _next(context);

            buffer.Seek(0, SeekOrigin.Begin);
            var bodyText = await new StreamReader(buffer).ReadToEndAsync();

            // Only cache genuine successes — a validation error or transient failure must be free
            // to actually retry, not get permanently frozen as "the" response for this key.
            if (context.Response.StatusCode is >= 200 and < 300)
            {
                db.IdempotencyRecords.Add(new IdempotencyRecord
                {
                    Key = key,
                    StatusCode = context.Response.StatusCode,
                    ResponseBody = bodyText,
                    ContentType = context.Response.ContentType,
                    CreatedAt = DateTime.UtcNow
                });
                // Best-effort — a failure to persist the dedupe record must never break the
                // request that already succeeded.
                try { await db.SaveChangesAsync(); } catch { }
            }

            buffer.Seek(0, SeekOrigin.Begin);
            context.Response.Body = originalBody;
            await buffer.CopyToAsync(originalBody);
        }
    }
}
