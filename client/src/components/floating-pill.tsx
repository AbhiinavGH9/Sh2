import { useCommunication } from "@/contexts/communication-context";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Radio } from "lucide-react";

export function FloatingPill() {
    const { isConnected, frequency, activeUsers } = useCommunication();
    const [location, setLocation] = useLocation();

    // Show pill ONLY if we are connected AND we are not on the main dashboard (`/`)
    // If you want it visible on the dashboard too (maybe when scrolling down), remove the `location !== "/"` check.
    const isVisible = isConnected && location !== "/";

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-background/80 backdrop-blur-xl border border-white/10 rounded-full px-5 py-2.5 shadow-2xl cursor-pointer hover:bg-background transition-colors"
                    onClick={() => setLocation("/")}
                >
                    {/* Frequency Signal */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex items-center justify-center">
                            <Radio className="w-4 h-4 text-primary relative z-10" />
                            <div className="absolute w-full h-full bg-primary/20 blur-md rounded-full -z-0"></div>
                        </div>
                        <span className="font-display font-black text-primary tracking-tight">
                            {frequency}
                            <span className="text-[10px] font-mono opacity-50 ml-1 uppercase">MHz</span>
                        </span>
                    </div>

                    {/* Active User Avatars */}
                    {activeUsers.length > 0 && (
                        <div className="flex items-center -space-x-2 border-l border-white/10 pl-4 ml-1">
                            {activeUsers.slice(0, 3).map((user) => (
                                <div
                                    key={user.id}
                                    className={`relative w-8 h-8 rounded-full border border-background shadow-sm overflow-hidden transition-all duration-300 ${user.isSpeaking ? "ring-2 ring-primary scale-110 shadow-[0_0_10px_rgba(57,255,20,0.5)] z-10" : "opacity-80 scale-100 grayscale-[0.3]"
                                        }`}
                                >
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-secondary flex items-center justify-center text-[10px] font-bold">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {activeUsers.length > 3 && (
                                <div className="relative w-8 h-8 rounded-full border border-background bg-secondary flex items-center justify-center text-[10px] font-bold z-0">
                                    +{activeUsers.length - 3}
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
