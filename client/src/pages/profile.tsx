import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProfile, useUpdateProfile, useUpdateUser } from "@/hooks/use-profiles";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings2, Save, AlertTriangle, KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export function ProfilePage() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const updateUser = useUpdateUser();
  const { toast } = useToast();

  const [bio, setBio] = useState("");
  const [interestInput, setInterestInput] = useState("");
  const [interests, setInterests] = useState<string[]>([]);

  const [firstName, setFirstName] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (profile) {
      setBio(profile.bio || "");
      setInterests(profile.interests || []);
    }
    if (user) {
      setFirstName(user.firstName || "");
      setProfileImageUrl(user.profileImageUrl || "");
    }
  }, [profile, user]);

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
    if (firstName !== user?.firstName || profileImageUrl !== user?.profileImageUrl) {
      updateUser.mutate({ firstName, profileImageUrl });
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      return toast({ title: "Error", description: "Passwords do not match or are empty.", variant: "destructive" });
    }
    setIsUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsUpdatingPassword(false);

    if (error) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password Updated", description: "Your security passphrase has been changed successfully." });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "sad_im_going!") return;
    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session found.");

      const res = await fetch("/api/auth/account", {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to delete account");
      }

      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (err: any) {
      toast({ title: "Deletion Failed", description: err.message, variant: "destructive" });
      setIsDeleting(false);
    }
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
              <AvatarImage src={profileImageUrl || user?.profileImageUrl || undefined} />
              <AvatarFallback className="text-4xl bg-primary text-primary-foreground font-display font-bold">
                {firstName?.charAt(0) || user?.firstName?.charAt(0) || user?.email?.charAt(0) || "X"}
              </AvatarFallback>
            </Avatar>
            <div className="w-full space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest ml-1">Callsign / Name</label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-background/50 border-white/10 text-center font-bold"
                  placeholder="AGENT X"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest ml-1">Avatar Link</label>
                <Input
                  value={profileImageUrl}
                  onChange={(e) => setProfileImageUrl(e.target.value)}
                  className="bg-background/50 border-white/10 text-center text-xs"
                  placeholder="https://..."
                />
              </div>
            </div>
            <p className="text-sm font-mono text-muted-foreground mt-4 break-all text-center">{user?.email}</p>
            <div className="mt-6 px-4 py-1.5 rounded-sm bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold tracking-widest shadow-[inset_0_0_10px_rgba(57,255,20,0.1)] whitespace-nowrap">
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
              disabled={updateProfile.isPending || updateUser.isPending}
              className="w-full mt-4 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground font-bold shadow-neon-green"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateProfile.isPending || updateUser.isPending ? "TRANSMITTING..." : "SAVE PARAMETERS"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <Card className="glass-panel border-white/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-accent" />
              <CardTitle className="font-display tracking-widest text-sm text-muted-foreground">SECURITY UPDATE</CardTitle>
            </div>
            <CardDescription className="text-xs">Update your operational passphrase.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-mono text-muted-foreground">NEW PASSPHRASE</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-background border-white/10 focus-visible:ring-accent rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono text-muted-foreground">CONFIRM PASSPHRASE</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-background border-white/10 focus-visible:ring-accent rounded-xl"
              />
            </div>
            <Button
              onClick={handleUpdatePassword}
              disabled={isUpdatingPassword || !newPassword}
              className="w-full mt-4 rounded-xl bg-accent hover:bg-accent/80 text-accent-foreground font-bold shadow-neon-orange"
            >
              {isUpdatingPassword ? "UPDATING..." : "CHANGE PASSPHRASE"}
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-panel border-destructive/20 bg-destructive/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity pointer-events-none">
            <AlertTriangle className="w-48 h-48 text-destructive" />
          </div>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive animate-pulse" />
              <CardTitle className="font-display tracking-widest text-sm text-destructive">DANGER ZONE</CardTitle>
            </div>
            <CardDescription className="text-xs text-destructive/70">
              Permanently purge your account, profiles, and active frequencies. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 mt-2">
            <div className="space-y-2 relative z-10">
              <label className="text-xs font-mono text-destructive/70">TYPE "sad_im_going!" TO VERIFY</label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="sad_im_going!"
                className="bg-background/50 border-destructive/30 focus-visible:ring-destructive rounded-xl"
              />
            </div>
            <Button
              onClick={handleDeleteAccount}
              disabled={isDeleting || deleteConfirmText !== "sad_im_going!"}
              variant="destructive"
              className="w-full mt-4 rounded-xl font-bold font-mono tracking-widest relative z-10"
            >
              {isDeleting ? "PURGING..." : "DELETE ACCOUNT"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
