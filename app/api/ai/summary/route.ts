import { NextResponse } from 'next/server'
import { generateWithRetry } from '@/lib/gemini'

export async function POST(request: Request) {
  try {
    const { jobs } = await request.json()
    if (!jobs?.length) {
      return NextResponse.json({ error: 'No jobs data provided' }, { status: 400 })
    }

    const jobsList = jobs
      .map((j: { role: string; company: string; status: string }) => `- ${j.role} at ${j.company} (${j.status})`)
      .join('\n')

    const prompt = `Analyze this job search and provide helpful, encouraging feedback. Return a JSON object with these fields:
- assessment: 2-3 sentence overall assessment
- goingWell: 2-3 sentences on what is going well
- improve: 2-3 sentences on what could be improved
- nextSteps: array of exactly 3 actionable next step strings

Job applications:
${jobsList}`

    const text = await generateWithRetry(prompt)
    const parsed = JSON.parse(text)

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('[summary] error:', err)
    return NextResponse.json({ error: 'Failed to generate summary. Please try again.' }, { status: 500 })
  }
}
