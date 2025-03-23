//src/components/QRScanner.tsx
import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface QRScannerProps {
  onScanSuccess?: (qrCode: string) => void;
  presetField?: 'entry' | 'dinner' | 'snacks' | 'breakfast' | null;
}

export function QRScanner({ onScanSuccess, presetField }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);

  function capitalize(word: string) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  async function handleScanSuccess(srn: string) {
    try {
      console.log('Processing scan for SRN:', srn);
      
      if (!presetField) {
        // If no preset field, just pass the QR code to parent
        if (onScanSuccess) onScanSuccess(srn);
        return;
      }
      
      // Fetch participant data to check if they exist
      const { data: participant, error } = await supabase
        .from('participant')
        .select('srn, entry, dinner, snacks, breakfast')
        .eq('srn', srn)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast.error('Participant not found');
          setTimeout(() =>{startScanner();}, 1500);
          return;
        }
        throw error;
      }

      if (!participant) {
        toast.error('Participant not found');
        setTimeout(() =>{startScanner();}, 1500);
        return;
      }

      // Check if already marked
      if (participant[presetField] === 'done') {
        toast.success(`${capitalize(presetField)} for ${participant.srn} is already marked as done!`);
        setTimeout(() =>{startScanner();}, 1500);
        return;
      }

      // Update attendance directly
      const { error: updateError } = await supabase
        .from('participant')
        .update({
          [presetField]: 'done'
        })
        .eq('srn', participant.srn);

      if (updateError) throw updateError;

      // Show success toast
      toast.success(`${capitalize(presetField)} for ${participant.srn} has been marked as done`);
      
      // Resume scanning after a brief pause
      setTimeout(() => {
        startScanner();
      }, 1500);
      
    } catch (error: any) {
      console.error('Error processing attendance:', error);
      toast.error(error.message || 'Failed to update attendance');
      
      // Resume scanning after error
      setTimeout(() => {
        startScanner();
      }, 1500);
    }
  }

  function startScanner() {
    if (isScanning) return;
    
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { 
        fps: 5,
        qrbox: { width: 300, height: 300 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        formatsToSupport: [
          0, // QR_CODE
          1, // DATA_MATRIX
          2, // EAN_13
          3, // EAN_8
          4  // CODE_39
        ],
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      },
      false
    );

    const success = (decodedText: string) => {
      console.log("QR code successfully scanned:", decodedText);
      scanner.clear();
      setIsScanning(false);
      handleScanSuccess(decodedText);
    };

    const error = (err: any) => {
      // Only log unique errors to avoid console spam
      if (err && err.message !== "No MultiFormat Readers were able to detect the code.") {
        console.error("QR Scanning error:", err);
      }
    };

    setIsScanning(true);
    scanner.render(success, error);
  }

  useEffect(() => {
    startScanner();
    
    return () => {
      // Cleanup on component unmount
      const scanner = Html5QrcodeScanner.prototype;
      if (scanner) {
        scanner.clear?.().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="w-full">
      <div className="mb-4 text-sm text-gray-600">
        <p>Make sure the QR code is:</p>
        <ul className="list-disc pl-5 mt-1">
          <li>Well-lit and not in shadow</li>
          <li>Centered in view of the camera</li>
          <li>Not at a steep angle</li>
        </ul>
      </div>
      <div id="qr-reader" className="w-full rounded-lg overflow-hidden" />
    </div>
  );
}