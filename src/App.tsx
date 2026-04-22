/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import Landing from "./components/Landing";
import InputForm from "./components/InputForm";
import FortuneResultView from "./components/FortuneResultView";
import { getFortune, FortuneResult } from "./services/geminiService";

export type AppState = "LANDING" | "INPUT" | "LOADING" | "RESULT";

export default function App() {
  const [state, setState] = useState<AppState>("LANDING");
  const [userData, setUserData] = useState<any>(null);
  const [fortune, setFortune] = useState<FortuneResult | null>(null);

  const handleStart = () => setState("INPUT");

  const handleSubmit = async (data: any) => {
    setUserData(data);
    setState("LOADING");
    try {
      const result = await getFortune(data);
      setFortune(result);
      setState("RESULT");
    } catch (error) {
      console.error(error);
      alert("할멈이 잠시 부재중이신 것 같구나. 잠시 후 다시 시도해보게.");
      setState("INPUT");
    }
  };

  const handleReset = () => {
    setFortune(null);
    setUserData(null);
    setState("LANDING");
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 mythic-gradient -z-10" />
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')] opacity-10 pointer-events-none -z-10" />

      <AnimatePresence mode="wait">
        {state === "LANDING" && (
          <motion.div
            key="landing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.6 }}
            className="w-full h-full"
          >
            <Landing onStart={handleStart} />
          </motion.div>
        )}

        {state === "INPUT" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl px-4"
          >
            <InputForm onSubmit={handleSubmit} />
          </motion.div>
        )}

        {state === "LOADING" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8"
          >
            <div className="relative w-48 h-48">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                className="absolute inset-0 border-4 border-dashed border-mythic-gold/30 rounded-full"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                className="absolute inset-4 border-2 border-mythic-red/20 rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-serif text-2xl text-mythic-gold animate-pulse">
                  신을 부르는 중...
                </span>
              </div>
            </div>
            <p className="text-white/60 font-serif italic text-lg text-center max-w-xs">
              "할멈이 방울을 흔들며 그대의 명줄을 살펴보고 있네... 조용히 기다리게."
            </p>
          </motion.div>
        )}

        {state === "RESULT" && fortune && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full py-12"
          >
            <FortuneResultView 
              fortune={fortune} 
              onReset={handleReset}
              userData={userData}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative Ornaments */}
      <div className="fixed top-0 left-0 p-8 pointer-events-none opacity-20 hidden md:block">
        <div className="writing-mode-vertical-rl text-xs tracking-widest text-mythic-gold uppercase font-serif">
          용신할멈 · 신점사주
        </div>
      </div>
      <div className="fixed bottom-0 right-0 p-8 pointer-events-none opacity-20 hidden md:block">
        <div className="writing-mode-vertical-rl text-xs tracking-widest text-mythic-gold uppercase font-serif transform rotate-180">
          삼신할미의 지혜
        </div>
      </div>
    </div>
  );
}

