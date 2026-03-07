import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAudioVolume } from "@/hooks/use-audio-volume";
import { useGroups, useCreateGroup } from "@/hooks/use-groups";
import { FrequencyDial } from "@/components/frequency-dial";
import { ActiveUsersList } from "@/components/active-users-list";
import { Copy, Plus, Hash, SignalHigh } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("public");
  
  // Public Tab State
  const [frequency, setFrequency] = useState("144.20");
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // WebRTC / WS hook
  const { connected: wsConnected, frequencyState, emit } = useWebSocket();
  const { isSpeaking, error: audioError } = useAudioVolume(isConnected && !isMuted, 20);
  const { toast } = useToast();

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
    emit("joinFrequency", { frequency });
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

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName) return;
    const code = Math.floor(100 + Math.random() * 900);
    createGroup.mutate({
      name: newGroupName,
      frequency: `88.${code}`,
      color: "hsl(111 100% 54%)",
      icon: "Users"
    }, {
      onSuccess: () => setNewGroupName("")
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">COMMAND CENTER</h1>
        <p className="text-muted-foreground">Select an operational mode to begin communication.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 bg-secondary p-1 rounded-xl border border-white/5 shadow-inner">
          <TabsTrigger value="public" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-neon-green transition-all">Public</TabsTrigger>
          <TabsTrigger value="duo" className="rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-neon-orange transition-all">Duo</TabsTrigger>
          <TabsTrigger value="groups" className="rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground border border-transparent data-[state=active]:border-white/10 transition-all">Groups</TabsTrigger>
        </TabsList>

        <div className="mt-8">
          {/* PUBLIC TAB */}
          <TabsContent value="public" className="m-0">
            <div className="flex flex-col items-center">
              <FrequencyDial 
                frequency={frequency}
                isConnected={isConnected}
                isMuted={isMuted}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onToggleMute={() => setIsMuted(!isMuted)}
                onScan={scanFrequency}
              />
              
              {audioError && (
                <div className="mt-4 text-destructive text-sm font-mono flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-destructive animate-pulse"></span>
                  ERR: {audioError}
                </div>
              )}

              {isConnected && frequencyState?.frequency === frequency && (
                <ActiveUsersList users={frequencyState.users} />
              )}
            </div>
          </TabsContent>

          {/* DUO TAB */}
          <TabsContent value="duo" className="m-0">
            <Card className="glass-panel border-white/10 overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Hash className="w-32 h-32" />
              </div>
              <CardHeader>
                <CardTitle className="font-display tracking-widest text-accent">SECURE P2P LINK</CardTitle>
                <CardDescription>Generate a one-time frequency for private point-to-point comms.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-12">
                {!duoFreq ? (
                  <Button 
                    size="lg" 
                    onClick={generateDuo}
                    className="bg-accent hover:bg-accent/80 text-accent-foreground shadow-neon-orange rounded-full px-8 font-bold"
                  >
                    GENERATE SECURE FREQUENCY
                  </Button>
                ) : (
                  <div className="flex flex-col items-center gap-6 w-full max-w-sm">
                    <div className="w-full p-6 bg-background rounded-2xl border border-accent/30 text-center shadow-[inset_0_0_20px_rgba(255,153,0,0.1)]">
                      <div className="text-sm font-mono text-muted-foreground mb-2">ALLOCATED FREQUENCY</div>
                      <div className="text-4xl font-display font-black text-accent text-shadow-neon-orange">{duoFreq} <span className="text-lg opacity-50">MHz</span></div>
                    </div>
                    
                    <div className="flex gap-4 w-full">
                      <Button variant="outline" className="flex-1 rounded-xl border-white/10" onClick={copyInvite}>
                        <Copy className="w-4 h-4 mr-2" /> Copy Link
                      </Button>
                      <Button 
                        className="flex-1 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground shadow-neon-green"
                        onClick={() => {
                          setFrequency(duoFreq);
                          setActiveTab("public");
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
          <TabsContent value="groups" className="m-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass-panel border-white/10 border-dashed">
                <CardHeader>
                  <CardTitle className="font-display tracking-wide flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" /> NEW CHANNEL
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateGroup} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-mono text-muted-foreground">DESIGNATION</label>
                      <Input 
                        placeholder="e.g. Alpha Squad" 
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="bg-background border-white/10 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-xl"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-white/5"
                      disabled={!newGroupName || createGroup.isPending}
                    >
                      {createGroup.isPending ? "INITIALIZING..." : "CREATE CHANNEL"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground px-1">Saved Channels</h3>
                {groups?.length === 0 && (
                  <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl text-muted-foreground">
                    No channels available.
                  </div>
                )}
                {groups?.map((group) => (
                  <div 
                    key={group.id} 
                    className="group relative overflow-hidden bg-card border border-white/5 p-4 rounded-2xl hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setFrequency(group.frequency);
                      setActiveTab("public");
                    }}
                  >
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center border border-white/10 group-hover:border-primary/30 group-hover:shadow-[0_0_10px_rgba(57,255,20,0.2)] transition-all">
                          <SignalHigh className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground">{group.name}</h4>
                          <p className="text-xs font-mono text-muted-foreground">FREQ: {group.frequency} MHz</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-muted-foreground group-hover:text-primary transition-colors">
                        <Radio className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
