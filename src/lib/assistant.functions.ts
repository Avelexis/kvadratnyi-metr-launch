import { createServerFn } from '@tanstack/react-start';

export const ELEVENLABS_AGENT_ID = 'agent_1701m52xk1jde2fbyhkrcvgez4hs';

// Server-side only: mints a short-lived WebRTC conversation token so the
// ElevenLabs API key never reaches the browser.
export const getAssistantToken = createServerFn({ method: 'POST' }).handler(async () => {
  const apiKey = process.env['ELEVENLABS_API_KEY'];
  if (!apiKey) throw new Error('ElevenLabs is not connected to this project');
  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${ELEVENLABS_AGENT_ID}`,
    { headers: { 'xi-api-key': apiKey } },
  );
  if (!response.ok) {
    const body = await response.text();
    console.error(`ElevenLabs token request failed [${response.status}]: ${body}`);
    throw new Error(`Assistant connection failed [${response.status}]`);
  }
  const data = (await response.json()) as { token?: string };
  if (!data.token) throw new Error('No conversation token received');
  return { token: data.token };
});
