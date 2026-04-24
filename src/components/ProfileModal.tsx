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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 1.05, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.05, y: 10 }}
          className="w-full max-w-lg bg-black border border-white/20 rounded-none overflow-hidden shadow-[0_0_100px_rgba(255,255,255,0.05)] dragon-pattern relative"
        >
          <div className="p-10 border-b border-white/10 flex justify-between items-center bg-white/[0.02] relative z-10">
            <div>
              <h2 className="text-3xl font-serif font-black italic text-white tracking-tight">{t.storedProfiles}</h2>
              <p className="text-[10px] text-white/30 tracking-[0.6em] uppercase mt-2 font-black">{t.storedKnowledge}</p>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-white/10 transition-all border border-white/10">
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          <div className="max-h-[50vh] overflow-y-auto p-8 space-y-6 no-scrollbar relative z-10">
            {profiles.length === 0 ? (
              <div className="py-24 text-center text-white/10 italic font-serif text-2xl">
                {t.noProfiles}
              </div>
            ) : (
              profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="group relative flex items-center justify-between p-8 bg-white/[0.02] border border-white/10 rounded-none hover:bg-white/[0.05] hover:border-white/30 transition-all cursor-pointer"
                  onClick={() => onSelect(profile)}
                >
                  <div className="flex items-center gap-8">
                    <div className="w-14 h-14 bg-white/5 border border-white/10 flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
                      <User className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="text-2xl font-serif font-black italic text-white group-hover:text-white transition-colors">
                        {profile.name}
                      </div>
                      <div className="flex flex-col gap-1 mt-2 text-[10px] text-white/30 font-black uppercase tracking-widest">
                        <span className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> {profile.birthDate} ({profile.isLunar ? t.lunar : t.solar})</span>
                        <span className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {profile.birthPlace}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(profile.id);
                    }}
                    className="p-4 text-white/10 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-8 bg-white/[0.01] border-t border-white/10 text-center relative z-10">
            <p className="text-[10px] text-white/10 uppercase tracking-[0.4em] font-black">
              {t.browserStorageNote}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
