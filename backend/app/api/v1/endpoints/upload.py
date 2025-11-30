from fastapi import APIRouter, UploadFile, File, HTTPException, Body
import shutil
import os
import uuid
from app.core.config import settings
from supabase import create_client, Client

router = APIRouter()

def get_supabase_client():
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase storage is not configured")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

@router.post("/", response_model=dict)
async def upload_file(file: UploadFile = File(...)):
    try:
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        try:
            # Initialize Supabase client
            supabase = get_supabase_client()
            
            # Read file content
            file_content = await file.read()
            
            # Upload to Supabase Storage
            bucket_name = "menu-items"
            
            # Upload
            res = supabase.storage.from_(bucket_name).upload(
                path=unique_filename,
                file=file_content,
                file_options={"content-type": file.content_type}
            )
            
            # Get Public URL
            public_url = supabase.storage.from_(bucket_name).get_public_url(unique_filename)
            
            return {"url": public_url, "filename": unique_filename}
            
        except Exception as e:
            print(f"Supabase upload failed: {e}")
            # If it's a timeout or connection error, give more details
            raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
            
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/", response_model=dict)
async def delete_file(filename: str = Body(..., embed=True)):
    try:
        # Initialize Supabase client
        supabase = get_supabase_client()
        bucket_name = "menu-items"
        
        # Extract filename from URL if full URL is provided
        if filename.startswith("http"):
            filename = filename.split("/")[-1]
            
        # Delete from Supabase Storage
        res = supabase.storage.from_(bucket_name).remove([filename])
        
        return {"message": "File deleted successfully"}
        
    except Exception as e:
        print(f"Supabase delete failed: {e}")
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")

