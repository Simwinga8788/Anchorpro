import os
import psycopg2

# Set ANCHORPRO_DB_DSN (libpq "key=value" DSN format) before running — never hardcode credentials here.
conn_str = os.environ["ANCHORPRO_DB_DSN"]

def run():
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    try:
        cur.execute('SELECT "Id", "Email", "TenantId" FROM "AspNetUsers"')
        users = cur.fetchall()
        print("--- USERS ---")
        for u in users:
            uid, email, tenant_id = u
            # Get roles
            cur.execute('''
                SELECT r."Name" 
                FROM "AspNetRoles" r
                JOIN "AspNetUserRoles" ur ON ur."RoleId" = r."Id"
                WHERE ur."UserId" = %s
            ''', (uid,))
            roles = [r[0] for r in cur.fetchall()]
            print(f"Email: {email}, TenantId: {tenant_id}, Roles: {roles}")
            
    except Exception as e:
        print("Error:", e)
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    run()
