#!/usr/bin/env python3
"""
Test script to debug register endpoint
"""
import sys
import traceback
from database import init_db, get_db, User
from auth import create_user, UserCreate, get_password_hash

def test_register():
    """Test user registration"""
    try:
        print("1. Initializing database...")
        init_db()
        print("✓ Database initialized")
        
        print("\n2. Testing password hashing...")
        test_password = "test123"
        hashed = get_password_hash(test_password)
        print(f"✓ Password hashed: {hashed[:20]}...")
        
        print("\n3. Creating test user...")
        db = next(get_db())
        
        user_data = UserCreate(
            email="test@example.com",
            username="testuser",
            password="test123"
        )
        
        # Check if user exists
        existing = db.query(User).filter(User.email == user_data.email).first()
        if existing:
            print(f"⚠ User already exists: {existing.email}")
            db.delete(existing)
            db.commit()
            print("✓ Deleted existing user")
        
        user = create_user(db, user_data)
        print(f"✓ User created: {user.email} (ID: {user.id})")
        
        print("\n✅ All tests passed!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nFull traceback:")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_register()
    sys.exit(0 if success else 1)
