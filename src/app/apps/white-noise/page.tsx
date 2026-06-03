"use client";
import { useEffect } from "react";

import { useAudioManager } from "./hooks/useAudioManager";
import { useSleepTimer } from "./hooks/useSleepTimer";
import { SettingsDrawer } from "./components/SettingsDrawer";
import { Play, Pause, Music } from "lucide-react";

const MAIN_SOUNDS = [
  { id: 'lullaby1', name: 'Hát ru 1', url: '/assets/sounds/main/baby-sleep.mp3' },
  { id: 'lullaby2', name: 'Hát ru 2', url: '/assets/sounds/main/baby-sleep2.mp3' },
];

export default function WhiteNoiseRevamp() {
  const audioManager = useAudioManager();
  
  // Truyền hàm tắt nhạc vào Timer
  const timer = useSleepTimer(() => {
    if (audioManager.isPlaying) {
      audioManager.togglePlay();
    }
  });

  // Mặc định hẹn giờ tắt 15 phút khi vừa mở app
  useEffect(() => {
    timer.startTimer(15);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[85vh] flex flex-col relative bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 rounded-[3rem] p-6 shadow-inner overflow-hidden">
      
      {/* Decorative blobs (Cartoonish effect) */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      {/* Header & Settings */}
      <div className="relative z-10 flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-purple-900 tracking-tight">Ru Bé Ngủ 🌙</h1>
          <p className="text-purple-600/80 font-medium">Giấc mơ ngọt ngào</p>
        </div>
        
        <SettingsDrawer 
          bgVolume={audioManager.bgVolume}
          setBgVolume={audioManager.setBgVolume}
          startTimer={timer.startTimer}
          cancelTimer={timer.cancelTimer}
          timeLeft={timer.timeLeft}
          formattedTime={timer.formattedTime}
          activeBgTrack={audioManager.activeBgTrack}
          changeBgTrack={audioManager.changeBgTrack}
          isBgLoading={audioManager.isBgLoading}
        />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col justify-center space-y-10">
        
        {/* Main Sound Selector (Nhạc chính) */}
        <div className="space-y-4 text-center">
          <h2 className="text-sm font-bold uppercase tracking-wider text-purple-500 mb-6">Chọn giai điệu chính</h2>
          <div className="flex flex-col gap-4 px-8">
            {MAIN_SOUNDS.map(sound => {
              const isActive = audioManager.activeMainTrack === sound.url;
              return (
                <button
                  key={sound.id}
                  onClick={() => audioManager.setActiveMainTrack(sound.url)}
                  className={`flex items-center justify-center gap-3 px-6 py-4 rounded-3xl font-bold transition-all duration-300 ${
                    isActive 
                      ? 'bg-purple-500 text-white shadow-xl shadow-purple-500/40 scale-105 ring-4 ring-purple-300/50' 
                      : 'bg-white/60 text-purple-700 hover:bg-white border-2 border-transparent hover:border-purple-200 shadow-sm'
                  }`}
                >
                  <Music className={`w-6 h-6 ${isActive ? 'animate-bounce' : ''}`} />
                  {sound.name}
                </button>
              )
            })}
          </div>
        </div>

      </div>

      {/* Huge Play Button */}
      <div className="relative z-10 flex justify-center mt-auto pt-12 pb-6">
        <button
          onClick={audioManager.togglePlay}
          className={`group relative flex items-center justify-center w-32 h-32 rounded-full shadow-2xl transition-all duration-500 ${
            audioManager.isPlaying 
              ? 'bg-gradient-to-tr from-pink-400 to-rose-400 hover:shadow-pink-500/50 hover:scale-95' 
              : 'bg-gradient-to-tr from-purple-500 to-indigo-500 hover:shadow-purple-500/50 hover:scale-105'
          }`}
        >
          {/* Ripple effect when playing */}
          {audioManager.isPlaying && (
            <div className="absolute inset-0 rounded-full border-4 border-pink-300 animate-ping opacity-20"></div>
          )}

          {audioManager.isPlaying ? (
            <Pause className="w-14 h-14 text-white fill-white" />
          ) : (
            <Play className="w-14 h-14 text-white fill-white ml-2" />
          )}
        </button>
      </div>
      
    </div>
  );
}
