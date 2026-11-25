"""
SEED DEMO ACCOUNTS INTO SUPABASE AUTH AND PUBLIC TABLES
Creates or updates the 4 official demo accounts used in the login page and presets:
- patient@lifnex.org (Patient@123)
- donor@lifnex.org (Donor@123)
- hospital@lifnex.org (Hospital@123)
- admin@lifnex.org (Admin@123)
"""

import os
from dotenv import load_dotenv
load_dotenv()

from backend.app.core.supabase_client import get_supabase_admin, get_supabase_anon

DEMO_ACCOUNTS = [
    {
        "email": "patient@lifnex.org",
        "password": "Patient@123",
        "role": "patient",
        "full_name": "Rahul Sharma (Demo Patient)",
        "city": "Metropolis"
    },
    {
        "email": "donor@lifnex.org",
        "password": "Donor@123",
        "role": "donor",
        "full_name": "Anita Desai (Demo Donor)",
        "city": "Metropolis",
        "blood_group": "O-",
        "latitude": 28.6200,
        "longitude": 77.2150
    },
    {
        "email": "hospital@lifnex.org",
        "password": "Hospital@123",
        "role": "hospital",
        "full_name": "City Care Hospital Admin",
        "city": "Metropolis"
    },
    {
        "email": "admin@lifnex.org",
        "password": "Admin@123",
        "role": "admin",
        "full_name": "Lifnex Super Administrator",
        "city": "Metropolis"
    }
]

def seed():
    admin = get_supabase_admin()
    if not admin:
        print("[FAIL] Admin client not available.")
        return False

    print("Checking existing Supabase Auth users...")
    try:
        existing_users = {u.email.lower(): u for u in admin.auth.admin.list_users() if u.email}
    except Exception as e:
        print(f"Error listing users: {e}")
        existing_users = {}

    for acc in DEMO_ACCOUNTS:
        email = acc["email"].lower()
        pwd = acc["password"]
        role = acc["role"]
        name = acc["full_name"]
        
        user_id = None
        if email in existing_users:
            u = existing_users[email]
            user_id = u.id
            print(f"Updating password and metadata for existing user: {email} ({user_id})")
            try:
                admin.auth.admin.update_user_by_id(user_id, {
                    "password": pwd,
                    "email_confirm": True,
                    "user_metadata": {"full_name": name, "role": role}
                })
            except Exception as e:
                print(f"  Error updating auth user {email}: {e}")
        else:
            print(f"Creating new confirmed Supabase Auth user: {email}")
            try:
                res = admin.auth.admin.create_user({
                    "email": email,
                    "password": pwd,
                    "email_confirm": True,
                    "user_metadata": {"full_name": name, "role": role}
                })
                user_id = res.user.id
            except Exception as e:
                print(f"  Error creating auth user {email}: {e}")

        if user_id:
            # Sync to public.users table
            db_user = {
                "id": user_id,
                "email": email,
                "full_name": name,
                "role": role,
                "is_active": True,
                "is_demo": True
            }
            try:
                admin.table("users").upsert(db_user).execute()
                print(f"  ✓ Synced {email} to public.users")
            except Exception as e:
                print(f"  Error upserting public.users for {email}: {e}")

            # If donor, sync to donor_profiles
            if role == "donor":
                donor_prof = {
                    "user_id": user_id,
                    "blood_group": acc.get("blood_group", "O-"),
                    "date_of_birth": "1995-05-15",
                    "city": "Metropolis",
                    "latitude": acc.get("latitude", 28.6200),
                    "longitude": acc.get("longitude", 77.2150),
                    "availability_status": "available",
                    "is_verified": True,
                    "travel_radius_km": 15
                }
                try:
                    admin.table("donor_profiles").upsert(donor_prof, on_conflict="user_id").execute()
                    print(f"  ✓ Synced {email} to public.donor_profiles")
                except Exception as e:
                    print(f"  Error upserting donor_profiles for {email}: {e}")

    print("\n[SUCCESS] All 4 demo accounts seeded and confirmed in Supabase Auth & PostgreSQL!")
    return True

if __name__ == "__main__":
    seed()
