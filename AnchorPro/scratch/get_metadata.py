import psycopg2

conn_str = "host=aws-0-eu-west-1.pooler.supabase.com port=5432 dbname=postgres user=postgres.hccwermcixoptvgrqypc password=386599/33/1 sslmode=require"

try:
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    
    print("--- EQUIPMENT ---")
    cur.execute('SELECT "Id", "Name" FROM "Equipment" LIMIT 3')
    equip = cur.fetchall()
    for e in equip:
        print(f"Id: {e[0]}, Name: {e[1]}")
        
    print("\n--- JOB TYPES ---")
    cur.execute('SELECT "Id", "Name" FROM "JobTypes" LIMIT 3')
    jt = cur.fetchall()
    for t in jt:
        print(f"Id: {t[0]}, Name: {t[1]}")
        
    cur.close()
    conn.close()
except Exception as e:
    print("Error:", e)
