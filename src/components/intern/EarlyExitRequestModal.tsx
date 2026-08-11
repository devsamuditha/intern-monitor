import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface EarlyExitRequestModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  isLoading?: boolean;
}

export const EarlyExitRequestModal: React.FC<EarlyExitRequestModalProps> = ({
  show,
  onClose,
  onSubmit,
  isLoading
}) => {
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onSubmit(reason.trim());
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white/10 border border-white/20 rounded-2xl p-6 w-full max-w-md shadow-xl"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
          >
            <h3 className="text-xl font-bold text-white mb-2">Request Early Exit</h3>
            <p className="text-emerald-100/80 mb-4 text-sm">
              You must receive permission from your Tech Lead to end your day before 5:00 PM.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-emerald-100 mb-1">
                  Reason for leaving early <span className="text-red-400">*</span>
                </label>
                <textarea
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
                  placeholder="E.g., Medical appointment, personal emergency..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" className="px-4 py-2 text-sm font-semibold text-white/70 hover:text-white transition" onClick={onClose} disabled={isLoading}>
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition disabled:opacity-50" disabled={!reason.trim() || isLoading}>
                  {isLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
