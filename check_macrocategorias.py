import psycopg2

DB_URL = "postgresql://postgres.pmjjguyibxydzxnofcjx:ZyMDIx2p3EErqtaG@aws-0-us-west-2.pooler.supabase.com:6543/postgres"

try:
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT macrocategoria FROM expenses LIMIT 20;")
    rows = cur.fetchall()
    print("Distinct macrocategoria values in expenses table:")
    for row in rows:
        print(row[0])
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error querying database: {e}")
