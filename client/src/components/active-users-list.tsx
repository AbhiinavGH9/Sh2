import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Mic, MicOff, Volume2 } from "lucide-react";
import { ws } from "@shared/routes";
import { z } from "zod";

interface ActiveUsersListProps {
  users: z.infer<typeof ws.receive.frequencyState>["users"];
}

export function ActiveUsersList({ users }: ActiveUsersListProps) {
  if (users.length === 0) return null;

  return (
    <div className="w-full max-w-md mx-auto mt-8">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          <Users className="w-3 h-3 text-primary" /> Active Nodes
        </h3>
        <span className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
          {users.length} ONLINE
        </span>
      </div>

      <div className="space-y-2">
        {users.map((u) => (
          <motion.div 
            key={u.id}
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-500 ${
              u.isSpeaking 
                ? "bg-primary/5 border-primary/30 shadow-[0_0_15px_rgba(57,255,20,0.05)]" 
                : "bg-card/30 border-white/5 hover:border-white/10"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10 border border-white/10 ring-2 ring-transparent transition-all group-hover:ring-primary/20">
                  <AvatarImage src={u.avatar} />
                  <AvatarFallback className="bg-secondary/50 font-mono text-xs">{u.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {u.isSpeaking && (
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-primary border-2 border-background"></span>
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-foreground tracking-tight">{u.name}</span>
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest opacity-50">
                  {u.isSpeaking ? "Transmitting" : "Monitoring"}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {u.isSpeaking ? (
                <div className="flex items-end gap-0.5 h-3 px-2">
                  {[1, 2, 3, 4].map((bar) => (
                    <motion.div
                      key={bar}
                      className="w-0.5 bg-primary rounded-full"
                      animate={{ height: ["2px", "12px", "2px"] }}
                      transition={{ duration: 0.4, repeat: Infinity, delay: bar * 0.1 }}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-2 rounded-full bg-secondary/30 text-muted-foreground/50">
                  <MicOff className="w-3 h-3" />
                </div>
              )}
              
              {u.isSpeaking && (
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <Volume2 className="w-3 h-3 animate-pulse" />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
