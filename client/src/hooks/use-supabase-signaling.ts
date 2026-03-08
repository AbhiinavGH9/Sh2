import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type SignalPayload = {
    type: "webrtcSignal";
    payload: {
        fromUserId: string;
        targetUserId?: string;
        signalData: any;
        frequency: string;
    };
};

export type PresenceState = {
    id: string;
    name: string;
    avatar?: string;
    isSpeaking: boolean;
};

export function useSupabaseSignaling(frequency: string, user: { id: string; name: string; avatar?: string } | null, isConnected: boolean) {
    const [channel, setChannel] = useState<RealtimeChannel | null>(null);
    const [activeUsers, setActiveUsers] = useState<PresenceState[]>([]);
    const [lastSignal, setLastSignal] = useState<SignalPayload | null>(null);
    const [connected, setConnected] = useState(false);
    const userKeyRef = useRef<string>("");

    useEffect(() => {
        if (!isConnected || !user || !frequency) {
            if (channel) {
                channel.unsubscribe();
                setChannel(null);
                setActiveUsers([]);
                setConnected(false);
            }
            return;
        }

        const roomPrefix = `frequency:${frequency}`;
        const newChannel = supabase.channel(roomPrefix, {
            config: {
                broadcast: { ack: false, self: false },
                presence: { key: user.id },
            },
        });

        userKeyRef.current = user.id;

        newChannel
            .on("presence", { event: "sync" }, () => {
                const state = newChannel.presenceState();
                const users: PresenceState[] = [];

                Object.keys(state).forEach((key) => {
                    const presences = state[key] as any[];
                    presences.forEach((p) => {
                        users.push({
                            id: p.user_id,
                            name: p.name,
                            avatar: p.avatar,
                            isSpeaking: p.isSpeaking || false,
                        });
                    });
                });
                setActiveUsers(users);
            })
            .on("broadcast", { event: "webrtcSignal" }, (payload) => {
                setLastSignal({
                    type: "webrtcSignal",
                    payload: payload.payload,
                });
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    setConnected(true);
                    await newChannel.track({
                        user_id: user.id,
                        name: user.name,
                        avatar: user.avatar,
                        isSpeaking: false,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        setChannel(newChannel);

        return () => {
            newChannel.unsubscribe();
            setChannel(null);
            setConnected(false);
        };
    }, [frequency, isConnected]);

    const emitSignal = useCallback(
        (targetUserId: string, signalData: any) => {
            if (!channel || !user) return;
            channel.send({
                type: "broadcast",
                event: "webrtcSignal",
                payload: {
                    fromUserId: user.id,
                    targetUserId,
                    signalData,
                    frequency,
                },
            });
        },
        [channel, user, frequency]
    );

    const updateSpeakingState = useCallback(
        async (isSpeaking: boolean) => {
            if (!channel || !user) return;
            await channel.track({
                user_id: user.id,
                name: user.name,
                avatar: user.avatar,
                isSpeaking,
                online_at: new Date().toISOString(),
            });
        },
        [channel, user]
    );

    return { connected, activeUsers, lastSignal, emitSignal, updateSpeakingState };
}
