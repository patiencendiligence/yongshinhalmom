import { motion, AnimatePresence } from "motion/react";
import { UserProfile, storageService } from "../services/storageService";
import { Trash2, User, Calendar, MapPin, X } from "lucide-react";
import { Language, translations } from "../lib/translations";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (profile: UserProfile) => void;
  profiles: UserProfile[];
  onDelete: (id: string) => void;
  lang: Language;
}

export default function ProfileModal({ isOpen, onClose, onSelect, profiles, onDelete, lang }: ProfileModalProps) {
  const t = translations[lang];
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg bg-[#111] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl"
        >
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <div>
              <h2 className="text-2xl font-serif font-black italic text-white">{t.storedProfiles}</h2>
              <p className="text-xs text-white/30 tracking-widest uppercase mt-1">{t.storedKnowledge}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all">
              <X className="w-6 h-6 text-white/40" />
            </button>
          </div>

          <div className="max-h-[400px] overflow-y-auto p-6 space-y-4 no-scrollbar">
            {profiles.length === 0 ? (
              <div className="py-20 text-center text-white/20 italic font-serif">
                {t.noProfiles}
              </div>
            ) : (
              profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="group relative flex items-center justify-between p-6 bg-white/[0.03] border border-white/5 rounded-3xl hover:bg-white/[0.06] hover:border-mythic-gold/30 transition-all cursor-pointer"
                  onClick={() => onSelect(profile)}
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-mythic-gold/10 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-mythic-gold" />
                    </div>
                    <div>
                      <div className="text-xl font-serif font-black text-white group-hover:text-mythic-gold transition-colors">
                        {profile.name}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-white/40">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {profile.birthDate} ({profile.isLunar ? t.lunar : t.solar})</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {profile.birthPlace}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(profile.id);
                    }}
                    className="p-3 text-white/20 hover:text-mythic-red hover:bg-mythic-red/10 rounded-2xl transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-6 bg-black/40 text-center">
            <p className="text-[10px] text-white/20 uppercase tracking-[0.2em]">
              {t.browserStorageNote}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
