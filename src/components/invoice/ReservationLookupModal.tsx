import React, { useState } from 'react';
import { 
  Search, QrCode, CheckCircle2, AlertCircle, ArrowRight, 
  X, Camera, Sparkles, Check, RefreshCw, Eye, Download 
} from 'lucide-react';
import { Booking, HostelSettings } from '../../types';
import { CameraQrScanner } from './CameraQrScanner';
import { generateBookingQrCodeDataUrl } from '../../utils/invoice';

interface ReservationLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  settings: HostelSettings;
  onSelectBooking: (booking: Booking) => void;
  initialScanning?: boolean;
}

export const ReservationLookupModal: React.FC<ReservationLookupModalProps> = ({
  isOpen,
  onClose,
  bookings,
  settings,
  onSelectBooking,
  initialScanning = false,
}) => {
  const [refInput, setRefInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(initialScanning);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scannedMatch, setScannedMatch] = useState<Booking | null>(null);
  const [previewQrBooking, setPreviewQrBooking] = useState<Booking | null>(null);
  const [previewQrDataUrl, setPreviewQrDataUrl] = useState<string>('');

  React.useEffect(() => {
    if (isOpen) {
      setIsScanning(Boolean(initialScanning));
      setErrorMsg(null);
      setScannedMatch(null);
    }
  }, [isOpen, initialScanning]);

  if (!isOpen) return null;

  const handleLookup = (codeToSearch?: string) => {
    const query = (codeToSearch || refInput).trim().replace(/^#/, '').toUpperCase();
    if (!query) {
      setErrorMsg('Please enter or scan a booking reference code.');
      return;
    }

    const found = bookings.find(
      (b) => b.referenceNumber.toUpperCase() === query || 
             b.referenceNumber.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === query.replace(/[^A-Za-z0-9]/g, '')
    );

    if (found) {
      setErrorMsg(null);
      onSelectBooking(found);
      onClose();
    } else {
      setErrorMsg(`No confirmed reservation found for reference "${query}". Please check the code and try again.`);
    }
  };

  const handleScanSuccess = (rawCode: string, extractedRef: string) => {
    const code = (extractedRef || rawCode).trim().replace(/^#/, '');
    setRefInput(code);
    setLastScannedCode(code);
    setIsScanning(false);
    setErrorMsg(null);

    // Auto-match against active bookings
    const query = code.toUpperCase();
    const found = bookings.find(
      (b) => b.referenceNumber.toUpperCase() === query || 
             b.referenceNumber.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === query.replace(/[^A-Za-z0-9]/g, '')
    );

    if (found) {
      setScannedMatch(found);
      // Quickly jump directly to their reservation details
      onSelectBooking(found);
      onClose();
    } else {
      setScannedMatch(null);
      setErrorMsg(`Scanned code "${code}", but no reservation with this reference was found in the system.`);
    }
  };

  const handleOpenSampleQr = (booking: Booking) => {
    setPreviewQrBooking(booking);
    generateBookingQrCodeDataUrl(booking).then((url) => {
      setPreviewQrDataUrl(url);
    });
  };

  const handleResetModal = () => {
    setIsScanning(false);
    setErrorMsg(null);
    setScannedMatch(null);
    setLastScannedCode(null);
    setPreviewQrBooking(null);
    onClose();
  };

  const sampleConfirmedBookings = bookings
    .filter((b) => b.status === 'confirmed' || b.status === 'checked_in')
    .slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold border border-teal-200/80">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-slate-900">
                Find Reservation & Invoice
              </h3>
              <p className="text-xs text-slate-500">
                Scan your booking QR code or enter your REF
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetModal}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Camera Scanner Mode */}
        {isScanning ? (
          <div className="space-y-3">
            <CameraQrScanner
              onScanSuccess={handleScanSuccess}
              onClose={() => setIsScanning(false)}
            />
            <p className="text-[11px] text-slate-500 text-center">
              Hold the booking QR code in front of your camera. Reference number will be auto-filled immediately.
            </p>
          </div>
        ) : (
          /* Normal Lookup Form Mode */
          <div className="space-y-4">
            {/* Primary 'Scan QR Code' Button */}
            <button
              type="button"
              id="modal-scan-qr-code-btn"
              onClick={() => {
                setErrorMsg(null);
                setScannedMatch(null);
                setIsScanning(true);
              }}
              className="w-full py-3 px-4 rounded-2xl bg-linear-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold text-xs shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 transition-all active:scale-[0.99] group cursor-pointer"
              title="Access device camera to read booking reference QR code"
            >
              <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                <Camera className="w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform" />
              </div>
              <span className="tracking-wide">Scan QR Code with Camera</span>
              <Sparkles className="w-3.5 h-3.5 text-teal-200" />
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                or enter code manually
              </span>
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLookup();
              }}
              className="space-y-3"
            >
              <div className="relative">
                <input
                  type="text"
                  id="booking-ref-lookup-input"
                  value={refInput}
                  onChange={(e) => {
                    setRefInput(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                    if (scannedMatch) setScannedMatch(null);
                  }}
                  placeholder="e.g. WH-8492 or 8492"
                  className="w-full px-4 py-3 pl-11 pr-11 rounded-2xl bg-slate-50 border border-slate-300 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white uppercase tracking-wider"
                  autoFocus
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />

                <button
                  type="button"
                  id="inline-scan-qr-btn"
                  onClick={() => setIsScanning(true)}
                  className="absolute right-3 top-3 p-1 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-slate-200 transition-colors"
                  title="Scan QR Code with Camera"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Scanned Badge Confirmation */}
              {lastScannedCode && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 border border-teal-200/80 rounded-xl text-teal-800 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span className="truncate">
                    Auto-filled from QR code: <strong className="font-mono">#{lastScannedCode}</strong>
                  </span>
                </div>
              )}

              {/* Immediate Match Card if scanned or found */}
              {scannedMatch && (
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      Reservation Found
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                      #{scannedMatch.referenceNumber}
                    </span>
                  </div>
                  <div className="text-xs text-slate-700">
                    <p className="font-bold text-slate-900">
                      {scannedMatch.guest.firstName} {scannedMatch.guest.lastName}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      {scannedMatch.roomName} • {scannedMatch.checkInDate} to {scannedMatch.checkOutDate}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectBooking(scannedMatch);
                      onClose();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>View Confirmed Reservation & Invoice</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                id="submit-lookup-ref-btn"
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Switch to Confirmed Reservation</span>
                <ArrowRight className="w-4 h-4 text-teal-400" />
              </button>
            </form>

            {/* Quick Demo Reference Shortcuts */}
            {sampleConfirmedBookings.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Quick Select Confirmed Reservations:
                  </span>
                  <span className="text-[10px] text-teal-600 font-medium">
                    Click to test autofill
                  </span>
                </div>
                <div className="space-y-1.5">
                  {sampleConfirmedBookings.map((b) => (
                    <div
                      key={b.id}
                      className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-teal-50/60 border border-slate-200/80 hover:border-teal-200 flex items-center justify-between text-xs transition-colors group"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setRefInput(b.referenceNumber);
                          handleLookup(b.referenceNumber);
                        }}
                        className="flex-1 text-left flex items-center justify-between min-w-0 pr-2 cursor-pointer"
                      >
                        <div className="truncate">
                          <span className="font-bold text-slate-900 group-hover:text-teal-900">
                            {b.guest.firstName} {b.guest.lastName}
                          </span>
                          <span className="text-[11px] text-slate-500 ml-2 truncate">
                            ({b.roomName})
                          </span>
                        </div>
                        <span className="font-mono font-bold text-[11px] text-teal-700 bg-teal-50 group-hover:bg-white px-2 py-0.5 rounded border border-teal-200 shrink-0 ml-2">
                          #{b.referenceNumber}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenSampleQr(b);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-100/70 transition-colors shrink-0"
                        title={`View QR Code for ${b.referenceNumber} (to test camera scan)`}
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sample QR Code Test Modal / Preview */}
            {previewQrBooking && previewQrDataUrl && (
              <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-3 animate-in zoom-in-95">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-bold">
                      Sample QR: #{previewQrBooking.referenceNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewQrBooking(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-white p-3 rounded-xl flex items-center justify-center max-w-[200px] mx-auto shadow-md">
                  <img
                    src={previewQrDataUrl}
                    alt={`QR for ${previewQrBooking.referenceNumber}`}
                    className="w-full h-auto object-contain"
                  />
                </div>

                <p className="text-[11px] text-slate-300 text-center">
                  Point another device camera or webcam at this QR code to test instant lookup & auto-fill.
                </p>

                <div className="flex items-center gap-2">
                  <a
                    href={previewQrDataUrl}
                    download={`WaveHaven-QR-${previewQrBooking.referenceNumber}.png`}
                    className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-center font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3 h-3 text-teal-400" />
                    <span>Download QR</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      handleScanSuccess(previewQrDataUrl, previewQrBooking.referenceNumber);
                      setPreviewQrBooking(null);
                    }}
                    className="flex-1 py-1.5 px-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-center font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Simulate Scan</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

