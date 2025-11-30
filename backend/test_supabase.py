import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

print(f"URL: {url}")
# print(f"Key: {key}") # Don't print the key for security

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found in .env")
    exit(1)

try:
    print("Initializing Supabase client...")
    supabase: Client = create_client(url, key)
    
    print("Listing buckets...")
    buckets = supabase.storage.list_buckets()
    print(f"Found {len(buckets)} buckets:")
    for b in buckets:
        print(f" - {b.name}")
        
    bucket_name = "menu-items"
    print(f"\nChecking if '{bucket_name}' bucket exists...")
    
    bucket_exists = False
    for b in buckets:
        if b.name == bucket_name:
            bucket_exists = True
            break
            
    if not bucket_exists:
        print(f"Warning: Bucket '{bucket_name}' not found in list (might be permissions issue).")
        print("Attempting upload anyway...")
    else:
        print(f"Bucket '{bucket_name}' exists.")
        
    # Try uploading a test file
    print("\nAttempting test upload...")
    import uuid
    test_filename = f"test_{uuid.uuid4()}.txt"
    test_content = b"Hello from Cafe Gestion backend test!"
    
    try:
        res = supabase.storage.from_(bucket_name).upload(
            path=test_filename,
            file=test_content,
            file_options={"content-type": "text/plain"}
        )
        print("Upload successful!")
        print(f"Response: {res}")
        
        # Get Public URL
        public_url = supabase.storage.from_(bucket_name).get_public_url(test_filename)
        print(f"Public URL: {public_url}")
        
    except Exception as e:
        print(f"Upload failed: {e}")
        print("\nPossible causes:")
        print("1. Bucket name is incorrect.")
        print("2. RLS Policies are blocking uploads. You need to add a policy to allow uploads.")
        print("   Go to Storage > Policies > New Policy > For full customization")
        print("   - Allowed operations: INSERT, SELECT, UPDATE")
        print("   - Target roles: anon (or authenticated)")

except Exception as e:
    print(f"An error occurred: {e}")
