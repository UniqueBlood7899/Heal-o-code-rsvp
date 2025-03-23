//src/components/QRScanner.tsx
import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface QRScannerProps {
  onScanSuccess?: (qrCode: string) => void;
  presetField?: 'entry' | 'dinner' | 'snacks' | 'breakfast' | null;
}

export function QRScanner({ onScanSuccess, presetField }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  function capitalize(word: string) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  async function handleScanSuccess(srn: string) {
    try {
      toast(`Processing scan for SRN: ${srn}`);
      
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
          setTimeout(() => { startScanner(); }, 1500);
          return;
        }
        throw error;
      }

      if (!participant) {
        toast.error('Participant not found');
        setTimeout(() => { startScanner(); }, 1500);
        return;
      }

      // Check if already marked
      if (participant[presetField] === 'done') {
        toast.success(`${capitalize(presetField)} for ${participant.srn} is already marked as done!`);
        setTimeout(() => { startScanner(); }, 1500);
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

  async function startScanner() {
    if (isScanning) return;
    
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader');
      }
      
      const scanner = scannerRef.current;
      
      // Stop any ongoing scan
      if (scanner.isScanning) {
        await scanner.stop();
      }
      
      const qrCodeSuccessCallback = (decodedText: string) => {
        console.log("QR code successfully scanned:", decodedText);
        
        // Stop scanning after success
        scanner.stop().then(() => {
          setIsScanning(false);
          handleScanSuccess(decodedText);
        }).catch(console.error);
      };
      
      const config = { 
        fps: 5,
        qrbox: { width: 300, height: 300 },
        aspectRatio: 1.0,
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
      };
      
      // Get the back camera by default (environment-facing camera on mobile)
      // This will use the default camera without showing selection UI
      setIsScanning(true);
      await scanner.start(
        { facingMode: "environment" }, // This uses the back camera on mobile devices
        config,
        qrCodeSuccessCallback,
        (err) => {
          // Only log unique errors to avoid console spam
          if (err && err.message !== "No MultiFormat Readers were able to detect the code.") {
            console.error("QR Scanning error:", err);
          }
        }
      );
    } catch (error) {
      console.error("Failed to start scanner:", error);
      toast.error("Failed to start camera. Please check permissions.");
      setIsScanning(false);
    }
  }

  useEffect(() => {
    startScanner();
    
    return () => {
      // Cleanup on component unmount
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
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