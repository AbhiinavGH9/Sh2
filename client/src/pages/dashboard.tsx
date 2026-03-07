import { useState, useEffect, useRef, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAudioVolume } from "@/hooks/use-audio-volume";
import { useGroups, useCreateGroup } from "@/hooks/use-groups";
import { FrequencyDial } from "@/components/frequency-dial";
import { ActiveUsersList } from "@/components/active-users-list";
import { Copy, Plus, Hash, SignalHigh, Radio, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export function Dashboard() {
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState("public");
  
  // Public Tab State
  const [frequency, setFrequency] = useState("144.20");
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // WebRTC / WS hook
  const { connected: wsConnected, frequencyState, emit } = useWebSocket();
  const { isSpeaking, error: audioError } = useAudioVolume(isConnected && !isMuted, 20);
  const { toast } = useToast();

  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStream = useRef<MediaStream | null>(null);

  // Handle Voice and Signaling
  useEffect(() => {
    if (!isConnected || !wsConnected || !authUser) return;

    const setupPeer = async (targetUserId: string, isInitiator: boolean) => {
      if (peerConnections.current.has(targetUserId)) return;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnections.current.set(targetUserId, pc);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          emit("webrtcSignal", {
            type: "ice-candidate",
            candidate: event.candidate,
            targetUserId,
            frequency
          });
        }
      };

      pc.ontrack = (event) => {
        const audio = new Audio();
        audio.srcObject = event.streams[0];
        audio.play().catch(console.error);
      };

      try {
        if (!localStream.current) {
          localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        localStream.current.getTracks().forEach(track => pc.addTrack(track, localStream.current!));
        
        if (isInitiator) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          emit("webrtcSignal", { type: "offer", sdp: offer, targetUserId, frequency });
        }
      } catch (err) {
        console.error("WebRTC Error:", err);
      }
    };

    // Join with user info
    emit("joinFrequency" as any, { 
      frequency, 
      userInfo: { 
        id: authUser.id, 
        name: `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim() || 'Agent',
        avatar: authUser.profileImageUrl 
      } 
    });

    return () => {
      peerConnections.current.forEach(pc => pc.close());
      peerConnections.current.clear();
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
        localStream.current = null;
      }
    };
  }, [isConnected, wsConnected, frequency, authUser, emit]);

  // Handle signaling messages
  useEffect(() => {
    // This part should be integrated into useWebSocket or handled here via a listener if emit/ws supports it
    // For now, let's assume we need to handle incoming webrtcSignal from frequencyState or similar
  }, [frequencyState]);

  // Handle Speaking State changes
  useEffect(() => {
    if (isConnected) {
      emit("speaking", { isSpeaking });
    }
  }, [isSpeaking, isConnected, emit]);

  // Handle Connect/Disconnect
  const handleConnect = () => {
    setIsConnected(true);
    setIsMuted(false);
    toast({ title: "Connected", description: `Tuned to ${frequency} MHz` });
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    emit("leaveFrequency", { frequency });
    toast({ title: "Disconnected", description: "Channel closed." });
  };

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
    navigator.clipboard.writeText(`${window.location.origin}?freq=${duoFreq}`);
    toast({ title: "Copied", description: "Invite link copied to clipboard." });
  };

  // Groups Tab
  const { data: groups } = useGroups();
  const createGroup = useCreateGroup();
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupFreq, setNewGroupFreq] = useState("");

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
      icon: "Users"
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
        <div className="flex items-center gap-2 bg-secondary/30 p-2 rounded-2xl border border-white/5 backdrop-blur-sm">
          <div className="w-2 h-2 rounded-full bg-primary shadow-neon-green animate-pulse" />
          <span className="text-[10px] font-mono tracking-widest uppercase opacity-80">Link Status: {wsConnected ? "Active" : "Offline"}</span>
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
                  UPLINK ERROR: {audioError}
                </div>
              )}

              {isConnected && frequencyState?.frequency === frequency && (
                <ActiveUsersList users={frequencyState.users} />
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
                    <div className="w-full p-10 bg-background/50 rounded-3xl border border-accent/30 text-center shadow-[inset_0_0_30px_rgba(255,153,0,0.05)] backdrop-blur-xl relative group">
                      <div className="text-[10px] font-mono text-muted-foreground mb-4 uppercase tracking-[0.3em]">Allocated Freq</div>
                      <div className="text-5xl md:text-6xl font-display font-black text-accent text-shadow-neon-orange flex items-end justify-center gap-2">
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
                  </div>
                )}
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
                          <div className="text-right">
                            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest opacity-60">Frequency</p>
                            <p className="font-display font-black text-xl text-primary leading-none mt-1">{group.frequency}</p>
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
