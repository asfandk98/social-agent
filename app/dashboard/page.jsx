'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const PLATFORM_COLORS = {
  facebook: '#1877F2', instagram: '#E1306C', twitter: '#1DA1F2', tiktok: '#2DD4BF',
};
const PLATFORM_LABELS = {
  facebook: 'Facebook', instagram: 'Instagram', twitter: 'Twitter / X', tiktok: 'TikTok',
};
const SERVICE_COLORS = {
  flight: '#0EA5E9', visa: '#8B5CF6', holiday: '#F59E0B', insurance: '#10B981',
};
const SERVICE_ICONS = {
  flight: '✈️', visa: '🛂', holiday: '🏖️', insurance: '🛡️',
};

export default function Dashboard() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedPost, setSelectedPost] = useState(null);
  const [refreshing, setRefreshing] = useState(null);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('postHistory') || '[]');
    setPosts(history);
  }, []);

  const refreshStats = async (post) => {
    if (!post.bufferIds?.length) return;
    setRefreshing(post.id);
    try {
      const res = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bufferIds: post.bufferIds }),
      });
      const data = await res.json();
      if (data.stats) {
        const updated = posts.map(p => p.id === post.id ? { ...p, stats: { ...p.stats, ...data.stats } } : p);
        setPosts(updated);
        localStorage.setItem('postHistory', JSON.stringify(updated));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(null);
    }
  };

  const deletePost = (id) => {
    const updated = posts.filter(p => p.id !== id);
    setPosts(updated);
    localStorage.setItem('postHistory', JSON.stringify(updated));
    if (selectedPost?.id === id) setSelectedPost(null);
  };

  const filteredPosts = filter === 'all' ? posts : posts.filter(p => p.serviceType === filter);

  // Aggregate stats
  const totalPosts = posts.length;
  const totalPlatformPosts = posts.reduce((sum, p) => sum + (p.platforms?.length || 0), 0);
  const totalImpressions = posts.reduce((sum, p) => {
    return sum + Object.values(p.stats || {}).reduce((s, st) => s + (st.impressions || 0), 0);
  }, 0);
  const totalClicks = posts.reduce((sum, p) => {
    return sum + Object.values(p.stats || {}).reduce((s, st) => s + (st.clicks || 0), 0);
  }, 0);

  // Platform breakdown
  const platformCounts = {};
  posts.forEach(p => (p.platforms || []).forEach(pl => { platformCounts[pl] = (platformCounts[pl] || 0) + 1; }));

  // Service type breakdown
  const serviceCounts = {};
  posts.forEach(p => { serviceCounts[p.serviceType] = (serviceCounts[p.serviceType] || 0) + 1; });

  return (
    <main style={{ minHeight: '100vh', background: '#0F1117', color: '#F1F0EC', fontFamily: "'Inter',sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #1E2130', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✈</div>
          <span style={{ fontWeight: 700, fontSize: 18 }}>Travel Ad Studio</span>
          <span style={{ background: '#1E2130', color: '#6B7280', fontSize: 12, padding: '3px 10px', borderRadius: 20 }}>Dashboard</span>
        </div>
        <button onClick={() => router.push('/')} style={{ padding: '9px 18px', borderRadius: 9, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}>
          + New post
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Summary stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
          <StatCard label="Total posts" value={totalPosts} icon="📝" color="#6366F1" />
          <StatCard label="Platform posts" value={totalPlatformPosts} icon="📤" color="#0EA5E9" />
          <StatCard label="Total impressions" value={totalImpressions.toLocaleString()} icon="👁️" color="#F59E0B" />
          <StatCard label="Total clicks" value={totalClicks.toLocaleString()} icon="🖱️" color="#10B981" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
          {/* Platform breakdown */}
          <div style={{ background: '#161822', border: '1px solid #1E2130', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#9CA3AF', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Posts by platform</div>
            {Object.entries(platformCounts).length === 0
              ? <div style={{ color: '#374151', fontSize: 14 }}>No posts yet</div>
              : Object.entries(platformCounts).map(([pl, count]) => (
                <div key={pl} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: PLATFORM_COLORS[pl] || '#6B7280', flexShrink: 0 }} />
                  <span style={{ fontSize: 14, flex: 1 }}>{PLATFORM_LABELS[pl] || pl}</span>
                  <div style={{ flex: 2, height: 6, background: '#1E2130', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.round((count / totalPlatformPosts) * 100)}%`, background: PLATFORM_COLORS[pl] || '#6B7280', borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 13, color: '#6B7280', minWidth: 28, textAlign: 'right' }}>{count}</span>
                </div>
              ))
            }
          </div>

          {/* Service type breakdown */}
          <div style={{ background: '#161822', border: '1px solid #1E2130', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#9CA3AF', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Posts by service type</div>
            {Object.entries(serviceCounts).length === 0
              ? <div style={{ color: '#374151', fontSize: 14 }}>No posts yet</div>
              : Object.entries(serviceCounts).map(([svc, count]) => (
                <div key={svc} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 16 }}>{SERVICE_ICONS[svc] || '📌'}</span>
                  <span style={{ fontSize: 14, flex: 1, textTransform: 'capitalize' }}>{svc}</span>
                  <div style={{ flex: 2, height: 6, background: '#1E2130', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.round((count / totalPosts) * 100)}%`, background: SERVICE_COLORS[svc] || '#6366F1', borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 13, color: '#6B7280', minWidth: 28, textAlign: 'right' }}>{count}</span>
                </div>
              ))
            }
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {['all', 'flight', 'visa', 'holiday', 'insurance'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '7px 16px', borderRadius: 8, border: `1.5px solid ${filter === f ? (SERVICE_COLORS[f] || '#6366F1') : '#1E2130'}`,
              background: filter === f ? (SERVICE_COLORS[f] || '#6366F1') + '18' : 'transparent',
              color: filter === f ? (SERVICE_COLORS[f] || '#818CF8') : '#6B7280',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize'
            }}>
              {f === 'all' ? 'All posts' : `${SERVICE_ICONS[f]} ${f}`}
            </button>
          ))}
        </div>

        {/* Posts list */}
        {filteredPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#374151' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No posts yet</div>
            <div style={{ fontSize: 14 }}>Create your first post to see it here.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredPosts.map(post => (
              <div key={post.id} style={{ background: '#161822', border: `1px solid ${selectedPost?.id === post.id ? '#6366F1' : '#1E2130'}`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s' }}
                onClick={() => setSelectedPost(selectedPost?.id === post.id ? null : post)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
                  {/* Image thumb */}
                  <div style={{ width: 60, height: 44, borderRadius: 7, overflow: 'hidden', background: '#0F1117', flexShrink: 0 }}>
                    <img src={post.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                  </div>

                  {/* Service + destination */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: SERVICE_COLORS[post.serviceType] || '#818CF8', textTransform: 'capitalize' }}>
                        {SERVICE_ICONS[post.serviceType]} {post.serviceType}
                      </span>
                      <span style={{ fontSize: 12, color: '#374151' }}>·</span>
                      <span style={{ fontSize: 13, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.destination}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#818CF8', marginLeft: 4 }}>{post.price}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#4B5563' }}>
                      {new Date(post.postedAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Platform pills */}
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    {(post.platforms || []).map(p => (
                      <span key={p} style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: PLATFORM_COLORS[p] + '20', color: PLATFORM_COLORS[p] }}>
                        {PLATFORM_LABELS[p]?.split(' ')[0]}
                      </span>
                    ))}
                  </div>

                  {/* Quick stats */}
                  <div style={{ display: 'flex', gap: 16, flexShrink: 0, minWidth: 160 }}>
                    <MiniStat icon="👁️" label="Impr." value={Object.values(post.stats || {}).reduce((s, st) => s + (st.impressions || 0), 0)} />
                    <MiniStat icon="🖱️" label="Clicks" value={Object.values(post.stats || {}).reduce((s, st) => s + (st.clicks || 0), 0)} />
                    <MiniStat icon="❤️" label="Likes" value={Object.values(post.stats || {}).reduce((s, st) => s + (st.likes || 0), 0)} />
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => refreshStats(post)} disabled={refreshing === post.id} style={{ padding: '6px 12px', borderRadius: 7, background: '#1E2130', border: 'none', color: refreshing === post.id ? '#4B5563' : '#9CA3AF', fontSize: 12, cursor: refreshing === post.id ? 'not-allowed' : 'pointer' }}>
                      {refreshing === post.id ? '...' : '↻ Sync'}
                    </button>
                    <button onClick={() => deletePost(post.id)} style={{ padding: '6px 10px', borderRadius: 7, background: '#2D1515', border: 'none', color: '#EF4444', fontSize: 12, cursor: 'pointer' }}>✕</button>
                  </div>
                </div>

                {/* Expanded detail panel */}
                {selectedPost?.id === post.id && (
                  <div style={{ borderTop: '1px solid #1E2130', padding: '18px 18px', background: '#0F1117' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
                      {(post.platforms || []).map(pl => {
                        const st = post.stats?.[pl] || {};
                        return (
                          <div key={pl} style={{ background: '#161822', border: `1px solid ${PLATFORM_COLORS[pl]}30`, borderRadius: 10, padding: 14 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: PLATFORM_COLORS[pl], marginBottom: 10 }}>{PLATFORM_LABELS[pl]}</div>
                            {st.pending ? (
                              <div style={{ fontSize: 12, color: '#4B5563' }}>Stats updating — check back in a few hours</div>
                            ) : (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <PlatformStat label="Impressions" value={st.impressions || 0} />
                                <PlatformStat label="Reach" value={st.reach || 0} />
                                <PlatformStat label="Clicks" value={st.clicks || 0} />
                                <PlatformStat label="Likes" value={st.likes || 0} />
                                <PlatformStat label="Comments" value={st.comments || 0} />
                                <PlatformStat label="Shares" value={st.shares || 0} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Caption preview per platform */}
                    <div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Captions</div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                        {(post.platforms || []).map(pl => (
                          <span key={pl} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: PLATFORM_COLORS[pl] + '18', color: PLATFORM_COLORS[pl], cursor: 'default' }}>
                            {PLATFORM_LABELS[pl]}
                          </span>
                        ))}
                      </div>
                      {(post.platforms || []).map(pl => post.captions?.[pl] && (
                        <div key={pl} style={{ marginBottom: 10, padding: '10px 14px', background: '#161822', borderRadius: 8, borderLeft: `3px solid ${PLATFORM_COLORS[pl]}` }}>
                          <div style={{ fontSize: 11, color: PLATFORM_COLORS[pl], fontWeight: 600, marginBottom: 4 }}>{PLATFORM_LABELS[pl]}</div>
                          <div style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6 }}>{post.captions[pl]}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{ background: '#161822', border: '1px solid #1E2130', borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color, marginBottom: 3 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#6B7280' }}>{label}</div>
    </div>
  );
}

function MiniStat({ icon, label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#F1F0EC' }}>{value.toLocaleString()}</div>
      <div style={{ fontSize: 11, color: '#4B5563' }}>{label}</div>
    </div>
  );
}

function PlatformStat({ label, value }) {
  return (
    <div style={{ background: '#0F1117', borderRadius: 7, padding: '8px 10px' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#F1F0EC' }}>{value.toLocaleString()}</div>
      <div style={{ fontSize: 11, color: '#4B5563', marginTop: 1 }}>{label}</div>
    </div>
  );
}
