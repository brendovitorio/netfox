export type Channel = {
  id: string;
  name: string;
  logoUrl?: string;
  embedUrl: string;
  category?: string;
  isActive: boolean;
  nowPlayingTitle?: string;
};

export type ChannelCategory = {
  id: string;
  name: string;
};

const BASE_URL = 'https://reidosembeds.com/api';

async function channelsFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) throw new Error(`Rei dos Embeds respondeu ${response.status}`);
  return response.json();
}

function mapChannel(item: any): Channel {
  return {
    id: item.id,
    name: item.name,
    logoUrl: item.logo_url || undefined,
    embedUrl: item.embed_url,
    category: item.category || undefined,
    isActive: item.is_active !== false,
    nowPlayingTitle: item.now_playing_title || undefined,
  };
}

export async function fetchChannels(category?: string): Promise<Channel[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : '';
  const payload = await channelsFetch<{ success: boolean; data: any[] }>(`/channels${query}`);
  return (payload.data || []).map(mapChannel).filter((channel) => channel.isActive);
}

export async function fetchChannelCategories(): Promise<ChannelCategory[]> {
  const payload = await channelsFetch<{ success: boolean; data: ChannelCategory[] }>('/channels/categories');
  return payload.data || [];
}

export async function fetchChannel(id: string): Promise<Channel | null> {
  const payload = await channelsFetch<{ success: boolean; data: any }>(`/channels/${encodeURIComponent(id)}`);
  return payload.data ? mapChannel(payload.data) : null;
}
