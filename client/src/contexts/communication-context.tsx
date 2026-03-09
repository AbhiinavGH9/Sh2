import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSupabaseSignaling, PresenceState } from "@/hooks/use-supabase-signaling";
import { useAudioVolume } from "@/hooks/use-audio-volume";
import SimplePeer from "simple-peer";
import { useToast } from "@/hooks/use-toast";

interface CommunicationContextType {
    frequency: string;
    setFrequency: (freq: string) => void;
    isConnected: boolean;
    isMuted: boolean;
    setIsMuted: (muted: boolean) => void;
    activePeers: number; // count of connected peers
    activeUsers: PresenceState[];
    connect: () => Promise<void>;
    disconnect: () => void;
    audioError: string | null;
    scanFrequency: () => void;
}

// SDP Manipulation to strictly prioritize Opus codec
function preferOpus(sdp: string) {
    if (!sdp.includes("opus")) return sdp;
    const lines = sdp.split('\r\n');
    const mLineIndex = lines.findIndex(line => line.startsWith('m=audio'));
    if (mLineIndex === -1) return sdp;

    const opusRtpLine = lines.find(line => line.startsWith('a=rtpmap:') && line.includes('opus/48000'));
    if (!opusRtpLine) return sdp;
    const opusPayloadType = opusRtpLine.split(':')[1].split(' ')[0];

    // Rearrange m=audio line to place Opus first
    const mLineParts = lines[mLineIndex].split(' ');
    const portAndProto = mLineParts.slice(0, 3);
    let payloadTypes = mLineParts.slice(3);

    payloadTypes = payloadTypes.filter(pt => pt !== opusPayloadType);
    payloadTypes.unshift(opusPayloadType);

    lines[mLineIndex] = [...portAndProto, ...payloadTypes].join(' ');
    return lines.join('\r\n');
}

const CommunicationContext = createContext<CommunicationContextType | undefined>(undefined);

