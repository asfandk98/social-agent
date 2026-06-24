// app/api/analytics/route.js
// Fetches post stats from Buffer API (free)
// Buffer returns: reach, clicks, likes, comments, shares per post

export async function POST(req) {
  try {
    const { bufferIds } = await req.json(); // [{ platform, id }]

    const BUFFER_TOKEN = process.env.BUFFER_ACCESS_TOKEN;
    if (!BUFFER_TOKEN) {
      return Response.json({ error: 'BUFFER_ACCESS_TOKEN not set' }, { status: 500 });
    }

    const stats = {};

    for (const { platform, id } of bufferIds) {
      try {
        const res = await fetch(`https://api.bufferapp.com/1/updates/${id}.json`, {
          headers: { Authorization: `Bearer ${BUFFER_TOKEN}` }
        });
        const data = await res.json();

        if (data.statistics) {
          stats[platform] = {
            reach: data.statistics.reach || 0,
            clicks: data.statistics.clicks || 0,
            likes: data.statistics.likes || 0,
            comments: data.statistics.comments || 0,
            shares: data.statistics.shares || 0,
            impressions: data.statistics.impressions || data.statistics.reach || 0,
          };
        } else {
          // Buffer doesn't always return stats for recent posts
          stats[platform] = { reach: 0, clicks: 0, likes: 0, comments: 0, shares: 0, impressions: 0, pending: true };
        }
      } catch {
        stats[platform] = { reach: 0, clicks: 0, likes: 0, comments: 0, shares: 0, impressions: 0, error: true };
      }
    }

    return Response.json({ stats });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
