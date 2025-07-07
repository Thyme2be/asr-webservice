from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import tempfile
import logging
from typing import Dict, Any

import torch
import torchaudio
from torchaudio.transforms import Resample

# Load official silero VAD model
model, utils = torch.hub.load(
    repo_or_dir="snakers4/silero-vad", model="silero_vad", force_reload=False
)
(get_speech_timestamps, _, read_audio, _, _) = utils


# Load ASR model
import nemo.collections.asr as nemo_asr

asr_model = nemo_asr.models.EncDecCTCModelBPE.restore_from(
    "model/stt_th_fastconformer_ctc_large_nacc_data.nemo"
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Thai ASR Transcription API",
    description="FastAPI backend for Thai audio transcription using FastConformer",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Thai ASR Transcription API is running"}


@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url}")
    response = await call_next(request)
    return response


@app.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)) -> Dict[str, Any]:
    try:
        allowed_types = [
            "audio/mpeg",
            "audio/wav",
            "audio/mp4",
            "audio/flac",
            "audio/ogg",
            "audio/x-wav",
        ]
        if audio.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, detail=f"Unsupported file type: {audio.content_type}"
            )

        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            content = await audio.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        try:
            # Load audio and ensure 16kHz mono
            waveform, sr = torchaudio.load(temp_file_path)
            if waveform.shape[0] > 1:
                waveform = waveform.mean(dim=0, keepdim=True)
            if sr != 16000:
                resampler = torchaudio.transforms.Resample(sr, 16000)
                waveform = resampler(waveform)
                sr = 16000

            # Load silero-vad
            model, utils = torch.hub.load(
                repo_or_dir="snakers4/silero-vad",
                model="silero_vad",
                force_reload=False,
            )
            (get_speech_timestamps, _, _, _, _) = utils

            # Detect speech segments
            speech_timestamps = get_speech_timestamps(
                waveform.squeeze(0), model, sampling_rate=16000
            )

            if not speech_timestamps:
                return {
                    "text": "[No speech detected]",
                    "confidence": 0.0,
                    "duration": waveform.shape[1] / sr,
                }

            # Transcribe each segment
            segments = []
            for i, ts in enumerate(speech_timestamps):
                start = ts["start"]
                end = ts["end"]
                segment_waveform = waveform[:, start:end]

                segment_path = f"/tmp/segment_{i}.wav"
                torchaudio.save(segment_path, segment_waveform, sr)

                hyp = asr_model.transcribe([segment_path])[0]
                
                total_seconds = start // sr
                hours = int(total_seconds // 3600)
                minutes = int((total_seconds % 3600) // 60)
                seconds = int(total_seconds % 60)
                timestamp = f"[{hours:02}:{minutes:02}:{seconds:02}]"

                segments.append(f"{timestamp} {hyp.text}")

                os.remove(segment_path)

            duration = waveform.shape[1] / sr
            return {
                "text": "\n".join(segments),
                "confidence": 0.95,
                "duration": duration,
                "model": "FastConformer + Silero VAD",
                "language": "th",
            }

        finally:
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)

    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
