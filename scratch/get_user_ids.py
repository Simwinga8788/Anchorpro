import psycopg2

conn_str = "host=aws-0-eu-west-1.pooler.supabase.com port=5432 dbname=postgres user=postgres.hccwermcixoptvgrqypc password=386599/33/1 sslmode=require"

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
