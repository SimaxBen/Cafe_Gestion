"""
Verify staff role constraint removal
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine, text
from app.core.config import settings

def verify():
    """Check if the constraint was successfully removed"""
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Check if the constraint exists
        result = conn.execute(text("""
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'staff' 
            AND constraint_type = 'CHECK'
            AND constraint_name LIKE '%role%'
        """))
        
        constraints = result.fetchall()
        
        if constraints:
            print("❌ Role constraint still exists:")
            for c in constraints:
                print(f"   - {c[0]}")
        else:
            print("✅ Success! No role constraint found on staff table")
            print("   Custom roles are now fully supported!")

if __name__ == "__main__":
    verify()
