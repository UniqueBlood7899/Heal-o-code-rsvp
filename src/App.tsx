//src/App.tsx
import React, { useState } from 'react';
import { QRScanner } from './components/QRScanner';
import { AttendanceForm } from './components/AttendanceForm';
import { Toaster } from 'react-hot-toast';
import { QrCode, Scan } from 'lucide-react';

function App() {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedQR, setScannedQR] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<'entry' | 'dinner' | 'snacks' | 'breakfast' | null>(null);

  const handleScan = (qrCode: string) => {
    setScannedQR(qrCode);
    // Instead of navigating away, just hide the scanner and reset
    setTimeout(() => {
      setShowScanner(false);
      setScannedQR(null);
    }, 1500); // Give time for the toast to be visible
  };

  const handleReset = () => {
    setScannedQR(null);
    setSelectedField(null);
    setShowScanner(false);
  };

  const startScanning = () => {
    if (selectedField) {
      setShowScanner(true);
    } else {
      alert("Please select a field first!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Toaster position="top-center" />
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <QrCode className="w-16 h-16 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Heal-o-code QR Scanner
          </h1>
          <p className="text-gray-600 text-lg">
            Track attendance with a simple scan
          </p>
        </div>

        <div className="max-w-md mx-auto mb-6">
          <label className="block text-gray-700 mb-2">Select Attendance Type:</label>
          <select
            className="w-full p-3 border border-gray-300 rounded-lg"
            value={selectedField || ""}
            onChange={(e) => setSelectedField(e.target.value as any)}
          >
            <option value="" disabled>Select Type</option>
            <option value="entry">Entry</option>
            <option value="dinner">Dinner</option>
            <option value="snacks">Snacks</option>
            <option value="breakfast">Breakfast</option>
          </select>
        </div>

        <div className="max-w-md mx-auto">
          {showScanner ? (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <QRScanner 
                onScanSuccess={handleScan} 
                presetField={selectedField} 
              />
            </div>
          ) : (
            <button
              onClick={startScanning}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white py-4 px-6 rounded-xl hover:bg-blue-700 transition-colors text-lg font-semibold shadow-lg hover:shadow-xl"
            >
              <Scan className="w-6 h-6" />
              Scan QR Code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;