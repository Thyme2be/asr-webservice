from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import tempfile
import logging
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Thai ASR Transcription API",
    description="FastAPI backend for Thai audio transcription using FastConformer",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js development server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Note: In a real implementation, you would import your FastConformer model here
# For example:
# from your_model_module import FastConformerModel
# model = FastConformerModel.load_pretrained("path/to/your/model")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Thai ASR Transcription API is running"}

@app.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Transcribe audio file to Thai text using FastConformer model
    """
    try:
        # Validate file type
        allowed_types = [
            "audio/mpeg", "audio/wav", "audio/mp4", 
            "audio/flac", "audio/ogg", "audio/x-wav"
        ]
        
        if audio.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type: {audio.content_type}"
            )

        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            # Write uploaded file to temporary location
            content = await audio.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        try:
            # This is where you would use your FastConformer model
            # For demonstration, we'll return a mock response
            # In a real implementation, you would do:
            # transcription_result = model.transcribe(temp_file_path)
            
            # Mock transcription result (replace with actual model inference)
            mock_thai_text = "สวัสดีครับ นี่คือตัวอย่างการแปลงเสียงพูดเป็นข้อความภาษาไทย"
            
            # Calculate audio duration (you might want to use librosa or similar)
            # For now, we'll use a mock duration
            duration = 10.5  # seconds
            
            result = {
                "text": mock_thai_text,
                "confidence": 0.95,
                "duration": duration,
                "model": "FastConformer",
                "language": "th"
            }
            
            logger.info(f"Transcription completed for file: {audio.filename}")
            return result
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Thai ASR API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)