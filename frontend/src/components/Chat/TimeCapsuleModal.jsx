import React, { useState } from 'react'

export const TimeCapsuleModal = ({ isOpen, onClose, onSchedule, partnerName}) => {

    const [data, setDate ] = useState('');
    const [time, setTime] = useState('');

    if(!isOpen) return null;
    
    const handleConfirm = () =>{
        if(!date || !time) return;
        const unlockDate = new Date(`${date}T{time}`);
        onSchedule(unlockDate);
        onClose();
    }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-indigo-500/30 p-6 rounded-2xl shadow-2xl w-full max-w-sm relative overflow-hidden">
        {/* Subtle glowing background effect */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-600/20 blur-3xl rounded-full pointer-events-none"></div>

        <h3 className="text-lg font-bold text-slate-100 mb-1 flex items-center gap-2">
          <span className="text-xl">⏳</span> Time Capsule
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Lock a message for {partnerName}. They will see it exists, but cannot read it until the countdown ends.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Unlock Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Unlock Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-xs font-medium text-slate-400 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20 transition"
          >
            Lock Message
          </button>
        </div>
      </div>
    </div>
  );
}
