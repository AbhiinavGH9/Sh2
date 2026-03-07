import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProfile, useUpdateProfile } from "@/hooks/use-profiles";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings2, Save } from "lucide-react";

export function ProfilePage() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  
  const [bio, setBio] = useState("");
  const [interestInput, setInterestInput] = useState("");
  const [interests, setInterests] = useState<string[]>([]);

  useEffect(() => {
    if (profile) {
      setBio(profile.bio || "");
      setInterests(profile.interests || []);
    }
  }, [profile]);

  const addInterest = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && interestInput.trim()) {
      e.preventDefault();
      if (!interests.includes(interestInput.trim())) {
        setInterests([...interests, interestInput.trim()]);
      }
      setInterestInput("");
    }
  };

  const removeInterest = (index: number) => {
    setInterests(interests.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    updateProfile.mutate({ bio, interests });
  };

  if (isLoading) return <div className="p-8 font-mono animate-pulse text-primary">LOADING AGENT DATA...</div>;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <div className="mb-8 flex items-center gap-3">
        <Settings2 className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-display font-bold text-foreground uppercase">Agent Profile</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-1 glass-panel border-white/5 bg-secondary/50">
          <CardContent className="flex flex-col items-center py-8">
            <Avatar className="w-32 h-32 mb-6 border-4 border-background shadow-xl shadow-black/50">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback className="text-4xl bg-primary text-primary-foreground font-display font-bold">
                {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "X"}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold">{user?.firstName} {user?.lastName}</h2>
            <p className="text-sm font-mono text-muted-foreground mt-1">{user?.email}</p>
            <div className="mt-6 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold tracking-widest shadow-[inset_0_0_10px_rgba(57,255,20,0.1)]">
              CLEARANCE LEVEL 1
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 glass-panel border-white/5">
          <CardHeader>
            <CardTitle className="font-display tracking-widest text-sm text-muted-foreground">OPERATIONAL PARAMETERS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-mono text-muted-foreground">BIO / DIRECTIVES</label>
              <Textarea 
                placeholder="Enter operational directives..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="bg-background border-white/10 focus-visible:ring-primary min-h-[120px] rounded-xl resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-muted-foreground">SIGNAL INTERESTS (Press Enter)</label>
              <Input 
                placeholder="e.g. Gaming, Cybersec..."
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={addInterest}
                className="bg-background border-white/10 focus-visible:ring-primary rounded-xl"
              />
              <div className="flex flex-wrap gap-2 mt-3">
                {interests.map((tag, i) => (
                  <span 
                    key={i} 
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary text-xs font-medium border border-white/5 text-foreground"
                  >
                    {tag}
                    <button 
                      onClick={() => removeInterest(i)}
                      className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={updateProfile.isPending}
              className="w-full mt-4 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground font-bold shadow-neon-green"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateProfile.isPending ? "TRANSMITTING..." : "SAVE PARAMETERS"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
