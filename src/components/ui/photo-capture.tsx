import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LucideCamera, LucideUpload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/services/supabase.ts";
import { FoodValue } from "@/types/food-value.ts";

interface PhotoCaptureProps {
  onPhotoAnalyzed: (nutritionData: FoodValue) => void;
  disabled?: boolean;
}

export function PhotoCapture({ onPhotoAnalyzed, disabled }: PhotoCaptureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Предпочтение задней камере
      });
      setStream(mediaStream);
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera. Please try uploading a file instead.");
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [videoRef, stream]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (context) {
      context.drawImage(video, 0, 0);
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);
      setPreviewImage(imageDataUrl);
      stopCamera();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzePhoto = async () => {
    if (!previewImage) return;

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "analyze-nutrition-photo",
        {
          method: "POST",
          body: { image: previewImage },
        },
      );

      if (error) {
        throw error;
      }

      onPhotoAnalyzed(data);
      setIsOpen(false);
      setPreviewImage(null);
    } catch (error) {
      console.error("Error analyzing photo:", error);
      alert("Failed to analyze photo. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetCapture = () => {
    setPreviewImage(null);
    stopCamera();
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      stopCamera();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <LucideCamera className="h-4 w-4" />
          <span className="hidden sm:inline">Scan Nutrition Label</span>
          <span className="inline sm:hidden">Scan</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Scan Nutrition Label
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!previewImage && !stream && (
            <div className="space-y-3">
              <Button
                onClick={startCamera}
                className="flex w-full items-center gap-2"
              >
                <LucideCamera className="h-4 w-4" />
                Use Camera
              </Button>

              <div className="text-center text-sm text-gray-500">or</div>

              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center gap-2"
                >
                  <LucideUpload className="h-4 w-4" />
                  Upload Photo
                </Button>
              </div>
            </div>
          )}

          {stream && !previewImage && (
            <div className="space-y-3">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg"
              />
              <Button onClick={capturePhoto} className="w-full">
                Capture Photo
              </Button>
              <Button variant="outline" onClick={stopCamera} className="w-full">
                Cancel
              </Button>
            </div>
          )}

          {previewImage && (
            <div className="space-y-3">
              <img
                src={previewImage}
                alt="Captured nutrition label"
                className="w-full rounded-lg"
              />
              <div className="flex gap-2">
                <Button
                  onClick={analyzePhoto}
                  disabled={isAnalyzing}
                  className="flex-1"
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze"}
                </Button>
                <Button variant="outline" onClick={resetCapture}>
                  Retake
                </Button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
