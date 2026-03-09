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
  onFrequencyChange,
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
        <div className="flex items-center gap-1">
          {/* Integer Part */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => {
                const parts = frequency.split('.');
                let val = parseInt(parts[0] || '0', 10) + 1;
                onFrequencyChange(`${val}.${parts[1] || '00'}`);
              }}
              disabled={isConnected}
              className="p-1 text-muted-foreground hover:text-primary disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors outline-none"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
            </button>
            <input
              type="text"
              value={frequency.split('.')[0]}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, ''); // numbers only
                onFrequencyChange(`${val || '0'}.${frequency.split('.')[1] || '00'}`);
              }}
              disabled={isConnected}
              className={`w-20 sm:w-28 md:w-36 text-center text-4xl sm:text-5xl md:text-7xl font-display font-black tracking-tighter bg-transparent border-none outline-none focus:ring-0 p-0 ${isConnected ? 'text-foreground/80' : 'text-foreground'}`}
            />
            <button
              onClick={() => {
                const parts = frequency.split('.');
                let val = parseInt(parts[0] || '0', 10) - 1;
                if (val < 1) val = 1; // don't go below 1
                onFrequencyChange(`${val}.${parts[1] || '00'}`);
              }}
              disabled={isConnected}
              className="p-1 text-muted-foreground hover:text-primary disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors outline-none"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            </button>
          </div>

          <span className="text-3xl sm:text-4xl md:text-6xl font-display font-black self-center mb-6 text-primary">.</span>

          {/* Fractional Part */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => {
                const parts = frequency.split('.');
                let val = parseInt(parts[1] || '0', 10) + 5;
                if (val > 95) val = 0;
                onFrequencyChange(`${parts[0]}.${val.toString().padStart(2, '0')}`);
              }}
              disabled={isConnected}
              className="p-1 text-muted-foreground hover:text-primary disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors outline-none"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
            </button>
            <input
              type="text"
              value={frequency.split('.')[1] || '00'}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                onFrequencyChange(`${frequency.split('.')[0] || '0'}.${val}`);
              }}
              disabled={isConnected}
              className={`w-16 sm:w-20 md:w-28 text-center text-4xl sm:text-5xl md:text-7xl font-display font-black tracking-tighter bg-transparent border-none outline-none focus:ring-0 p-0 ${isConnected ? 'text-foreground/80' : 'text-foreground'}`}
            />
            <button
              onClick={() => {
                const parts = frequency.split('.');
                let val = parseInt(parts[1] || '0', 10) - 5;
                if (val < 0) val = 95;
                onFrequencyChange(`${parts[0]}.${val.toString().padStart(2, '0')}`);
              }}
              disabled={isConnected}
              className="p-1 text-muted-foreground hover:text-primary disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors outline-none"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            </button>
          </div>
        </div>
        <span className="text-xl md:text-2xl font-mono opacity-50 self-center mb-6 ml-2">MHz</span>
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
              className={`rounded-full px-8 font-bold text-lg transition-all ${!isMuted
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
