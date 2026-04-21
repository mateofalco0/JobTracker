const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`

async function callGemini(prompt: string): Promise<string> {
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  })

  if (!response.ok) {
    throw Object.assign(new Error(`Gemini API error: ${response.status}`), { status: response.status })
  }

  const data = await response.json()
  return data.candidates[0].content.parts[0].text
}

function extractJson(raw: string): string {
  return raw.replace(/```json\n?|\n?```/g, '').trim()
}

export async function generateWithRetry(prompt: string): Promise<string> {
  try {
    return extractJson(await callGemini(prompt))
  } catch (err) {
    const status = (err as { status?: number }).status
    if (status === 429) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      return extractJson(await callGemini(prompt))
    }
    throw err
  }
}
