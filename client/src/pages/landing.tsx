import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Radio, ShieldAlert, Activity, Mail, Loader2 } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { motion } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export function LandingPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleEmailSignIn = async () => {
    if (!email || !password) return toast({ title: "Error", description: "Email and password are required", variant: "destructive" });
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);
    if (error) toast({ title: "Sign In Failed", description: error.message, variant: "destructive" });
    else window.location.href = "/";
  };

  const handleSignUp = async () => {
    if (!email || !password) return toast({ title: "Error", description: "Email and password are required", variant: "destructive" });
    setIsLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setIsLoading(false);
    if (error) toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
    else toast({ title: "Success", description: "Check your email to confirm registration!" });
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google'
    });
    setIsLoading(false);
    if (error) toast({ title: "Google Sign In Failed", description: error.message, variant: "destructive" });
  };

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
            <h1 className="font-display font-black text-3xl tracking-widest uppercase">Sh2</h1>
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
          <h1 className="font-display font-bold text-2xl tracking-widest uppercase">Sh2</h1>
        </div>

        <motion.div
          className="w-full max-w-sm glass-panel p-10 rounded-3xl text-center border-t border-white/10"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="group bg-card border border-white/5 hover:border-accent/30 p-8 rounded-3xl transition-all hover:bg-card/80 backdrop-blur-sm cursor-pointer shadow-[0_0_0_0_rgba(255,153,0,0)] hover:shadow-[0_0_30px_0_rgba(255,153,0,0.1)]">
            <Radio className="w-12 h-12 text-accent mb-6 group-hover:scale-110 group-hover:animate-pulse transition-transform" />
            <h3 className="text-2xl font-display font-bold mb-2">Establish Sh2</h3>
            <p className="text-muted-foreground">Select an autonomous operational frequency or generate a secure peer-to-peer data tunnel.</p>
          </div>
          <form className="space-y-4 mb-6" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2 text-left">
              <Label htmlFor="email" className="text-xs font-mono text-muted-foreground">EMAIL IDENTIFICATION</Label>
              <Input
                id="email"
                type="email"
                placeholder="agent@sh2.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background/50 border-white/10"
              />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="password" className="text-xs font-mono text-muted-foreground">SECURITY PASSPHRASE</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background/50 border-white/10"
              />
            </div>

            <div className="flex gap-4 pt-2">
              <Button
                onClick={handleSignUp}
                disabled={isLoading}
                variant="outline"
                className="w-full font-bold border-primary hover:bg-primary/20 text-primary transition-all duration-300"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "REGISTER"}
              </Button>
              <Button
                onClick={handleEmailSignIn}
                disabled={isLoading}
                className="w-full font-bold bg-foreground text-background hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-lg hover:shadow-neon-green"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "SIGN IN"}
              </Button>
            </div>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground font-mono">Or authorize via</span>
            </div>
          </div>

          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            variant="outline"
            className="w-full text-foreground border-white/10 bg-background hover:bg-white/5 transition-all duration-300"
          >
            <FaGoogle className="w-4 h-4 mr-2" />
            SIGN IN WITH GOOGLE
          </Button>

          <p className="mt-8 text-xs text-muted-foreground font-mono opacity-50">
            SECURED BY SUPABASE
          </p>
        </motion.div>
      </div>
    </div>
  );
}
