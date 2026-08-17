import React, { useState } from 'react';
import { X, HelpCircle, BookOpen, MessageSquare, Send, CheckCircle2 } from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [ticketSent, setTicketSent] = useState(false);
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSendTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message) return;
    setTicketSent(true);
    setTimeout(() => {
      setTicketSent(false);
      setMessage('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-lg p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150 space-y-6">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">DocuFlow Support & Docs</h2>
            <p className="text-xs text-stone-500">Need help converting or editing files? We're here for you.</p>
          </div>
        </div>

        {/* Quick FAQ Articles */}
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
            <p className="font-semibold text-stone-900">Are my files kept private?</p>
            <p className="text-stone-500 text-[11px] leading-relaxed">
              Yes, all files are encrypted during processing in browser memory and deleted automatically after download.
            </p>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
            <p className="font-semibold text-stone-900">What is the maximum file size?</p>
            <p className="text-stone-500 text-[11px] leading-relaxed">
              Standard files support up to 50MB. Pro users can process batch archives up to 200MB.
            </p>
          </div>
        </div>

        {/* Contact Message */}
        <form onSubmit={handleSendTicket} className="space-y-3">
          <label className="block text-xs font-semibold text-stone-800">Send a quick message to our engineers</label>
          <textarea
            required
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe any question, feedback, or file format support request..."
            className="w-full p-3 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900"
          />

          <button
            type="submit"
            disabled={ticketSent}
            className="w-full py-2 px-4 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center justify-center gap-2"
          >
            {ticketSent ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Message Received! We'll reply shortly.</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send Message</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
