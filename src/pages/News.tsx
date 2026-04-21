import { useEffect, useState } from "react";
import { Layout } from "@/components/launcher/Layout";
import { Badge } from "@/components/ui/badge";
import { Newspaper, Loader2, ExternalLink } from "lucide-react";
import fallbackImg from "@/assets/hero-bg.jpg";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

type NewsItem = {
  title: string;
  link: string;
  description: string;
  image: string | null;
  pubDate: string;
  source: string;
};

const News = () => {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${SUPABASE_URL}/functions/v1/news`)
      .then(r => r.json())
      .then(d => setItems(d.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <header className="mb-8 animate-fade-in">
        <h1 className="font-display font-bold text-3xl md:text-4xl mb-2 flex items-center gap-3">
          <Newspaper className="w-8 h-8 text-primary" />
          Новости Minecraft
        </h1>
        <p className="text-muted-foreground">Свежие обновления и истории сообщества с minecraft.net и PCGamesN.</p>
      </header>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          Не удалось загрузить новости. Проверь интернет.
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-6">
        {items.map((n, i) => (
          <a
            key={n.link + i}
            href={n.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/50 hover:-translate-y-1 transition-all flex flex-col"
          >
            <div className="aspect-video bg-secondary overflow-hidden">
              <img
                src={n.image || fallbackImg}
                alt={n.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackImg; }}
              />
            </div>
            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="secondary" className="text-[10px]">{n.source}</Badge>
                <span className="text-[11px] text-muted-foreground">
                  {n.pubDate ? new Date(n.pubDate).toLocaleDateString("ru") : ""}
                </span>
              </div>
              <h2 className="font-display font-bold text-base leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-3">
                {n.title}
              </h2>
              <p className="text-xs text-muted-foreground line-clamp-3 flex-1">{n.description}</p>
              <div className="mt-3 text-xs text-primary inline-flex items-center gap-1">
                Читать <ExternalLink className="w-3 h-3" />
              </div>
            </div>
          </a>
        ))}
      </div>
    </Layout>
  );
};

export default News;
