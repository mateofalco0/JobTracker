import { NextResponse } from 'next/server'
import { generateWithRetry } from '@/lib/gemini'

export async function POST(request: Request) {
  try {
    const { company, role } = await request.json()
    if (!company?.trim() || !role?.trim()) {
      return NextResponse.json({ error: 'Company and role are required' }, { status: 400 })
    }

    const prompt = `Give me 5 specific, actionable tips to improve my chances of getting the "${role}" position at ${company}. Return a JSON object with a "tips" array containing exactly 5 tip strings.`

    const text = await generateWithRetry(prompt)
    const parsed = JSON.parse(text)

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('[tips] error:', err)
    return NextResponse.json({ error: 'Failed to generate tips. Please try again.' }, { status: 500 })
  }
}
