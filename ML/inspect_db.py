import psycopg2
import pandas as pd

DB_URL = "postgresql://postgres.pmjjguyibxydzxnofcjx:ZyMDIx2p3EErqtaG@aws-0-us-west-2.pooler.supabase.com:6543/postgres"

def inspect_categories():
    try:
        conn = psycopg2.connect(DB_URL)
        query = "SELECT macrocategoria, categoria, COUNT(*) as count FROM expenses GROUP BY macrocategoria, categoria LIMIT 20"
        df = pd.read_sql(query, conn)
        print("--- Category Distribution ---")
        print(df)
        
        # Check if macrocategoria is ever null or empty
        null_query = "SELECT COUNT(*) FROM expenses WHERE macrocategoria IS NULL OR macrocategoria = ''"
        null_count = pd.read_sql(null_query, conn).iloc[0,0]
        print(f"\nExpenses with null/empty macrocategoria: {null_count}")
        
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_categories()
