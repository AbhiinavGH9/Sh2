import { motion } from "framer-motion";
import { Mic, MicOff, Radio, RefreshCw, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FrequencyDialProps {
  frequency: string;
  onFrequencyChange: (freq: string) => void;
  isConnected: boolean;
  isMuted: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onToggleMute: () => void;
  onScan: () => void;
}

export function FrequencyDial({ 
  frequency, 
  isConnected, 
  isMuted, 
  onConnect, 
  onDisconnect, 
  onToggleMute,
  onScan 
}: FrequencyDialProps) {
  
  return (
    <div className="relative p-8 rounded-3xl glass-panel flex flex-col items-center justify-center overflow-hidden">
      {/* Background glow when connected */}
      <motion.div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        animate={{ 
          background: isConnected && !isMuted 
            ? "radial-gradient(circle at center, hsl(111 100% 54% / 0.5) 0%, transparent 70%)" 
            : "radial-gradient(circle at center, transparent 0%, transparent 100%)"
        }}
        transition={{ duration: 0.5 }}
      />

      <div className="mb-2 text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
        <Radio className="w-3 h-3" /> TUNED FREQUENCY
      </div>

      {/* Main Digital Display */}
      <div className="flex items-center justify-center gap-2 mb-8 group">
        <div className="flex items-center">
          <Input
            type="number"
            value={frequency.split('.')[0]}
            onChange={(e) => {
              const parts = frequency.split('.');
              onFrequencyChange(`${e.target.value}.${parts[1] || '00'}`);
            }}
            className="w-24 md:w-32 text-4xl md:text-6xl font-display font-black bg-transparent border-none text-right focus-visible:ring-0 p-0 h-auto"
            disabled={isConnected}
          />
          <span className="text-4xl md:text-6xl font-display font-black">.</span>
          <Input
            type="number"
            value={frequency.split('.')[1]}
            onChange={(e) => {
              const parts = frequency.split('.');
              onFrequencyChange(`${parts[0] || '00'}.${e.target.value.slice(0, 2)}`);
            }}
            className="w-16 md:w-24 text-4xl md:text-6xl font-display font-black bg-transparent border-none text-left focus-visible:ring-0 p-0 h-auto"
            disabled={isConnected}
          />
        </div>
        <span className="text-xl md:text-2xl font-mono opacity-50 mt-4">MHz</span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 z-10">
        {!isConnected ? (
          <>
            <Button 
              size="lg"
              className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold text-lg px-8 rounded-full shadow-neon-green"
              onClick={onConnect}
            >
              CONNECT
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="rounded-full w-12 h-12 border-primary/30 text-primary hover:bg-primary/10"
              onClick={onScan}
              title="Scan Random Frequency"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
          </>
        ) : (
          <>
            <Button 
              size="lg"
              variant={isMuted ? "outline" : "default"}
              className={`rounded-full px-8 font-bold text-lg transition-all ${
                !isMuted 
                  ? "bg-primary hover:bg-primary/80 text-primary-foreground shadow-neon-green" 
                  : "border-accent text-accent hover:bg-accent/10 shadow-neon-orange"
              }`}
              onClick={onToggleMute}
            >
              {isMuted ? <MicOff className="w-5 h-5 mr-2" /> : <Mic className="w-5 h-5 mr-2" />}
              {isMuted ? "MUTED" : "LIVE"}
            </Button>
            
            <Button 
              size="lg"
              variant="outline"
              className="rounded-full px-8 font-bold text-lg border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive shadow-[0_0_15px_rgba(255,0,0,0.1)] transition-all hover:scale-105 active:scale-95"
              onClick={onDisconnect}
            >
              <Power className="w-5 h-5 mr-2" />
              OFF
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
