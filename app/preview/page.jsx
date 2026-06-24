'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const PLATFORM_COLORS = {
  facebook: '#1877F2', instagram: '#E1306C', twitter: '#1DA1F2', tiktok: '#2DD4BF',
};
const PLATFORM_LABELS = {
  facebook: 'Facebook', instagram: 'Instagram', twitter: 'Twitter / X', tiktok: 'TikTok',
};

export default function PreviewPage() {
  const router = useRouter();
  const [draft, setDraft] = useState(null);
  const [captions, setCaptions] = useState({});
  const [activeTab, setActiveTab] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [posting, setPosting] = useState(false);
  const [results, setResults] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [whatsappCopied, setWhatsappCopied] = useState(false);

  // composited image state
  const [compositePreviewUrl, setCompositePreviewUrl] = useState(null); // local blob preview
  const [compositePublicUrl, setCompositePublicUrl] = useState(null);   // public URL used for Buffer
  const [compositing, setCompositing] = useState(false);
  const [compositeError, setCompositeError] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('postDraft');
    if (!saved) { router.push('/'); return; }
    const data = JSON.parse(saved);
    setDraft(data);
    setCaptions(data.captions || {});
    setActiveTab((data.platforms || [])[0]);
  }, []);

  // Generate the composited (logo + layout) image once the draft loads
  useEffect(() => {
    if (!draft) return;

    async function generateComposite() {
      setCompositing(true);
      setCompositeError(null);
      try {
        const res = await fetch('/api/composite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceType: draft.serviceType,
            destination: draft.destination,
            origin: draft.origin,
            price: draft.price,
            currency: draft.currency,
            startDate: draft.startDate,
            endDate: draft.endDate,
            imageUrl: draft.imageUrl, // raw AI background photo
          }),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `Composite failed (${res.status})`);
        }

        // Response is raw PNG bytes
        const blob = await res.blob();

        // Local preview (works on localhost, NOT usable by Buffer)
        const objectUrl = URL.createObjectURL(blob);
        setCompositePreviewUrl(objectUrl);

        // TODO: upload `blob` somewhere public (e.g. your own storage/S3/Cloudinary)
        // and set the real public URL here. Until that's wired up,
        // compositePublicUrl stays null and posting will fall back to draft.imageUrl.
        //
        // const form = new FormData();
        // form.append('file', blob, 'post.png');
        // const uploadRes = await fetch('/api/upload', { method: 'POST', body: form });
        // const { url } = await uploadRes.json();
        // setCompositePublicUrl(url);

      } catch (err) {
        console.error('Composite generation failed:', err);
        setCompositeError(err.message);
      } finally {
        setCompositing(false);
      }
    }

    generateComposite();
  }, [draft]);

  const handlePost = async () => {
    setPosting(true);
    try {
      // Use the composited public image if we have one, otherwise fall back
      // to the raw AI photo so posting still works while upload isn't wired up.
      const finalImageUrl = compositePublicUrl || draft.imageUrl;

      const res = await fetch('/api/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captions, imageUrl: finalImageUrl, platforms: draft.platforms, scheduleTime: scheduleTime || undefined }),
      });
      const data = await res.json();
      // Save to post history in localStorage for dashboard
      const history = JSON.parse(localStorage.getItem('postHistory') || '[]');
      const newEntry = {
        id: Date.now(),
        postedAt: new Date().toISOString(),
        serviceType: draft.serviceType,
        destination: draft.destination,
        price: `${draft.currency} ${draft.price}`,
        imageUrl: finalImageUrl,
        platforms: draft.platforms,
        captions,
        results: data.results || [],
        bufferIds: (data.results || []).filter(r => r.updateId).map(r => ({ platform: r.platform, id: r.updateId })),
        stats: {},
      };
      history.unshift(newEntry);
      localStorage.setItem('postHistory', JSON.stringify(history.slice(0, 100)));
      setResults({ postResults: data.results || [], entry: newEntry });
    } catch (err) {
      alert('Posting failed: ' + err.message);
    } finally {
      setPosting(false);
    }
  };

  const buildWhatsappMessage = () => {
    if (!draft) return '';
    const caption = captions['facebook'] || captions[draft.platforms[0]] || '';
    const lines = [
      `✈️ *${draft.serviceType?.toUpperCase()} DEAL*`,
      `📍 ${draft.destination}${draft.origin ? ` from ${draft.origin}` : ''}`,
      `💰 *${draft.currency} ${draft.price}*`,
      draft.startDate ? `📅 ${draft.startDate} → ${draft.endDate}` : '',
      '',
      caption.slice(0, 300),
      '',
      draft.imageUrl ? `🖼️ Image: ${draft.imageUrl}` : '',
      '',
      '_Posted via Travel Ad Studio_',
    ].filter(l => l !== null);
    return lines.join('\n');
  };

  const openWhatsapp = () => {
    const msg = encodeURIComponent(buildWhatsappMessage());
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const copyWhatsapp = async () => {
    await navigator.clipboard.writeText(buildWhatsappMessage());
    setWhatsappCopied(true);
    setTimeout(() => setWhatsappCopied(false), 2000);
  };

  if (!draft) return <div style={{ background: '#0F1117', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>Loading...</div>;

  if (results) {
    return (
      <main style={{ minHeight: '100vh', background: '#0F1117', color: '#F1F0EC', fontFamily: "'Inter',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 520, width: '100%', padding: 32 }}>
          <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>🎉</div>
          <h2 style={{ textAlign: 'center', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Posts queued!</h2>
          <p style={{ textAlign: 'center', color: '#6B7280', marginBottom: 24 }}>Submitted to Buffer successfully.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {results.postResults.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderRadius: 10, background: '#161822', border: '1px solid #1E2130' }}>
                <span style={{ fontWeight: 600 }}>{PLATFORM_LABELS[r.platform] || r.platform}</span>
                <span style={{ fontSize: 13, fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: r.status === 'queued' ? '#10B98120' : r.status === 'skipped' ? '#F59E0B20' : '#EF444420', color: r.status === 'queued' ? '#10B981' : r.status === 'skipped' ? '#F59E0B' : '#EF4444' }}>
                  {r.status === 'queued' ? '✓ Queued' : r.status === 'skipped' ? '⚠ Not connected' : '✗ Failed'}
                </span>
              </div>
            ))}
          </div>

          {/* WhatsApp share section */}
          <div style={{ background: '#0D2E1A', border: '1px solid #14532D', borderRadius: 12, padding: 18, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#4ADE80', marginBottom: 6 }}>📱 Share on WhatsApp</div>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>Send this deal to your WhatsApp contacts or groups.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={openWhatsapp} style={{ flex: 1, padding: '11px 0', borderRadius: 9, background: '#25D366', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
                Open WhatsApp
              </button>
              <button onClick={copyWhatsapp} style={{ flex: 1, padding: '11px 0', borderRadius: 9, background: whatsappCopied ? '#14532D' : '#161822', color: whatsappCopied ? '#4ADE80' : '#9CA3AF', fontWeight: 600, fontSize: 14, border: '1px solid #1E2130', cursor: 'pointer' }}>
                {whatsappCopied ? '✓ Copied!' : 'Copy message'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => router.push('/dashboard')} style={{ flex: 1, padding: 13, borderRadius: 10, background: '#161822', color: '#9CA3AF', fontWeight: 600, fontSize: 14, border: '1px solid #1E2130', cursor: 'pointer' }}>
              📊 View dashboard
            </button>
            <button onClick={() => { setResults(null); router.push('/'); }} style={{ flex: 1, padding: 13, borderRadius: 10, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
              + New post
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0F1117', color: '#F1F0EC', fontFamily: "'Inter',sans-serif" }}>
      <div style={{ borderBottom: '1px solid #1E2130', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: 14 }}>← Back</button>
          <span style={{ color: '#2D3748' }}>|</span>
          <span style={{ fontWeight: 600 }}>Review & approve</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#6B7280' }}>{draft.serviceType} → {draft.destination} · {draft.currency} {draft.price}</span>
          <button onClick={() => router.push('/dashboard')} style={{ padding: '7px 14px', borderRadius: 8, background: '#161822', border: '1px solid #1E2130', color: '#9CA3AF', fontSize: 13, cursor: 'pointer' }}>📊 Dashboard</button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Edit captions</h2>
          <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 20 }}>Edit any caption before posting.</p>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {draft.platforms.map(p => (
              <button key={p} onClick={() => setActiveTab(p)} style={{ padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${activeTab === p ? PLATFORM_COLORS[p] : '#1E2130'}`, background: activeTab === p ? PLATFORM_COLORS[p] + '18' : 'transparent', color: activeTab === p ? PLATFORM_COLORS[p] : '#6B7280', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>{PLATFORM_LABELS[p]}</button>
            ))}
          </div>
          {activeTab && (
            <div>
              <textarea value={captions[activeTab] || ''} onChange={e => setCaptions(c => ({ ...c, [activeTab]: e.target.value }))}
                style={{ width: '100%', minHeight: 180, padding: '14px 16px', borderRadius: 10, border: `1.5px solid ${PLATFORM_COLORS[activeTab]}40`, background: '#161822', color: '#F1F0EC', fontSize: 14, lineHeight: 1.6, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
              <div style={{ fontSize: 12, color: '#4B5563', textAlign: 'right', marginTop: 4 }}>{(captions[activeTab] || '').length} chars</div>
            </div>
          )}

          {/* WhatsApp preview panel */}
          <div style={{ marginTop: 20, background: '#0D1F14', border: '1px solid #14532D50', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#4ADE80' }}>📱 WhatsApp message preview</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={copyWhatsapp} style={{ padding: '5px 12px', borderRadius: 7, background: whatsappCopied ? '#14532D' : '#161822', border: '1px solid #1E3A2A', color: whatsappCopied ? '#4ADE80' : '#6B7280', fontSize: 12, cursor: 'pointer' }}>
                  {whatsappCopied ? '✓ Copied' : 'Copy'}
                </button>
                <button onClick={openWhatsapp} style={{ padding: '5px 12px', borderRadius: 7, background: '#25D366', border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Send ↗
                </button>
              </div>
            </div>
            <pre style={{ fontSize: 12, color: '#9CA3AF', background: '#0A1A10', borderRadius: 8, padding: '10px 12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, maxHeight: 140, overflow: 'auto', lineHeight: 1.6 }}>
              {buildWhatsappMessage()}
            </pre>
          </div>

          <div style={{ marginTop: 16, padding: 16, background: '#161822', border: '1px solid #1E2130', borderRadius: 10 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#9CA3AF', marginBottom: 8, fontWeight: 500 }}>📅 Schedule for later (optional)</label>
            <input type="datetime-local" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #1E2130', background: '#0F1117', color: '#F1F0EC', fontSize: 14, boxSizing: 'border-box' }} />
            <p style={{ fontSize: 12, color: '#4B5563', marginTop: 6 }}>Leave empty to add to Buffer queue now.</p>
          </div>

          {!compositePublicUrl && compositePreviewUrl && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#3F2D0B', border: '1px solid #7C5A1A', fontSize: 12, color: '#FBBF24' }}>
              ⚠ Preview only — this composited image isn't uploaded anywhere public yet, so posting will use the plain background photo until an upload step is wired up.
            </div>
          )}

          <button onClick={handlePost} disabled={posting} style={{ width: '100%', marginTop: 16, padding: '15px', borderRadius: 12, background: posting ? '#374151' : 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontWeight: 700, fontSize: 16, border: 'none', cursor: posting ? 'not-allowed' : 'pointer' }}>
            {posting ? '⏳ Posting to Buffer...' : `🚀 Approve & post to ${draft.platforms.length} platform${draft.platforms.length > 1 ? 's' : ''}`}
          </button>
        </div>

        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Generated image</h2>
          <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 16 }}>
            {compositing ? 'Adding your branding...' : compositeError ? 'Branding failed — showing raw photo' : 'Branded layout via your logo + template'}
          </p>
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #1E2130', aspectRatio: '1200/630', background: '#161822', position: 'relative' }}>
            {(!imageLoaded && !compositePreviewUrl) && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#4B5563' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🎨</div>
                <div style={{ fontSize: 13 }}>Generating image...</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>10–20 seconds</div>
              </div>
            )}
            {compositePreviewUrl ? (
              <img src={compositePreviewUrl} alt="Branded ad" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <img src={draft.imageUrl} alt="Generated ad" onLoad={() => setImageLoaded(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: imageLoaded ? 'block' : 'none' }} />
            )}
          </div>
          {compositeError && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#EF4444' }}>{compositeError}</div>
          )}
          {imageLoaded && !compositePreviewUrl && <a href={draft.imageUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', marginTop: 10, fontSize: 13, color: '#6366F1' }}>Open full size ↗</a>}

          <div style={{ marginTop: 20, padding: 16, background: '#161822', border: '1px solid #1E2130', borderRadius: 10 }}>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deal summary</div>
            <Row label="Service" value={draft.serviceType} />
            <Row label="Destination" value={draft.destination} />
            {draft.origin && <Row label="From" value={draft.origin} />}
            <Row label="Price" value={`${draft.currency} ${draft.price}`} highlight />
            {draft.startDate && <Row label="Dates" value={`${draft.startDate} → ${draft.endDate}`} />}
          </div>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, marginBottom: 8, borderBottom: '1px solid #1E2130' }}>
      <span style={{ fontSize: 13, color: '#6B7280' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: highlight ? 700 : 500, color: highlight ? '#818CF8' : '#F1F0EC' }}>{value}</span>
    </div>
  );
}
