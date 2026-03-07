import { Button } from "@/components/ui/button";
import { Radio, ShieldAlert, Activity } from "lucide-react";
import { motion } from "framer-motion";

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background font-sans text-foreground">
      {/* Left visual panel */}
      <div className="md:w-1/2 relative hidden md:flex flex-col justify-between p-12 overflow-hidden border-r border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background z-0" />
        {/* landing page hero walkie talkie neon aesthetic */}
        <img 
          src="https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=1920&q=80" 
          alt="Radio Equipment" 
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
        />
        
        <div className="z-10 relative">
          <div className="flex items-center gap-3 text-primary mb-12">
            <Radio className="w-10 h-10 shadow-neon-green rounded-xl" />
            <h1 className="font-display font-black text-3xl tracking-widest">VIBECODE</h1>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-5xl font-display font-bold leading-tight mb-6">
              Instant. Secure.<br />
              <span className="text-primary text-shadow-neon-green">Comms Link.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-md">
              A modern web-based walkie-talkie experience. Tune into public frequencies, generate secure Duo links, or create custom group channels.
            </p>
          </motion.div>
        </div>

        <div className="z-10 flex gap-8 font-mono text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="w-4 h-4 text-primary" /> Low Latency
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldAlert className="w-4 h-4 text-accent" /> Encrypted
          </div>
        </div>
      </div>

      {/* Right Auth Panel */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 relative">
        {/* Mobile Logo */}
        <div className="md:hidden flex items-center gap-2 text-primary mb-12">
          <Radio className="w-8 h-8 shadow-neon-green rounded-xl" />
          <h1 className="font-display font-bold text-2xl tracking-widest">VIBECODE</h1>
        </div>

        <motion.div 
          className="w-full max-w-sm glass-panel p-10 rounded-3xl text-center border-t border-white/10"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-neon-green">
            <Radio className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-2xl font-display font-bold mb-2">Establish Uplink</h3>
          <p className="text-muted-foreground mb-8">Authenticate to access communication channels.</p>
          
          <Button 
            asChild
            size="lg" 
            className="w-full h-14 text-lg font-bold bg-foreground text-background hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-xl hover:shadow-neon-green"
          >
            <a href="/api/login">
              INITIALIZE CONNECTION
            </a>
          </Button>

          <p className="mt-6 text-xs text-muted-foreground font-mono">
            Requires secure clearance via Replit Auth.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
