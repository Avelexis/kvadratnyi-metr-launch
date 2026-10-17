import { createServerFn } from '@tanstack/react-start';

export const ELEVENLABS_AGENT_ID = 'agent_1701m52xk1jde2fbyhkrcvgez4hs';

// Server-side only: mints short-lived conversation credentials so the
// ElevenLabs API key never reaches the browser. Returns a WebRTC token and
// a WebSocket signed URL so the client can fall back when WebRTC media is
// blocked by the visitor's network.
export const getAssistantCredentials = createServerFn({ method: 'POST' }).handler(async () => {
  const apiKey = process.env['ELEVENLABS_API_KEY'];
  if (!apiKey) throw new Error('ElevenLabs is not connected to this project');
  const headers = { 'xi-api-key': apiKey };
  const [tokenRes, signedRes] = await Promise.all([
    fetch(`https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${ELEVENLABS_AGENT_ID}`, { headers }),
    fetch(`https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${ELEVENLABS_AGENT_ID}`, { headers }),
  ]);
  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    console.error(`ElevenLabs token request failed [${tokenRes.status}]: ${body}`);
    throw new Error(`Assistant connection failed [${tokenRes.status}]`);
  }
  const tokenData = (await tokenRes.json()) as { token?: string };
  if (!tokenData.token) throw new Error('No conversation token received');
  let signedUrl: string | null = null;
  if (signedRes.ok) {
    const signedData = (await signedRes.json()) as { signed_url?: string };
    signedUrl = signedData.signed_url ?? null;
  } else {
    console.error(`ElevenLabs signed-url request failed [${signedRes.status}]: ${await signedRes.text()}`);
  }
  return { token: tokenData.token, signedUrl };
});
