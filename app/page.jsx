'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const SERVICE_TYPES = [
  { value: 'flight', label: '✈️ Flight Deal', color: '#0EA5E9' },
  { value: 'visa', label: '🛂 Visa Service', color: '#8B5CF6' },
  { value: 'holiday', label: '🏖️ Holiday Package', color: '#F59E0B' },
  { value: 'insurance', label: '🛡️ Travel Insurance', color: '#10B981' },
];

const PLATFORMS = [
  { value: 'facebook', label: 'Facebook', icon: 'f' },
  { value: 'instagram', label: 'Instagram', icon: '📷' },
  { value: 'twitter', label: 'Twitter / X', icon: '𝕏' },
  { value: 'tiktok', label: 'TikTok', icon: '♪' },
];

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [platforms, setPlatforms] = useState(['facebook', 'instagram', 'twitter', 'tiktok']);
  const [form, setForm] = useState({
    destination: '',
    origin: '',
    price: '',
    currency: 'AED',
    startDate: '',
    endDate: '',
    highlights: '',
    urgency: 'normal',
    language: 'english',
  });

  const togglePlatform = (val) => {
    setPlatforms(p => p.includes(val) ? p.filter(x => x !== val) : [...p, val]);
  };

  const handleSubmit = async () => {
    if (!selectedService || !form.destination || !form.price) {
      alert('Please fill in service type, destination, and price.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceType: selectedService, platforms, ...form }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      localStorage.setItem('postDraft', JSON.stringify({ ...data, platforms, serviceType: selectedService, ...form }));
      router.push('/preview');
    } catch (err) {
      alert('Generation failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', background: '#0F1117', color: '#F1F0EC', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #1E2130', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✈</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>Travel Ad Studio</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>AI-powered social media posts</div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Create a new ad</h1>
        <p style={{ color: '#6B7280', marginBottom: 32, fontSize: 15 }}>Fill in the deal details — AI will write the copy and generate the image.</p>

        {/* Service type selector */}
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#9CA3AF', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Service type</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
          {SERVICE_TYPES.map(s => (
            <button key={s.value} onClick={() => setSelectedService(s.value)} style={{
              padding: '14px 16px', borderRadius: 10, border: `2px solid ${selectedService === s.value ? s.color : '#1E2130'}`,
              background: selectedService === s.value ? s.color + '18' : '#161822',
              color: selectedService === s.value ? s.color : '#9CA3AF',
              fontWeight: 600, fontSize: 15, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s'
            }}>{s.label}</button>
          ))}
        </div>

        {/* Deal details */}
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#9CA3AF', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deal details</label>
        <div style={{ background: '#161822', border: '1px solid #1E2130', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Destination" placeholder="e.g. Bali, Indonesia" value={form.destination} onChange={v => setForm(f => ({...f, destination: v}))} />
            <Field label="Origin / Route" placeholder="e.g. Dubai (DXB)" value={form.origin} onChange={v => setForm(f => ({...f, origin: v}))} />
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <Field label="Price" placeholder="999" value={form.price} onChange={v => setForm(f => ({...f, price: v}))} type="number" />
              </div>
              <div style={{ width: 90, marginTop: 0 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 6 }}>Currency</label>
                <select value={form.currency} onChange={e => setForm(f => ({...f, currency: e.target.value}))} style={selectStyle}>
                  <option>AED</option><option>USD</option><option>EUR</option><option>GBP</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="From date" value={form.startDate} onChange={v => setForm(f => ({...f, startDate: v}))} type="date" />
              <Field label="To date" value={form.endDate} onChange={v => setForm(f => ({...f, endDate: v}))} type="date" />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 6 }}>Highlights / special notes</label>
            <textarea value={form.highlights} onChange={e => setForm(f => ({...f, highlights: e.target.value}))}
              placeholder="e.g. Includes hotel, visa on arrival, direct flight, limited seats..."
              style={{ ...inputStyle, height: 72, resize: 'vertical' }} />
          </div>
        </div>

        {/* Options row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 6 }}>Urgency tone</label>
            <select value={form.urgency} onChange={e => setForm(f => ({...f, urgency: e.target.value}))} style={selectStyle}>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent — limited seats!</option>
              <option value="flash">Flash sale — today only!</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 6 }}>Language</label>
            <select value={form.language} onChange={e => setForm(f => ({...f, language: e.target.value}))} style={selectStyle}>
              <option value="english">English</option>
              <option value="arabic">Arabic</option>
              <option value="both">Both (English + Arabic)</option>
            </select>
          </div>
        </div>

        {/* Platform selector */}
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#9CA3AF', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Post to</label>
        <div style={{ display: 'flex', gap: 10, marginBottom: 36, flexWrap: 'wrap' }}>
          {PLATFORMS.map(p => (
            <button key={p.value} onClick={() => togglePlatform(p.value)} style={{
              padding: '10px 18px', borderRadius: 8,
              border: `1.5px solid ${platforms.includes(p.value) ? '#6366F1' : '#1E2130'}`,
              background: platforms.includes(p.value) ? '#6366F115' : '#161822',
              color: platforms.includes(p.value) ? '#818CF8' : '#6B7280',
              fontWeight: 500, fontSize: 14, cursor: 'pointer', transition: 'all 0.15s'
            }}>{p.label}</button>
          ))}
        </div>

        {/* Generate button */}
        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', padding: '16px', borderRadius: 12,
          background: loading ? '#374151' : 'linear-gradient(135deg,#6366F1,#8B5CF6)',
          color: '#fff', fontWeight: 700, fontSize: 16, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'opacity 0.2s', letterSpacing: '0.01em'
        }}>
          {loading ? '⏳ Generating your post...' : '✨ Generate post'}
        </button>
        <p style={{ textAlign: 'center', color: '#374151', fontSize: 13, marginTop: 12 }}>You'll preview and approve before anything is posted.</p>
      </div>
    </main>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #1E2130',
  background: '#0F1117', color: '#F1F0EC', fontSize: 14, boxSizing: 'border-box', outline: 'none'
};
const selectStyle = { ...inputStyle, cursor: 'pointer' };

function Field({ label, placeholder, value, onChange, type = 'text' }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 6 }}>{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} style={inputStyle} />
    </div>
  );
}
