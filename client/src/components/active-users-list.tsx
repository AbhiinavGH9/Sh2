import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";
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
        <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Users className="w-4 h-4" /> Connected Agents
        </h3>
        <span className="text-xs font-mono bg-primary/20 text-primary px-2 py-0.5 rounded-md border border-primary/30">
          {users.length} ONLINE
        </span>
      </div>

      <div className="space-y-3">
        {users.map((u) => (
          <motion.div 
            key={u.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
              u.isSpeaking 
                ? "bg-primary/10 border-primary/50 shadow-[inset_0_0_20px_rgba(57,255,20,0.1)]" 
                : "bg-card border-border"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10 border border-white/10">
                  <AvatarImage src={u.avatar} />
                  <AvatarFallback className="bg-secondary font-mono">{u.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {u.isSpeaking && (
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-primary border-2 border-background"></span>
                  </span>
                )}
              </div>
              <span className="font-medium text-foreground">{u.name}</span>
            </div>
            
            {u.isSpeaking ? (
              <div className="flex items-end gap-1 h-4">
                {[1, 2, 3].map((bar) => (
                  <motion.div
                    key={bar}
                    className="w-1 bg-primary rounded-t-sm"
                    animate={{ height: ["4px", "16px", "4px"] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: bar * 0.1 }}
                  />
                ))}
              </div>
            ) : (
              <span className="text-xs font-mono text-muted-foreground">IDLE</span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
