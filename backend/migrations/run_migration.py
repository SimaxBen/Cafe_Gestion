"""
Migration: Remove CHECK constraint on staff.role to allow custom roles
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine, text
from app.core.config import settings

def run_migration():
    """Remove CHECK constraint on staff.role column"""
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Remove the CHECK constraint
        conn.execute(text("ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_role_check"))
        conn.commit()
        print("✅ Migration successful: staff.role CHECK constraint removed")
        print("   Staff roles can now be any custom value (barista, server, cleaner, or custom)")

if __name__ == "__main__":
    run_migration()