export function CommunicationProvider({ children }: { children: ReactNode }) {
    const { user: authUser } = useAuth();
    const { toast } = useToast();

    const [frequency, setFrequency] = useState(() => localStorage.getItem("sh2_frequency") || "144.20");
    const [isConnected, setIsConnected] = useState(false); // Do not default to true; await stream first
    const [isMuted, setIsMuted] = useState(true);
    const [activePeers, setActivePeers] = useState(0);

    // Sync state to localStorage for persistence
    useEffect(() => {
        localStorage.setItem("sh2_frequency", frequency);
    }, [frequency]);

    useEffect(() => {
        localStorage.setItem("sh2_connected", String(isConnected));
    }, [isConnected]);

    const fallbackUser = authUser ? {
        id: authUser.id.toString(),
        name: `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim() || 'Agent',
        avatar: authUser.profileImageUrl || undefined
    } : null;

    const peerConnections = useRef<Map<string, SimplePeer.Instance>>(new Map());
    const audioElements = useRef<Map<string, HTMLAudioElement>>(new Map());
    const localStream = useRef<MediaStream | null>(null);

    const handleIncomingSignal = useCallback((signal: any) => {
        if (!isConnected || !authUser) return;

        const { type, payload } = signal;
        if (type === 'webrtcSignal') {
            if (payload.targetUserId && payload.targetUserId !== authUser.id.toString()) {
                return;
            }

            let pc = peerConnections.current.get(payload.fromUserId);

            if (!pc) {
                const isInitiator = String(authUser.id) > String(payload.fromUserId);

                try {
                    const newPc = new SimplePeer({
                        initiator: isInitiator,
                        stream: localStream.current || undefined,
                        trickle: true,
                        sdpTransform: preferOpus,
                        config: {
                            iceServers: [
                                { urls: "stun:stun.l.google.com:19302" },
                                { urls: "stun:global.stun.twilio.com:3478" }
                            ]
                        }
                    });

                    peerConnections.current.set(payload.fromUserId, newPc);

                    newPc.on("signal", () => { }); // Signal logic attaches in createPeer normally, but simplepeer handles signals buffering
                } catch (e) {
                    console.error(e);
                }
            }

            pc = peerConnections.current.get(payload.fromUserId);
            if (pc) {
                pc.signal(payload.signalData);
            }
        }
    }, [isConnected, authUser]);

    const { connected: wsConnected, activeUsers, emitSignal, updateSpeakingState } = useSupabaseSignaling(
        frequency,
        fallbackUser,
        isConnected,
        handleIncomingSignal
    );

    const { isSpeaking, error: audioError } = useAudioVolume(isConnected && !isMuted, 20);

    const createPeer = useCallback((targetUserId: string, initiator: boolean, incomingSignal?: any) => {
        if (peerConnections.current.has(targetUserId)) return;

        try {
            const pc = new SimplePeer({
                initiator,
                stream: localStream.current || undefined,
                trickle: true,
                sdpTransform: preferOpus,
                config: {
                    iceServers: [
                        { urls: "stun:stun.l.google.com:19302" },
                        { urls: "stun:global.stun.twilio.com:3478" }
                    ]
                }
            });

            peerConnections.current.set(targetUserId, pc);

            pc.on("signal", (data) => {
                emitSignal(targetUserId, data);
            });

            pc.on("connect", () => {
                let count = 0;
                peerConnections.current.forEach(p => {
                    if (p.connected) count++;
                });
                setActivePeers(count);
            });

            pc.on("stream", (stream) => {
                let audio = audioElements.current.get(targetUserId);
                if (!audio) {
                    audio = new Audio();
                    audioElements.current.set(targetUserId, audio);
                }
                audio.srcObject = stream;
                audio.play().catch(console.error);
            });

            pc.on("close", () => {
                const audio = audioElements.current.get(targetUserId);
                if (audio) {
                    audio.pause();
                    audio.srcObject = null;
                    audioElements.current.delete(targetUserId);
                }

                peerConnections.current.delete(targetUserId);
                let count = 0;
                peerConnections.current.forEach(p => {
                    if (p.connected) count++;
                });
                setActivePeers(count);
            });

            pc.on("error", (err) => {
                console.error("SimplePeer error for user", targetUserId, err);
                const audio = audioElements.current.get(targetUserId);
                if (audio) {
                    audio.pause();
                    audio.srcObject = null;
                    audioElements.current.delete(targetUserId);
                }
                peerConnections.current.delete(targetUserId);
            });

            if (incomingSignal) {
                pc.signal(incomingSignal);
            }
        } catch (err) {
            console.error("Failed to create SimplePeer", err);
        }
    }, [emitSignal]);

    // Handle visibility change (tab sleep/wake) to prevent 5 minute drop
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isConnected) {
                // Force a re-track of presence if we wake up and should be connected
                updateSpeakingState(isSpeaking);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isConnected, isSpeaking, updateSpeakingState]);

    useEffect(() => {
        if (!isConnected || !wsConnected || !authUser) return;

        const cleanup = () => {
            peerConnections.current.forEach(pc => pc.destroy());
            peerConnections.current.clear();

            audioElements.current.forEach(audio => {
                audio.pause();
                audio.srcObject = null;
            });
            audioElements.current.clear();

            setActivePeers(0);

            // We don't necessarily want to kill the mic on tab change if they remain connected,
            // but if the socket disconnects entirely we should.
            if (!isConnected) {
                if (localStream.current) {
                    localStream.current.getTracks().forEach(track => track.stop());
                    localStream.current = null;
                }
            }
        };

        return cleanup;
    }, [isConnected, wsConnected, frequency, authUser]);

    // Read URL Params (share links)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const freqParam = params.get('freq');
        if (freqParam && !isConnected) {
            setFrequency(freqParam);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [isConnected]);

    useEffect(() => {
        if (!isConnected || !activeUsers) return;

        activeUsers.forEach((u) => {
            if (u.id !== String(authUser?.id) && !peerConnections.current.has(u.id)) {
                const isInitiator = String(authUser?.id || "") > String(u.id);
                createPeer(u.id, isInitiator);
            }
        });
    }, [activeUsers, isConnected, authUser, createPeer]);

    useEffect(() => {
        if (isConnected) {
            updateSpeakingState(isSpeaking);
        }
    }, [isSpeaking, isConnected, updateSpeakingState]);

    useEffect(() => {
        if (localStream.current) {
            localStream.current.getAudioTracks().forEach(track => {
                track.enabled = !isMuted;
            });
        }
    }, [isMuted]);

    // SPACE PTT DEBOUNCING
    const isSpaceDown = useRef(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.code === 'Space' && isConnected) {
                e.preventDefault();
                if (!isSpaceDown.current) {
                    isSpaceDown.current = true;
                    if (isMuted) setIsMuted(false);
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.code === 'Space' && isConnected) {
                e.preventDefault();
                isSpaceDown.current = false;
                if (!isMuted) setIsMuted(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isConnected, isMuted]);

    const connect = async () => {
        try {
            if (!localStream.current) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        channelCount: 1,
                        sampleRate: 48000
                    }
                });
                stream.getAudioTracks().forEach(track => {
                    track.enabled = false;
                });
                localStream.current = stream;
            }
            setIsMuted(true);
            setIsConnected(true);
            localStorage.setItem("sh2_connected", "true");
            toast({ title: "Connected", description: `Tuned to ${frequency} MHz. Microphone is muted.` });
        } catch (err) {
            toast({ title: "Microphone Access Denied", description: "Sh2 requires audio permissions to establish a link.", variant: "destructive" });
            setIsConnected(false);
            localStorage.setItem("sh2_connected", "false");
        }
    };

    const disconnect = () => {
        setIsConnected(false);
        localStorage.setItem("sh2_connected", "false");
        toast({ title: "Disconnected", description: "Channel closed." });

        peerConnections.current.forEach(pc => pc.destroy());
        peerConnections.current.clear();

        audioElements.current.forEach(audio => {
            audio.pause();
            audio.srcObject = null;
        });
        audioElements.current.clear();

        if (localStream.current) {
            localStream.current.getTracks().forEach(track => track.stop());
            localStream.current = null;
        }
        setActivePeers(0);
    };

    const scanFrequency = () => {
        const min = 100.00;
        const max = 150.00;
        const nextFreq = (Math.random() * (max - min) + min).toFixed(2);
        setFrequency(nextFreq);
    };

    // Try to reconnect automatically if it was connected on refresh
    useEffect(() => {
        const wasConnected = localStorage.getItem("sh2_connected") === "true";
        if (wasConnected && authUser && !localStream.current && !isConnected) {
            connect();
        }
    }, [authUser, isConnected]);

    return (
        <CommunicationContext.Provider
            value={{
                frequency,
                setFrequency,
                isConnected,
                isMuted,
                setIsMuted,
                activePeers,
                activeUsers,
                connect,
                disconnect,
                audioError,
                scanFrequency
            }}
        >
            {children}
        </CommunicationContext.Provider>
    );
}

export function useCommunication() {
    const context = useContext(CommunicationContext);
    if (context === undefined) {
        throw new Error("useCommunication must be used within a CommunicationProvider");
    }
    return context;
}
