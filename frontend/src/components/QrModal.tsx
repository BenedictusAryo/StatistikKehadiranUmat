import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, ExternalLink, Printer } from 'lucide-react';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  posName: string;
  eventName?: string;
  token: string;
}

export const QrModal: React.FC<QrModalProps> = ({
  isOpen,
  onClose,
  posName,
  eventName,
  token,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const kioskUrl = `${window.location.origin}/pos/${token}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(kioskUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl border border-slate-100 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-spring no-print active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <span className="text-[11px] font-mono font-bold tracking-wider text-blue-600 uppercase bg-blue-50 border border-blue-200/60 px-3 py-1 rounded-full">
            QR Akses Pos Masuk
          </span>
          <h3 className="text-xl font-extrabold text-slate-900 mt-2 tracking-tight">{posName}</h3>
          {eventName && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{eventName}</p>
          )}
        </div>

        {/* QR Code Container */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 inline-block my-2 shadow-inner">
          <QRCodeSVG
            value={kioskUrl}
            size={200}
            level="H"
            includeMargin={true}
            className="rounded-xl"
          />
        </div>

        <p className="text-xs text-slate-500 mt-2 px-2">
          Arahkan kamera tablet / smartphone petugas ke QR di atas untuk membuka aplikasi counter.
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col space-y-2 no-print">
          <div className="flex space-x-2">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-spring active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Tersalin!' : 'Salin Tautan'}</span>
            </button>
            <a
              href={kioskUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-spring active:scale-95 shadow-sm"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Buka Kiosk</span>
            </a>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-3 text-slate-500 hover:text-slate-800 text-xs font-medium rounded-xl hover:bg-slate-100 transition-spring active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Lembar QR Pos Ini</span>
          </button>
        </div>
      </div>
    </div>
  );
};
