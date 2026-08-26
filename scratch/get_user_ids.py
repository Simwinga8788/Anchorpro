import os
import psycopg2

# Set ANCHORPRO_DB_DSN (libpq "key=value" DSN format) before running — never hardcode credentials here.
conn_str = os.environ["ANCHORPRO_DB_DSN"]

def run():
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    cur.execute('SELECT "Id", "Email" FROM "AspNetUsers"')
    for r in cur.fetchall():
        print(f"Id: '{r[0]}', Email: '{r[1]}'")
    cur.close()
    conn.close()

if __name__ == '__main__':
    run()
