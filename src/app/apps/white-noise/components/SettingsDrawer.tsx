import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Settings2, Clock, Volume2, CloudRain, Flame, Waves, CloudLightning } from "lucide-react"

export const BACKGROUND_SOUNDS = [
  { id: 'rain', name: 'Mưa rào', url: '/assets/sounds/background/rain.mp3', icon: CloudRain, color: 'bg-blue-100 text-blue-600' },
  { id: 'storm', name: 'Giông bão', url: '/assets/sounds/background/storm.mp3', icon: CloudLightning, color: 'bg-indigo-100 text-indigo-600' },
  { id: 'stream', name: 'Suối reo', url: '/assets/sounds/background/stream1.mp3', icon: Waves, color: 'bg-cyan-100 text-cyan-600' },
  { id: 'fire', name: 'Lửa trại', url: '/assets/sounds/background/camp-fire.mp3', icon: Flame, color: 'bg-orange-100 text-orange-600' },
];

interface SettingsDrawerProps {
  bgVolume: number;
  setBgVolume: (val: number) => void;
  startTimer: (minutes: number) => void;
  cancelTimer: () => void;
  timeLeft: number | null;
  formattedTime: string | null;
  activeBgTrack: string | null;
  changeBgTrack: (url: string) => void;
  isBgLoading: boolean;
}

export function SettingsDrawer({ 
  bgVolume, setBgVolume, startTimer, cancelTimer, timeLeft, formattedTime,
  activeBgTrack, changeBgTrack, isBgLoading
}: SettingsDrawerProps) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full w-12 h-12 bg-white/80 backdrop-blur-md shadow-sm border-purple-100 text-purple-600 hover:bg-purple-50 hover:text-purple-700 transition-all hover:scale-105"
        >
          <Settings2 className="w-6 h-6" />
        </Button>
      </DrawerTrigger>
      
      <DrawerContent className="bg-gradient-to-b from-white to-purple-50/50 border-t-purple-100 rounded-t-3xl">
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader className="text-center">
            <DrawerTitle className="text-2xl font-bold text-purple-900">Bảng Điều Khiển</DrawerTitle>
            <DrawerDescription className="text-purple-600/80">
              Tùy chỉnh không gian ngủ của bé
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            
            {/* Background Sound Selector */}
            <div className="space-y-3 bg-white p-5 rounded-2xl shadow-sm border border-purple-50">
              <h3 className="flex items-center gap-2 text-purple-900 font-semibold mb-2">
                <CloudRain className="w-5 h-5 text-purple-500" /> Âm thanh tự nhiên
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {BACKGROUND_SOUNDS.map(sound => {
                  const isActive = activeBgTrack === sound.url;
                  const Icon = sound.icon;
                  return (
                    <button
                      key={sound.id}
                      onClick={() => changeBgTrack(sound.url)}
                      className={`relative flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 overflow-hidden ${
                        isActive 
                          ? 'bg-purple-50 border-2 border-purple-200 scale-105' 
                          : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                      }`}
                    >
                      <div className={`p-2 rounded-full mb-1 ${isActive ? 'scale-110' : ''} ${sound.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className={`text-xs font-bold ${isActive ? 'text-purple-700' : 'text-slate-600'}`}>
                        {sound.name}
                      </span>
                      
                      {isActive && isBgLoading && (
                         <div className="absolute top-1 right-1 flex space-x-0.5">
                           <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></div>
                           <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-75"></div>
                         </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Volume Control */}
            <div className="space-y-4 bg-white p-5 rounded-2xl shadow-sm border border-purple-50">
              <div className="flex items-center justify-between text-purple-900 font-semibold">
                <span className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-purple-500" />
                  Âm lượng nhạc nền
                </span>
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-lg text-sm">{bgVolume}%</span>
              </div>
              <Slider 
                value={[bgVolume]} 
                onValueChange={(val) => setBgVolume(val[0])} 
                max={100} 
                step={1} 
                className="w-full cursor-pointer"
              />
              <p className="text-xs text-purple-400 text-center">
                *Nhạc chính (lullaby) sử dụng phím cứng âm lượng của điện thoại.
              </p>
            </div>

            {/* Timer Control */}
            <div className="space-y-4 bg-white p-5 rounded-2xl shadow-sm border border-purple-50">
              <div className="flex items-center justify-between text-purple-900 font-semibold">
                <span className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-500" />
                  Hẹn giờ tắt
                </span>
                {formattedTime && (
                  <span className="bg-pink-100 text-pink-600 px-2 py-1 rounded-lg text-sm animate-pulse">
                    {formattedTime}
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {[15, 30, 60].map(mins => (
                  <Button 
                    key={mins}
                    variant="outline"
                    onClick={() => startTimer(mins)}
                    className="rounded-xl border-purple-100 hover:bg-purple-50 hover:text-purple-700 text-purple-600"
                  >
                    {mins}m
                  </Button>
                ))}
                <Button 
                  variant="ghost" 
                  onClick={cancelTimer}
                  disabled={!timeLeft}
                  className="rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  Tắt
                </Button>
              </div>
            </div>

          </div>

          <DrawerFooter className="pt-2 pb-6">
            <DrawerClose asChild>
              <Button className="w-full rounded-2xl bg-purple-600 hover:bg-purple-700 h-12 text-lg shadow-md hover:shadow-lg transition-all">
                Đóng
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
