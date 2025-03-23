import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { Check, X, ArrowLeft } from 'lucide-react';

interface Participant {
  srn: string;
  entry: string | null;
  dinner: string | null;
  snacks: string | null;
  breakfast: string | null;
}

interface AttendanceFormProps {
  qrCode: string;
  onReset: () => void;
  presetField: 'entry' | 'dinner' | 'snacks' | 'breakfast' | null;
  isScanning?: boolean; // Add this prop to indicate when scanning is active
}

type AttendanceField = 'entry' | 'dinner' | 'snacks' | 'breakfast';

export function AttendanceForm({ qrCode, onReset, presetField, isScanning = false }: AttendanceFormProps) {
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<AttendanceField>(presetField || 'entry');

  useEffect(() => {
    fetchParticipantData();
  }, [qrCode]);

  async function fetchParticipantData() {
    try {
      console.log('Fetching participant data for SRN:', qrCode);
      const { data, error } = await supabase
        .from('participant')
        .select('srn, entry, dinner, snacks, breakfast')
        .eq('srn', qrCode)
        .single();

      console.log('Fetch result:', { data, error });

      if (error) {
        if (error.code === 'PGRST116') {
          toast.error('Participant not found');
          onReset();
          return;
        }
        throw error;
      }

      if (!data) {
        toast.error('Participant not found');
        onReset();
        return;
      }
      setParticipant(data);
    } catch (error: any) {
      console.error('Error fetching participant:', error);
      setError(error.message || 'Failed to fetch participant data');
      toast.error('Failed to fetch participant data');
    } finally {
      setLoading(false);
    }
  }

  async function updateAttendance(field: AttendanceField) {
    if (!participant) return;
  
    try {
      console.log('Updating attendance for SRN:', participant.srn, 'Field:', field);
  
      // Check if already marked
      if (participant[field] === 'done') {
        toast.success(`${capitalize(field)} for ${participant.srn} is already marked as done!`);
        return;
      }
  
      const { error } = await supabase
        .from('participant')
        .update({
          [field]: 'done'
        })
        .eq('srn', participant.srn);
  
      if (error) throw error;
  
      setParticipant(prev => prev ? { ...prev, [field]: 'done' } : null);
  
      // Show success message
      toast.success(`${capitalize(field)} for ${participant.srn} has been marked as done`);
  
    } catch (error: any) {
      console.error('Error updating attendance:', error);
      toast.error(error.message || 'Failed to update attendance');
    }
  }
  
  function capitalize(word: string) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex justify-center items-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
          <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={onReset}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Scanner
          </button>
        </div>
      </div>
    );
  }

  if (!participant) {
    return null;
  }

  const attendanceFields = [
    { key: 'entry' as const, label: 'Entry' },
    { key: 'dinner' as const, label: 'Dinner' },
    { key: 'snacks' as const, label: 'Snacks' },
    { key: 'breakfast' as const, label: 'Breakfast' }
  ];

  // Find the label for the currently selected field
  const selectedFieldLabel = attendanceFields.find(f => f.key === selectedField)?.label || capitalize(selectedField);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6">
        <button
          onClick={onReset}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Scanner
        </button>

        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">{participant.srn}</h2>
          <p className="text-gray-600 mt-1">{format(new Date(), 'PPP')}</p>
        </div>

        <div className="mb-6">
          <label htmlFor="field-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Field to Update
          </label>
          
          {isScanning ? (
            // Show as text when scanning is active
            <div className="w-full p-3 border border-gray-300 bg-gray-100 rounded-lg text-gray-700">
              {selectedFieldLabel}
            </div>
          ) : (
            // Show dropdown when not scanning
            <select
              id="field-select"
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value as AttendanceField)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isScanning} // Optional: also disable dropdown when scanning
            >
              {attendanceFields.map(({ key, label }) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          onClick={() => updateAttendance(selectedField)}
          className="w-full py-4 px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-lg font-semibold"
        >
          Mark {selectedField} as Done
        </button>

        <div className="mt-8 space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Current Status</h3>
          {attendanceFields.map(({ key, label }) => (
            <div
              key={key}
              className={`flex items-center justify-between p-4 rounded-xl ${
                participant[key] === 'done'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <span className="font-medium">{label}</span>
              {participant[key] === 'done' ? (
                <Check className="w-6 h-6 text-green-600" />
              ) : (
                <X className="w-6 h-6 text-gray-400" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}