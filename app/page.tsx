'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileAudio, Play, Pause, RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

interface TranscriptionResult {
  text: string;
  confidence: number;
  duration: number;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedFormats = ['.mp3', '.wav', '.m4a', '.flac', '.ogg'];

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile) return;

    const fileExtension = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(fileExtension)) {
      setError(`Unsupported file format. Please use: ${acceptedFormats.join(', ')}`);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);
    setProgress(0);

    // Create audio URL for preview
    const url = URL.createObjectURL(selectedFile);
    if (audioRef.current) {
      audioRef.current.src = url;
    }
  }, [acceptedFormats]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  const transcribeAudio = async () => {
    if (!file) return;

    setIsTranscribing(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('audio', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        console.log("Test Simulate Progess")
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);


      const response = await fetch('http://localhost:8000/transcribe', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      console.log("Raw data from backend:", data);
      setResult({
        text: data.text,
        confidence: data.confidence || 0.95,
        duration: data.duration || 0,
      });
    } catch (err) {
      console.error(`The ERROR is: ${err}`)
      setError(err instanceof Error ? err.message : 'An error occurred during transcription');
    } finally {
      setIsTranscribing(false);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const resetAll = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.src = '';
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Thai Audio Transcription
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your audio file and get accurate Thai transcription using our advanced FastConformer ASR model
          </p>
        </div>

        {/* File Upload Section */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gray-800">Upload Audio File</CardTitle>
            <CardDescription className="text-lg">
              Drag and drop your audio file or click to browse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors duration-200 cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedFormats.join(',')}
                onChange={handleFileInputChange}
                className="hidden"
              />
              
              {file ? (
                <div className="space-y-4">
                  <FileAudio className="mx-auto h-12 w-12 text-blue-500" />
                  <div>
                    <p className="text-lg font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      Drop your audio file here
                    </p>
                    <p className="text-sm text-gray-500">
                      Supported formats: {acceptedFormats.join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {file && (
              <div className="mt-6 space-y-4">
                <audio
                  ref={audioRef}
                  onLoadedMetadata={() => {
                    if (audioRef.current) {
                      setDuration(audioRef.current.duration);
                    }
                  }}
                  onTimeUpdate={() => {
                    if (audioRef.current) {
                      setCurrentTime(audioRef.current.currentTime);
                    }
                  }}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />
                
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={togglePlayPause}
                    disabled={!file}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4 mr-2" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    {isPlaying ? 'Pause' : 'Play'}
                  </Button>
                  
                  <span className="text-sm text-gray-500">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetAll}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={transcribeAudio}
                    disabled={!file || isTranscribing}
                    className="px-8 py-3 text-lg bg-blue-600 hover:bg-blue-700"
                  >
                    {isTranscribing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Transcribing...
                      </>
                    ) : (
                      'Start Transcription'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress Section */}
        {isTranscribing && (
          <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Processing Audio</span>
                  <span className="text-sm text-gray-500">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-gray-500 text-center">
                  Please wait while we transcribe your audio file...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Section */}
        {error && (
          <Alert className="mb-8 border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Results Section */}
        {result && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl text-gray-800">Transcription Result</CardTitle>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600">
                    {(result.confidence * 100).toFixed(1)}% confidence
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Thai Transcription</h3>
                  <p className="text-xl leading-relaxed text-gray-900 font-thai">
                    {result.text}
                  </p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Duration:</span>
                    <span className="ml-2 text-gray-600">{formatTime(result.duration)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Confidence:</span>
                    <span className="ml-2 text-gray-600">{(result.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}