"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (barcode: string) => void;
}

export function CameraBarcodeScanner({ open, onOpenChange, onScan }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [hasCamera, setHasCamera] = useState(true);
  const [cameraError, setCameraError] = useState("");
  const scanningRef = useRef(false);
  const detectRef = useRef<() => void>(() => {});

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const detectBarcode = useCallback(async () => {
    if (!scanningRef.current || !videoRef.current) return;

    if ("BarcodeDetector" in window) {
      try {
        // @ts-expect-error Native BarcodeDetector API
        const barcodeDetector = new window.BarcodeDetector({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"],
        });

        const barcodes = await barcodeDetector.detect(videoRef.current);
        if (barcodes && barcodes.length > 0) {
          const rawValue = barcodes[0].rawValue;
          if (rawValue) {
            scanningRef.current = false;
            stopCamera();
            onScan(rawValue);
            onOpenChange(false);
            toast.success(`Scanned: ${rawValue}`);
            return;
          }
        }
      } catch {
        // fallback
      }
    }

    if (scanningRef.current) {
      requestAnimationFrame(() => detectRef.current());
    }
  }, [stopCamera, onScan, onOpenChange]);

  useEffect(() => {
    detectRef.current = detectBarcode;
  }, [detectBarcode]);

  const startCamera = useCallback(async () => {
    setCameraError("");
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false);
        setCameraError("Camera API not supported on this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      scanningRef.current = true;
      detectBarcode();
    } catch (err) {
      console.warn("Camera access error:", err);
      setHasCamera(false);
      setCameraError("Unable to access camera. Please allow camera permissions or enter code manually.");
    }
  }, [detectBarcode]);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [open, startCamera, stopCamera]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    stopCamera();
    onScan(manualCode.trim());
    onOpenChange(false);
    setManualCode("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <Camera className="h-5 w-5 text-[#E85002]" />
            Barcode Camera Scanner
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Use camera to scan product barcode or type barcode manually.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera Viewport */}
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-900 flex items-center justify-center">
            {hasCamera ? (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
                {/* Visual Laser Scanner Overlay */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative h-44 w-64 rounded-lg border-2 border-dashed border-[#E85002]/80">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                  </div>
                </div>
              </>
            ) : (
              <div className="p-4 text-center text-zinc-400">
                <Camera className="mx-auto h-8 w-8 mb-2 text-zinc-500" />
                <p className="text-xs">{cameraError || "Camera not active."}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 text-xs"
                  onClick={startCamera}
                >
                  <RefreshCw className="mr-1 h-3 w-3" /> Retry Camera
                </Button>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
            Align barcode inside the guide box. The scanner will automatically detect and add the item.
          </p>

          {/* Manual Input Fallback */}
          <form onSubmit={handleManualSubmit} className="flex gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <Input
              placeholder="Or enter barcode manually..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700 text-sm font-mono"
            />
            <Button type="submit" variant="brandGradient" className="shrink-0">
              Submit
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
