import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text

# Load env variables
dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend", ".env")
load_dotenv(dotenv_path)

db_url = os.getenv("DATABASE_URL", "sqlite:///./mediguard.db")
print("="*60)
print(f"DATABASE CHECKER")
print("="*60)
print(f"Target DB: {db_url.split('@')[-1] if '@' in db_url else db_url}")
print("-"*60)

try:
    # Set a 5-second timeout for remote postgres check
    connect_args = {}
    if not db_url.startswith("sqlite"):
        connect_args = {"connect_timeout": 5}
        
    engine = create_engine(db_url, connect_args=connect_args)
    
    with engine.connect() as conn:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        if not tables:
            print("No tables found. (Database is empty)")
        else:
            print(f"Found {len(tables)} tables:")
            for table in tables:
                # Count rows
                count_query = text(f"SELECT COUNT(*) FROM {table}")
                res = conn.execute(count_query).scalar()
                print(f" - Table: {table:<20} | Total rows: {res}")
                
            print("-"*60)
            # Sample users if table exists
            if "users" in tables:
                print("\n[Users Registered]:")
                user_query = text("SELECT id, email, full_name, created_at FROM users")
                users = conn.execute(user_query).fetchall()
                for u in users:
                    print(f" ID: {u[0]} | Name: {u[2]} | Email: {u[1]} | Joined: {u[3]}")
            
            # Sample reminders if table exists
            if "reminders" in tables:
                print("\n[Active Medication Reminders]:")
                rem_query = text("SELECT id, drug_name, dosage, time_of_day FROM reminders")
                reminders = conn.execute(rem_query).fetchall()
                for r in reminders:
                    print(f" ID: {r[0]} | Drug: {r[1]} | Dose: {r[2]} | Time: {r[3]}")
                    
except Exception as e:
    print(f"Error checking database: {e}")
    print("If remote postgres connection timed out, port 5432 outbound traffic is likely blocked on your network.")
print("="*60)
