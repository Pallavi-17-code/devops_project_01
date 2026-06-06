import psycopg2
from psycopg2 import pool
import os
from dotenv import load_dotenv

load_dotenv()

# ─── PostgreSQL Connection Pool ──────────────────────────────────────────────
try:
    db_pool = psycopg2.pool.SimpleConnectionPool(
        1, 20,
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD', ''),
        host=os.getenv('DB_HOST', 'localhost'),
        port=os.getenv('DB_PORT', '5432'),
        database=os.getenv('DB_NAME', 'cicd_dashboard')
    )
    if db_pool:
        print("✅ PostgreSQL connection pool created successfully")
except Exception as e:
    print(f"⚠️ Database connection warning: {e}")
    db_pool = None

def get_db_connection():
    if db_pool:
        return db_pool.getconn()
    return None

def release_db_connection(conn):
    if db_pool and conn:
        db_pool.putconn(conn)

def query_db(query, params=(), one=False):
    conn = get_db_connection()
    if not conn:
        return None
    try:
        cur = conn.cursor()
        cur.execute(query, params)
        # For INSERT/UPDATE, commit the transaction
        if query.strip().upper().startswith(('INSERT', 'UPDATE', 'DELETE', 'CREATE')):
            conn.commit()
            if "RETURNING" in query.upper():
                row = cur.fetchone()
                return row
            return True
        
        # For SELECT, fetch results
        rv = cur.fetchall()
        cur.close()
        return (rv[0] if rv else None) if one else rv
    except Exception as e:
        print(f"❌ Query error: {e}")
        return None
    finally:
        release_db_connection(conn)
