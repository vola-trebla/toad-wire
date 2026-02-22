import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=10`);
    const data = await response.json();

    const messages = data.result
      ?.filter((u: any) => u.channel_post?.chat?.username === channelId?.replace('@', ''))
      .map((u: any) => u.channel_post);

    const last = messages?.at(-1);

    if (!last) {
      return res.status(404).json({ error: 'No posts found' });
    }

    return res.json({
      text: last.text,
      date: last.date,
    });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch' });
  }
}
