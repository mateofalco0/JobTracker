import { NextResponse } from 'next/server'
import { generateWithRetry } from '@/lib/gemini'

export async function POST(request: Request) {
  try {
    const { company, role } = await request.json()
    if (!company?.trim() || !role?.trim()) {
      return NextResponse.json({ error: 'Company and role are required' }, { status: 400 })
    }

    const prompt = `Generate 8 likely interview questions for a "${role}" position at ${company}, with a brief answer tip for each. Return a JSON object with a "questions" array where each element has a "question" string and a "hint" string.`

    const text = await generateWithRetry(prompt)
    const parsed = JSON.parse(text)

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('[interview-prep] error:', err)
    return NextResponse.json({ error: 'Failed to generate interview prep. Please try again.' }, { status: 500 })
  }
}
