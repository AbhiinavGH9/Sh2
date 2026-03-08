import { useState, useEffect, useRef, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSupabaseSignaling } from "@/hooks/use-supabase-signaling";
import { useAudioVolume } from "@/hooks/use-audio-volume";
import { useGroups, useCreateGroup, useDeleteGroup } from "@/hooks/use-groups";
import { FrequencyDial } from "@/components/frequency-dial";
import { ActiveUsersList } from "@/components/active-users-list";
import { Copy, Plus, Hash, SignalHigh, Radio, Share2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import SimplePeer from "simple-peer";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function Dashboard() {
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState("public");

  const [frequency, setFrequency] = useState("144.20");
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Default muted
  const [activePeers, setActivePeers] = useState(0);

  // WebRTC / Supabase hook
  const fallbackUser = authUser ? {
    id: authUser.id.toString(),
    name: `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim() || 'Agent',
    avatar: authUser.profileImageUrl || undefined
  } : null;

  const { connected: wsConnected, activeUsers: frequencyStateUsers, lastSignal: lastMessage, emitSignal, updateSpeakingState } = useSupabaseSignaling(frequency, fallbackUser, isConnected);

  const { isSpeaking, error: audioError } = useAudioVolume(isConnected && !isMuted, 20);
  const { toast } = useToast();

  const peerConnections = useRef<Map<string, SimplePeer.Instance>>(new Map());
  const localStream = useRef<MediaStream | null>(null);

  const createPeer = useCallback((targetUserId: string, initiator: boolean, incomingSignal?: any) => {
    if (peerConnections.current.has(targetUserId)) return;

    try {
      const pc = new SimplePeer({
        initiator,
        stream: localStream.current || undefined,
        trickle: true,
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
        const audio = new Audio();
        audio.srcObject = stream;
        audio.play().catch(console.error);
      });

      pc.on("close", () => {
        peerConnections.current.delete(targetUserId);
        let count = 0;
        peerConnections.current.forEach(p => {
          if (p.connected) count++;
        });
        setActivePeers(count);
      });

      pc.on("error", (err) => {
        console.error("SimplePeer error for user", targetUserId, err);
        peerConnections.current.delete(targetUserId);
      });

      if (incomingSignal) {
        pc.signal(incomingSignal);
      }
    } catch (err) {
      console.error("Failed to create SimplePeer", err);
    }
  }, [frequency, emitSignal]);

  // Handle Voice and Signaling Connection Flow
  useEffect(() => {
    if (!isConnected || !wsConnected || !authUser) return;

    const cleanup = () => {
      peerConnections.current.forEach(pc => pc.destroy());
      peerConnections.current.clear();
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
        localStream.current = null;
      }
      setActivePeers(0);
    };

    return cleanup;
  }, [isConnected, wsConnected, frequency, authUser]);

  // Handle incoming sockets to spawn peers
  useEffect(() => {
    if (!lastMessage || !isConnected) return;

    const { type, payload } = lastMessage;

    if (type === 'webrtcSignal') {
      let pc = peerConnections.current.get(payload.fromUserId);

      if (!pc) {
        const isInitiator = String(authUser?.id || "") > String(payload.fromUserId);
        createPeer(payload.fromUserId, isInitiator, payload.signalData);
      } else {
        pc.signal(payload.signalData);
      }
    }
  }, [lastMessage, isConnected, authUser, createPeer]);

  // Synchronize new Presence Connections
  useEffect(() => {
    if (!isConnected || !frequencyStateUsers) return;

    frequencyStateUsers.forEach((u) => {
      if (u.id !== String(authUser?.id) && !peerConnections.current.has(u.id)) {
        // Deterministic Initiator
        const isInitiator = String(authUser?.id || "") > String(u.id);
        createPeer(u.id, isInitiator);
      }
    });
  }, [frequencyStateUsers, isConnected, authUser, createPeer]);

  // Handle Speaking State changes
  useEffect(() => {
    if (isConnected) {
      updateSpeakingState(isSpeaking);
    }
  }, [isSpeaking, isConnected, updateSpeakingState]);

  // Handle hardware muting
  useEffect(() => {
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  const handleConnect = async () => {
    try {
      if (!localStream.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getAudioTracks().forEach(track => {
          track.enabled = false;
        });
        localStream.current = stream;
      }
      setIsMuted(true);
      setIsConnected(true);
      toast({ title: "Connected", description: `Tuned to ${frequency} MHz. Microphone is muted.` });
    } catch (err) {
      toast({ title: "Microphone Access Denied", description: "Sh2 requires audio permissions to establish a link.", variant: "destructive" });
      setIsConnected(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    toast({ title: "Disconnected", description: "Channel closed." });

    // Clear WebRTC states
    peerConnections.current.forEach(pc => pc.destroy());
    peerConnections.current.clear();
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }
    setActivePeers(0);
  };

  // Push-To-Talk Mechanics
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space' && isConnected) {
        e.preventDefault();
        if (isMuted) setIsMuted(false);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space' && isConnected) {
        e.preventDefault();
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

  const scanFrequency = () => {
    const min = 100.00;
    const max = 150.00;
    const nextFreq = (Math.random() * (max - min) + min).toFixed(2);
    setFrequency(nextFreq);
  };

  // Duo Tab State
  const [duoFreq, setDuoFreq] = useState("");
  const generateDuo = () => {
    const code = Math.floor(1000 + Math.random() * 9000);
    setDuoFreq(`42.${code}`);
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(`${window.location.origin}/?freq=${duoFreq}`);
    toast({ title: "Copied", description: "Invite link copied to clipboard." });
  };

  const [joinLink, setJoinLink] = useState("");

  const handleJoinLink = () => {
    if (!joinLink) return;
    try {
      let freqToJoin = joinLink;
      if (joinLink.includes('?freq=')) {
        const url = new URL(joinLink);
        freqToJoin = url.searchParams.get('freq') || joinLink;
      }
      setFrequency(freqToJoin);
      setActiveTab("public");
      handleConnect();
      setJoinLink("");
    } catch {
      setFrequency(joinLink);
      setActiveTab("public");
      handleConnect();
      setJoinLink("");
    }
  };

  // Parse URL for ?freq= to support share links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const freqParam = params.get('freq');
    if (freqParam && !isConnected) {
      setFrequency(freqParam);
      window.history.replaceState({}, document.title, "/");
    }
  }, [isConnected]);

  // Groups Tab
  const { data: groups } = useGroups();
  const createGroup = useCreateGroup();
  const deleteGroup = useDeleteGroup();
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupFreq, setNewGroupFreq] = useState("");
  const [newGroupIsPrivate, setNewGroupIsPrivate] = useState(false);

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName) return;

    const freq = newGroupFreq || `88.${Math.floor(100 + Math.random() * 900)}`;

    if (groups?.some(g => g.frequency === freq)) {
      toast({ title: "Conflict", description: "This frequency is already assigned to another group.", variant: "destructive" });
      return;
    }

    createGroup.mutate({
      name: newGroupName,
      frequency: freq,
      color: "hsl(111 100% 54%)",
      icon: "Users",
      isPrivate: newGroupIsPrivate
    }, {
      onSuccess: () => {
        setNewGroupName("");
        setNewGroupFreq("");
        toast({ title: "Success", description: `Group ${newGroupName} created at ${freq} MHz` });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message || "Failed to create group", variant: "destructive" });
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-black text-foreground tracking-tighter uppercase">Sh2</h1>
          <p className="text-muted-foreground font-mono text-sm tracking-widest uppercase opacity-60 mt-1">Command & Control</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 bg-secondary/30 p-2 rounded-2xl border border-white/5 backdrop-blur-sm">
            <div className={`w-2 h-2 rounded-full shadow-neon-green animate-pulse ${wsConnected ? 'bg-primary' : 'bg-muted'}`} />
            <span className="text-[10px] font-mono tracking-widest uppercase opacity-80">Link Status: {wsConnected ? "Active" : "Offline"}</span>
          </div>
          <div className="flex items-center gap-2 bg-secondary/30 p-2 rounded-2xl border border-white/5 backdrop-blur-sm">
            <div className={`w-2 h-2 rounded-full animate-pulse ${activePeers > 0 ? 'bg-accent shadow-neon-orange' : 'bg-muted'}`} />
            <span className="text-[10px] font-mono tracking-widest uppercase opacity-80">WebRTC: {activePeers > 0 ? `${activePeers} PEER(S) OK` : "WAITING"}</span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 bg-secondary p-1.5 rounded-2xl border border-white/5 shadow-inner">
          <TabsTrigger value="public" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-neon-green transition-all font-bold uppercase tracking-widest text-xs">Public</TabsTrigger>
          <TabsTrigger value="duo" className="rounded-xl data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-neon-orange transition-all font-bold uppercase tracking-widest text-xs">Duo</TabsTrigger>
          <TabsTrigger value="groups" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-foreground border border-transparent data-[state=active]:border-white/10 transition-all font-bold uppercase tracking-widest text-xs">Groups</TabsTrigger>
        </TabsList>

        <div className="mt-8 space-y-8">
          {/* PUBLIC TAB */}
          <TabsContent value="public" className="m-0 focus-visible:outline-none">
            <div className="flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <FrequencyDial
                frequency={frequency}
                onFrequencyChange={setFrequency}
                isConnected={isConnected}
                isMuted={isMuted}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onToggleMute={() => setIsMuted(!isMuted)}
                onScan={scanFrequency}
              />

              {audioError && (
                <div className="text-destructive text-sm font-mono flex items-center gap-2 bg-destructive/10 px-4 py-2 rounded-full border border-destructive/20">
                  <span className="w-2 h-2 rounded-full bg-destructive animate-pulse"></span>
                  SH2 ERROR: {audioError}
                </div>
              )}

              {isConnected && (
                <ActiveUsersList users={frequencyStateUsers} />
              )}
            </div>
          </TabsContent>

          {/* DUO TAB */}
          <TabsContent value="duo" className="m-0 focus-visible:outline-none">
            <Card className="glass-panel border-white/10 overflow-hidden rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <Hash className="w-64 h-64" />
              </div>
              <CardHeader className="text-center md:text-left">
                <CardTitle className="font-display tracking-widest text-accent text-2xl">SECURE P2P LINK</CardTitle>
                <CardDescription className="uppercase font-mono text-[10px] tracking-widest opacity-60">Establish direct point-to-point communication</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-12 px-6">
                {!duoFreq ? (
                  <div className="space-y-6 text-center">
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto">Click below to generate a temporary secure frequency for private communication.</p>
                    <Button
                      size="lg"
                      onClick={generateDuo}
                      className="bg-accent hover:bg-accent/80 text-accent-foreground shadow-neon-orange rounded-full px-10 h-16 text-lg font-black tracking-widest transition-all hover:scale-105 active:scale-95"
                    >
                      GENERATE LINK
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-8 w-full max-w-md">
                    <div className="w-full p-10 bg-background/50 rounded-3xl border border-accent/30 text-center shadow-[inset_0_0_30px_rgba(255,153,0,0.05)] backdrop-blur-xl relative group overflow-hidden">
                      <div className="text-[10px] font-mono text-muted-foreground mb-4 uppercase tracking-[0.3em]">Allocated Freq</div>
                      <div className="text-5xl md:text-6xl font-display font-black text-accent text-shadow-neon-orange flex flex-col items-center justify-center gap-2 break-all w-full min-w-0 flex-wrap">
                        {duoFreq}
                        <span className="text-xl opacity-30 font-mono mb-2">MHz</span>
                      </div>
                      <div className="absolute -inset-0.5 bg-accent/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none" />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                      <Button variant="outline" className="flex-1 h-14 rounded-2xl border-white/10 bg-secondary/20 hover:bg-secondary/40 font-bold uppercase tracking-widest text-xs" onClick={copyInvite}>
                        <Copy className="w-4 h-4 mr-2" /> Copy Link
                      </Button>
                      <Button
                        className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/80 text-primary-foreground shadow-neon-green font-black uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95"
                        onClick={() => {
                          setFrequency(duoFreq);
                          setActiveTab("public");
                          handleConnect();
                        }}
                      >
                        TUNE IN
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      className="w-full h-12 mt-4 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-2xl font-black uppercase tracking-widest text-xs transition-colors"
                      onClick={() => setDuoFreq("")}
                    >
                      Terminate Link
                    </Button>
                  </div>
                )}

                <div className="w-full max-w-md mt-10 space-y-4 border-t border-white/5 pt-8 z-10 relative">
                  <p className="text-muted-foreground text-xs uppercase tracking-widest text-center opacity-60">Or Join Existing Link</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Paste link or Freq..."
                      value={joinLink}
                      onChange={(e) => setJoinLink(e.target.value)}
                      className="h-14 bg-background/50 border-white/10 focus-visible:ring-accent focus-visible:border-accent transition-all rounded-2xl text-center font-mono placeholder:uppercase"
                    />
                    <Button
                      onClick={handleJoinLink}
                      disabled={!joinLink}
                      className="h-14 px-8 rounded-2xl bg-secondary hover:bg-accent hover:text-accent-foreground border border-white/10 hover:border-accent transition-all font-bold uppercase tracking-widest text-xs"
                    >
                      JOIN
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* GROUPS TAB */}
          <TabsContent value="groups" className="m-0 focus-visible:outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="lg:col-span-5">
                <Card className="glass-panel border-white/10 rounded-3xl overflow-hidden sticky top-8">
                  <CardHeader>
                    <CardTitle className="font-display tracking-widest flex items-center gap-2 text-xl">
                      <Plus className="w-6 h-6 text-primary" /> INITIALIZE CHANNEL
                    </CardTitle>
                    <CardDescription className="uppercase font-mono text-[10px] tracking-widest opacity-60">Deploy a persistent communication node</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateGroup} className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest ml-1">Callsign / Designation</label>
                        <Input
                          placeholder="ALPHA-SQUAD"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value.toUpperCase())}
                          className="h-14 bg-background/50 border-white/10 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-2xl text-lg font-bold tracking-tight"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest ml-1">Assigned Freq (MHz)</label>
                        <Input
                          placeholder="e.g. 88.50"
                          value={newGroupFreq}
                          onChange={(e) => setNewGroupFreq(e.target.value)}
                          className="h-14 bg-background/50 border-white/10 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-2xl text-lg font-bold tracking-tight"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-background/50 border border-white/5 rounded-2xl">
                        <div className="space-y-0.5">
                          <label className="text-sm font-bold tracking-tight text-foreground/90">Private Network</label>
                          <p className="text-[10px] font-mono text-muted-foreground uppercase opacity-80">Hide from public frequency scanners</p>
                        </div>
                        <Switch
                          checked={newGroupIsPrivate}
                          onCheckedChange={setNewGroupIsPrivate}
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/80 text-primary-foreground shadow-neon-green font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95"
                        disabled={!newGroupName || createGroup.isPending}
                      >
                        {createGroup.isPending ? "CONNECTING..." : "DEPLOY CHANNEL"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Operational Nodes</h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-white/5 to-transparent ml-4" />
                </div>

                {groups?.length === 0 && (
                  <div className="p-16 text-center border-2 border-dashed border-white/5 rounded-3xl text-muted-foreground bg-secondary/5">
                    <Radio className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    <p className="font-mono text-xs uppercase tracking-widest opacity-40">No active deployments detected.</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groups?.map((group) => (
                    <motion.div
                      key={group.id}
                      layout
                      className="group relative overflow-hidden bg-card/40 hover:bg-card/60 border border-white/5 p-6 rounded-3xl hover:border-primary/50 transition-all cursor-pointer backdrop-blur-sm"
                      onClick={() => {
                        setFrequency(group.frequency);
                        setActiveTab("public");
                        handleConnect();
                      }}
                    >
                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex flex-col gap-6 relative z-10">
                        <div className="flex items-center justify-between">
                          <div className="w-12 h-12 rounded-2xl bg-background/80 flex items-center justify-center border border-white/10 group-hover:border-primary/30 group-hover:shadow-[0_0_20px_rgba(57,255,20,0.1)] transition-all">
                            <SignalHigh className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex items-center justify-end gap-3 flex-1 min-w-0">
                            <div className="text-right flex-1 min-w-0 break-words">
                              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest opacity-60">Frequency</p>
                              <p className="font-display font-black text-xl text-primary leading-none mt-1 break-all">{group.frequency}</p>
                            </div>

                            {group.creatorId?.toString() === authUser?.id.toString() && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 mt-1 rounded-xl text-red-500/50 hover:text-red-400 hover:bg-red-500/20 z-20"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-background border-white/10 rounded-3xl">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="font-display font-black tracking-wider text-destructive">TERMINATE NETWORK?</AlertDialogTitle>
                                    <AlertDialogDescription className="font-mono text-sm opacity-80">
                                      This action will permanently dismantle the '{group.name}' node and disconnect all active agents. This cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl font-bold tracking-widest uppercase bg-secondary hover:bg-secondary/80 border-none">Abort</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="rounded-xl bg-destructive hover:bg-destructive/80 text-foreground font-bold tracking-widest uppercase shadow-none border-none"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteGroup.mutate(group.id);
                                      }}
                                    >
                                      Execute
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-black text-xl text-foreground tracking-tight group-hover:text-primary transition-colors">{group.name}</h4>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Node Active</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-auto hover:bg-transparent text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(`${window.location.origin}?freq=${group.frequency}`);
                              toast({ title: "Copied", description: "Channel link copied." });
                            }}
                          >
                            <Share2 className="w-3 h-3 mr-1.5" /> Invite
                          </Button>
                          <Radio className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors opacity-20 group-hover:opacity-100" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
