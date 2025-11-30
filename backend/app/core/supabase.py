from typing import Optional
from supabase import create_client, Client
from app.core.config import settings

_supabase_client: Optional[Client] = None

def get_supabase_client() -> Optional[Client]:
    """
    Get Supabase client for storage and realtime features.
    Only initialized if SUPABASE_URL and SUPABASE_KEY are set.
    
    This is optional - the app works fine with just PostgreSQL connection.
    Use this for:
    - File storage (menu item images)
    - Realtime subscriptions
    - Built-in auth (alternative to our JWT)
    """
    global _supabase_client
    
    if _supabase_client is None:
        supabase_url = getattr(settings, 'SUPABASE_URL', None)
        supabase_key = getattr(settings, 'SUPABASE_KEY', None)
        
        if supabase_url and supabase_key:
            _supabase_client = create_client(supabase_url, supabase_key)
    
    return _supabase_client

# Example usage in endpoints:
# 
# from app.core.supabase import get_supabase_client
#
# @router.post("/{item_id}/image")
# async def upload_menu_image(
#     cafe_id: UUID,
#     item_id: UUID,
#     file: UploadFile = File(...),
#     db: Session = Depends(get_db)
# ):
#     supabase = get_supabase_client()
#     if not supabase:
#         raise HTTPException(400, "Storage not configured")
#     
#     # Upload to Supabase Storage
#     bucket = "menu-images"
#     file_path = f"{cafe_id}/{item_id}/{file.filename}"
#     
#     supabase.storage.from_(bucket).upload(
#         file_path,
#         file.file.read(),
#         {"content-type": file.content_type}
#     )
#     
#     # Get public URL
#     url = supabase.storage.from_(bucket).get_public_url(file_path)
#     
#     # Update menu item with image URL
#     menu_item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
#     menu_item.image_url = url
#     db.commit()
#     
#     return {"image_url": url}
