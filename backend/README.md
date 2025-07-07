# Thai ASR Transcription Backend

This is the FastAPI backend for the Thai Audio Transcription application using the FastConformer model.

## Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Install your FastConformer model dependencies:**
   ```bash
   # Add your specific model requirements here
   # For example, if using NVIDIA NeMo:
   # pip install nemo-toolkit[asr]
   ```

3. **Configure your model:**
   - Replace the mock transcription in `main.py` with your actual FastConformer model
   - Update the model loading and inference code
   - Adjust the audio preprocessing as needed

## Running the Backend

```bash
# Development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production server
uvicorn main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

### POST /transcribe
Upload an audio file and get Thai transcription.

**Request:**
- Content-Type: multipart/form-data
- Body: audio file

**Response:**
```json
{
  "text": "Thai transcription text",
  "confidence": 0.95,
  "duration": 10.5,
  "model": "FastConformer",
  "language": "th"
}
```

### GET /health
Health check endpoint.

## Integration with Your FastConformer Model

To integrate your actual FastConformer model, update the `transcribe_audio` function in `main.py`:

```python
# Replace the mock implementation with your model
from your_model_module import FastConformerModel

# Load your model
model = FastConformerModel.load_pretrained("path/to/your/model")

# In the transcribe_audio function:
transcription_result = model.transcribe(temp_file_path)
```

## Supported Audio Formats

- MP3 (audio/mpeg)
- WAV (audio/wav, audio/x-wav)
- M4A (audio/mp4)
- FLAC (audio/flac)
- OGG (audio/ogg)