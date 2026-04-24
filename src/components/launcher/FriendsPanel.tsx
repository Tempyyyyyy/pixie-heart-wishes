import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, UserPlus, Check, X, Loader2, Search, Inbox, Send } from "lucide-react";
import { Link } from "react-router-dom";

type FriendProfile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

type FriendshipRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted";
  created_at: string;
};

type FriendEntry = {
  rowId: string;
  status: "pending" | "accepted";
  direction: "incoming" | "outgoing";
  profile: FriendProfile;
};

export const FriendsPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<FriendEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState<"friends" | "incoming" | "outgoing" | "find">("friends");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: rows } = await supabase
      .from("friendships")
      .select("id, requester_id, addressee_id, status, created_at")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    const list = (rows ?? []) as FriendshipRow[];
    const otherIds = Array.from(new Set(list.map(r => r.requester_id === user.id ? r.addressee_id : r.requester_id)));

    let profilesMap = new Map<string, FriendProfile>();
    if (otherIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", otherIds);
      (profs ?? []).forEach(p => profilesMap.set(p.id, p as FriendProfile));
    }

    const entries: FriendEntry[] = list.map(r => {
      const otherId = r.requester_id === user.id ? r.addressee_id : r.requester_id;
      return {
        rowId: r.id,
        status: r.status,
        direction: r.requester_id === user.id ? "outgoing" : "incoming",
        profile: profilesMap.get(otherId) ?? { id: otherId, display_name: null, avatar_url: null },
      };
    });
    setEntries(entries);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('friend-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friendships',
          filter: `addressee_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New friend request:', payload.new);
          const newRequest = payload.new as FriendshipRow;
          supabase
            .from('profiles')
            .select('display_name')
            .eq('id', newRequest.requester_id)
            .single()
            .then(({ data, error }) => {
              if (error) {
                console.error(error);
                return;
              }
              toast({
                title: 'Новая заявка в друзья',
                description: `От ${data.display_name}`,
              });
              load();
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast, load]);

  const friends = entries.filter(e => e.status === "accepted");
  const incoming = entries.filter(e => e.status === "pending" && e.direction === "incoming");
  const outgoing = entries.filter(e => e.status === "pending" && e.direction === "outgoing");

  const doSearch = async () => {
    if (!user || !search.trim()) return;
    setSearching(true);
    const q = search.trim();
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .ilike("display_name", `%${q}%`)
      .neq("id", user.id)
      .limit(20);
    setSearchResults((data ?? []) as FriendProfile[]);
    setSearching(false);
  };

  const sendRequest = async (target: FriendProfile) => {
    if (!user) return;
    const exists = entries.find(e => e.profile.id === target.id);
    if (exists) {
      toast({ title: "Уже есть запрос или дружба", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("friendships").insert({
      requester_id: user.id,
      addressee_id: target.id,
      status: "pending",
    });
    if (error) return toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    toast({ title: "Заявка отправлена", description: target.display_name ?? "Игрок" });
    load();
  };

  const accept = async (rowId: string) => {
    const { error } = await supabase.from("friendships").update({ status: "accepted" }).eq("id", rowId);
    if (error) return toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    toast({ title: "Заявка принята" });
    load();
  };

  const remove = async (rowId: string) => {
    const { error } = await supabase.from("friendships").delete().eq("id", rowId);
    if (error) return toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    load();
  };

  const initials = (n: string | null) => (n || "?").slice(0, 2).toUpperCase();

  return (
    <section className="rounded-2xl border border-border bg-card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span className="font-display font-bold text-base">Друзья</span>
          <span className="text-xs text-muted-foreground">({friends.length})</span>
        </div>
        <div className="flex gap-1 text-xs">
          <TabBtn active={tab === "friends"} onClick={() => setTab("friends")} icon={Users} label={`Друзья`} count={friends.length} />
          <TabBtn active={tab === "incoming"} onClick={() => setTab("incoming")} icon={Inbox} label="Входящие" count={incoming.length} highlight={incoming.length > 0} />
          <TabBtn active={tab === "outgoing"} onClick={() => setTab("outgoing")} icon={Send} label="Исходящие" count={outgoing.length} />
          <TabBtn active={tab === "find"} onClick={() => setTab("find")} icon={UserPlus} label="Найти" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : tab === "find" ? (
        <div>
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="Имя игрока…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doSearch()}
            />
            <Button onClick={doSearch} disabled={searching || !search.trim()}>
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
          {searchResults.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-6">
              Введи имя другого игрока лаунчера
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {searchResults.map(p => {
                const existing = entries.find(e => e.profile.id === p.id);
                return (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30 border border-border">
                    <Avatar className="w-9 h-9 rounded-lg">
                      {p.avatar_url && <AvatarImage src={p.avatar_url} className="object-cover" />}
                      <AvatarFallback className="rounded-lg bg-primary/20 text-xs">{initials(p.display_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-sm font-medium truncate">{p.display_name || "Без имени"}</div>
                    {existing ? (
                      <span className="text-xs text-muted-foreground">
                        {existing.status === "accepted" ? "В друзьях" : existing.direction === "outgoing" ? "Заявка отправлена" : "Ждёт ответа"}
                      </span>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => sendRequest(p)}>
                        <UserPlus className="w-3.5 h-3.5 mr-1" />Добавить
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <FriendList
          entries={tab === "friends" ? friends : tab === "incoming" ? incoming : outgoing}
          tab={tab}
          onAccept={accept}
          onRemove={remove}
        />
      )}
    </section>
  );
};

const TabBtn = ({ active, onClick, icon: Icon, label, count, highlight }: { active: boolean; onClick: () => void; icon: any; label: string; count?: number; highlight?: boolean }) => (
  <button
    onClick={onClick}
    className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
      active ? "bg-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground hover:text-foreground"
    }`}
  >
    <Icon className="w-3.5 h-3.5" />
    <span>{label}</span>
    {count !== undefined && count > 0 && (
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? "bg-primary-foreground/20" : highlight ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
        {count}
      </span>
    )}
  </button>
);

const FriendList = ({ entries, tab, onAccept, onRemove }: {
  entries: FriendEntry[];
  tab: "friends" | "incoming" | "outgoing";
  onAccept: (id: string) => void;
  onRemove: (id: string) => void;
}) => {
  if (entries.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-8">
        {tab === "friends" && "Пока нет друзей. Найди игроков во вкладке «Найти»."}
        {tab === "incoming" && "Нет входящих заявок."}
        {tab === "outgoing" && "Нет отправленных заявок."}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
      {entries.map(e => (
        <div key={e.rowId} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 border border-border hover:border-primary/30 transition-colors">
          <Avatar className="w-10 h-10 rounded-lg shrink-0">
            {e.profile.avatar_url && <AvatarImage src={e.profile.avatar_url} className="object-cover" />}
            <AvatarFallback className="rounded-lg bg-primary/20 text-xs">
              {(e.profile.display_name || "?").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{e.profile.display_name || "Без имени"}</div>
            <div className="text-[11px] text-muted-foreground">
              {e.status === "accepted" ? "Друг" : e.direction === "incoming" ? "Хочет добавить" : "Заявка ожидает"}
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            {tab === "incoming" && (
              <Button size="icon" variant="hero" className="h-8 w-8" onClick={() => onAccept(e.rowId)} aria-label="Принять">
                <Check className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => onRemove(e.rowId)} aria-label="Удалить">
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
