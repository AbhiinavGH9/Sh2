import { useCommunication } from "@/contexts/communication-context";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Minimize2 } from "lucide-react";
import { useState, useEffect } from "react";

export function FloatingPill() {
    const { isConnected, frequency, activeUsers } = useCommunication();
    const [location, setLocation] = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        if (window.innerWidth < 768) {
            setIsCollapsed(true);
        }
    }, [isConnected]);

    // Show pill ONLY if we are connected AND we are not on the main dashboard (`/`)
    const isVisible = isConnected && location !== "/";

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className={`fixed top-6 z-50 flex items-center bg-background/80 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-300 ${isCollapsed
                        ? "right-4 sm:right-6 rounded-full p-3 hover:bg-background/90 cursor-pointer w-auto justify-center"
                        : "left-1/2 -translate-x-1/2 w-[92vw] sm:w-max max-w-md rounded-full px-3 sm:px-5 py-2.5 justify-between sm:justify-center overflow-hidden"
                        }`}
                >
                    {isCollapsed ? (
                        <div
                            className="relative flex items-center justify-center animate-pulse"
                            onClick={() => setIsCollapsed(false)}
                        >
                            <Radio className="w-5 h-5 text-primary relative z-10" />
                            <div className="absolute w-full h-full bg-primary/40 blur-md rounded-full -z-0"></div>
                            {/* Speaking indicator dot when collapsed */}
                            {activeUsers.some(u => u.isSpeaking) && (
                                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full ring-2 ring-background animate-bounce" />
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
                                {/* Frequency Signal */}
                                <div
                                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                                    onClick={() => setLocation("/")}
                                >
                                    <div className="relative flex items-center justify-center">
                                        <Radio className="w-4 h-4 text-primary relative z-10" />
                                        <div className="absolute w-full h-full bg-primary/20 blur-md rounded-full -z-0"></div>
                                    </div>
                                    <span className="font-display font-black text-primary tracking-tight">
                                        {frequency}
                                        <span className="text-[10px] sm:text-xs font-mono opacity-50 ml-1 uppercase">MHz</span>
                                    </span>
                                </div>

                                {/* Active User Avatars */}
                                {activeUsers.length > 0 && (
                                    <div
                                        className="flex items-center -space-x-2 border-l border-white/10 pl-2 sm:pl-4 ml-1 cursor-pointer hover:opacity-80 transition-opacity min-w-0"
                                        onClick={() => setLocation("/")}
                                    >
                                        {activeUsers.slice(0, 3).map((user) => (
                                            <div
                                                key={user.id}
                                                className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-background shadow-sm overflow-hidden transition-all duration-300 shrink-0 ${user.isSpeaking ? "ring-2 ring-primary scale-110 shadow-[0_0_10px_rgba(57,255,20,0.5)] z-10" : "opacity-80 scale-100 grayscale-[0.3]"
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
                                            <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-background bg-secondary flex items-center justify-center text-[10px] font-bold z-0 shrink-0">
                                                +{activeUsers.length - 3}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Collapse Toggle for Mobile */}
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsCollapsed(true);
                                }}
                                className="ml-1 sm:ml-2 p-1.5 sm:p-2 rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors md:hidden shrink-0 z-10"
                            >
                                <Minimize2 className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
