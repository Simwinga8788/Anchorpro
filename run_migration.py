import os
import psycopg2

# Set ANCHORPRO_DB_DSN (libpq "key=value" DSN format) before running — never hardcode credentials here.
conn_str = os.environ["ANCHORPRO_DB_DSN"]

try:
    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cursor = conn.cursor()
    
    print("Connected to Supabase. Checking if column exists...")
    cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='Expenses' and column_name='ProjectId';
    """)
    if cursor.fetchone():
        print("Column ProjectId already exists.")
    else:
        print("Running migration...")
        cursor.execute('ALTER TABLE "Expenses" ADD COLUMN "ProjectId" integer NULL;')
        cursor.execute('ALTER TABLE "Expenses" ADD CONSTRAINT "FK_Expenses_Projects_ProjectId" FOREIGN KEY ("ProjectId") REFERENCES "Projects" ("Id") ON DELETE SET NULL;')
        cursor.execute('CREATE INDEX "IX_Expenses_ProjectId" ON "Expenses" ("ProjectId");')
        print("Migration applied successfully!")
        
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
