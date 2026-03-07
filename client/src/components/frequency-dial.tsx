import { motion } from "framer-motion";
import { Mic, MicOff, Radio, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FrequencyDialProps {
  frequency: string;
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
      <motion.div 
        key={frequency}
        initial={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        className={`text-6xl md:text-8xl font-display font-black tracking-tighter mb-8 transition-colors duration-300 ${
          isConnected 
            ? isMuted ? "text-accent text-shadow-neon-orange" : "text-primary text-shadow-neon-green" 
            : "text-muted-foreground opacity-50"
        }`}
      >
        {frequency}
        <span className="text-2xl md:text-4xl ml-2 font-mono opacity-50">MHz</span>
      </motion.div>

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
              variant="destructive"
              className="rounded-full px-8 font-bold text-lg shadow-[0_0_15px_rgba(255,0,0,0.3)]"
              onClick={onDisconnect}
            >
              DISCONNECT
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
