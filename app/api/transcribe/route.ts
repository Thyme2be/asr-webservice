import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convert the file to a buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create form data for the Python backend
    const backendFormData = new FormData();
    const blob = new Blob([buffer], { type: audioFile.type });
    backendFormData.append('audio', blob, audioFile.name);

    // Call the FastAPI backend
    const backendResponse = await fetch('http://localhost:8000/transcribe', {
      method: 'POST',
      body: backendFormData,
    });

    if (!backendResponse.ok) {
      throw new Error('Backend transcription failed');
    }

    const result = await backendResponse.json();

    return NextResponse.json({
      transcription: result.text,
      confidence: result.confidence || 0.95,
      duration: result.duration || 0,
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Transcription failed' },
      { status: 500 }
    );
  }
}