import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Camera, X, RefreshCw, Zap, ZapOff, Upload, 
  AlertCircle, CheckCircle2, Sparkles, Image as ImageIcon 
} from 'lucide-react';
import { decodeQrFromImageData, decodeQrFromFile, extractBookingReference } from '../../utils/qrScanner';

interface CameraQrScannerProps {
  onScanSuccess: (rawCode: string, extractedRef: string) => void;
  onClose: () => void;
}

export const CameraQrScanner: React.FC<CameraQrScannerProps> = ({
  onScanSuccess,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);
  const [torchAvailable, setTorchAvailable] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [detectedRef, setDetectedRef] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const animationFrameId = useRef<number | null>(null);
  const isScanningActive = useRef<boolean>(true);

  // Play a gentle audio feedback chime on success
  const playSuccessTone = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15); // E6
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Audio playback fails silently if user has not interacted or browser blocks
    }
  }, []);

  // Check if multiple camera devices exist
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        if (videoInputs.length > 1) {
          setHasMultipleCameras(true);
        }
      }).catch(() => {});
    }
  }, []);

  // Stop camera tracks helper
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
  }, [stream]);

  // Start camera stream
  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    setIsLoading(true);
    setCameraError(null);
    stopStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by this browser or context. You can upload an image of the QR code instead.');
      setIsLoading(false);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setIsLoading(false);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }

      // Check torch capability
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack && typeof (videoTrack as any).getCapabilities === 'function') {
        const capabilities = (videoTrack as any).getCapabilities();
        if (capabilities && capabilities.torch) {
          setTorchAvailable(true);
        }
      }
    } catch (err: any) {
      setIsLoading(false);
      console.warn('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera permissions in your browser bar, or upload an image file of your QR code below.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. You can upload an image of the QR code instead.');
      } else if (err.name === 'NotReadableError') {
        setCameraError('Camera is currently in use by another application.');
      } else {
        setCameraError('Unable to open camera. You can upload an image of the booking QR code instead.');
      }
    }
  }, [stopStream]);

  // Toggle torch / flashlight
  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextState = !isTorchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setIsTorchOn(nextState);
    } catch (err) {
      console.warn('Torch toggle error:', err);
    }
  };

  // Toggle front/back camera
  const handleToggleCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Frame scanning loop
  useEffect(() => {
    let active = true;
    isScanningActive.current = true;

    const scanFrame = async () => {
      if (!active || !isScanningActive.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= video.HAVE_CURRENT_DATA) {
        const width = video.videoWidth;
        const height = video.videoHeight;

        if (width > 0 && height > 0) {
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          if (ctx) {
            ctx.drawImage(video, 0, 0, width, height);

            // Center-biased crop calculation for efficiency & speed
            const size = Math.min(width, height) * 0.75;
            const startX = (width - size) / 2;
            const startY = (height - size) / 2;

            const imageData = ctx.getImageData(startX, startY, size, size);
            const scanResult = await decodeQrFromImageData(imageData);

            if (scanResult && scanResult.text) {
              isScanningActive.current = false;
              playSuccessTone();
              const extracted = extractBookingReference(scanResult.text);
              setDetectedRef(extracted);

              // Pause video and trigger callback
              video.pause();
              setTimeout(() => {
                stopStream();
                onScanSuccess(scanResult.text, extracted);
              }, 600);
              return;
            }
          }
        }
      }

      if (active && isScanningActive.current) {
        animationFrameId.current = requestAnimationFrame(scanFrame);
      }
    };

    if (stream && !detectedRef) {
      animationFrameId.current = requestAnimationFrame(scanFrame);
    }

    return () => {
      active = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [stream, detectedRef, onScanSuccess, playSuccessTone, stopStream]);

  // Initial camera start
  useEffect(() => {
    startCamera(facingMode);
    return () => {
      stopStream();
    };
  }, []);

  // Handle image upload fallback
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setCameraError(null);

    try {
      const decodedText = await decodeQrFromFile(file);
      if (decodedText) {
        playSuccessTone();
        const extracted = extractBookingReference(decodedText);
        setDetectedRef(extracted);
        stopStream();
        setTimeout(() => {
          onScanSuccess(decodedText, extracted);
        }, 500);
      } else {
        setCameraError('Could not find a valid QR code in the uploaded image. Please try a clearer picture or enter the reference number manually.');
      }
    } catch {
      setCameraError('Failed to read image file. Please try another image.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-xl flex flex-col items-center">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top action bar */}
      <div className="w-full px-4 py-3 bg-slate-900/90 backdrop-blur-xs flex items-center justify-between z-20 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
            <Camera className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-white tracking-wide">
            Live QR Code Scanner
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {torchAvailable && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                isTorchOn 
                  ? 'bg-amber-400 text-slate-950 font-bold' 
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              title={isTorchOn ? 'Turn flashlight off' : 'Turn flashlight on'}
            >
              {isTorchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
            </button>
          )}

          {hasMultipleCameras && (
            <button
              type="button"
              onClick={handleToggleCamera}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title="Switch camera"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Close scanner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Video Viewport */}
      <div className="relative w-full aspect-square max-h-[340px] bg-slate-950 overflow-hidden flex items-center justify-center">
        {/* Video feed */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover ${
            facingMode === 'user' ? 'scale-x-[-1]' : ''
          }`}
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-3 p-4 z-10">
            <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
            <span className="text-xs font-medium text-slate-300">
              Initializing camera feed...
            </span>
          </div>
        )}

        {/* Scanning reticle / viewfinder overlay */}
        {!isLoading && !cameraError && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 z-10">
            {/* Viewfinder square with corner brackets */}
            <div className="relative w-56 h-56 rounded-2xl border-2 border-dashed border-teal-400/40 flex items-center justify-center">
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-3 border-l-3 border-teal-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-3 border-r-3 border-teal-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-3 border-l-3 border-teal-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-3 border-r-3 border-teal-400 rounded-br-lg" />

              {/* Laser animation bar */}
              {!detectedRef && (
                <div 
                  className="absolute left-2 right-2 h-0.5 bg-linear-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_12px_#2dd4bf] animate-bounce duration-1000"
                  style={{ animationDuration: '2s' }}
                />
              )}

              {/* Detected success banner */}
              {detectedRef && (
                <div className="bg-teal-500 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-in zoom-in-95">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  <span className="font-mono font-extrabold text-sm tracking-wider">
                    {detectedRef}
                  </span>
                </div>
              )}
            </div>

            <p className="mt-4 text-[11px] font-medium text-slate-300/90 text-center max-w-[240px] drop-shadow-md">
              Point camera at booking QR code on your phone, confirmation PDF or printed invoice
            </p>
          </div>
        )}

        {/* Error / Fallback State */}
        {cameraError && (
          <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center gap-3 z-10">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-xs">
              <h4 className="font-heading font-bold text-sm text-white">
                Camera Notice
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {cameraError}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 w-full max-w-xs">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Scanning File...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload QR Image</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => startCamera(facingMode)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
              >
                Retry Camera
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom helper bar */}
      <div className="w-full px-4 py-3 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1.5 font-medium transition-colors"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Upload QR Image File</span>
        </button>

        <button
          type="button"
          onClick={() => {
            stopStream();
            onClose();
          }}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium"
        >
          Enter code manually
        </button>
      </div>
    </div>
  );
};
