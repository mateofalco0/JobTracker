import { NextResponse } from 'next/server'
import { generateWithRetry } from '@/lib/gemini'

export async function POST(request: Request) {
  try {
    const { description } = await request.json()
    if (!description?.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    }

    const prompt = `Extract the following information from this job description and return a JSON object with these fields:
- company: the company name
- role: the exact job title
- notes: a 2-3 sentence summary of the role and key requirements

Job description:
${description}`

    const text = await generateWithRetry(prompt)
    const parsed = JSON.parse(text)

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('[parse-job] error:', err)
    return NextResponse.json({ error: 'Failed to parse job description. Please try again.' }, { status: 500 })
  }
}
