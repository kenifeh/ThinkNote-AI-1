import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function transcribeAudio(audioBuffer: Buffer | Uint8Array): Promise<string> {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: new Blob([audioBuffer as any], { type: 'audio/webm' }),
      model: 'whisper-1',
      language: 'en',
    })
    
    return transcription.text
  } catch (error) {
    console.error('OpenAI transcription error:', error)
    throw new Error('Failed to transcribe audio')
  }
}

export async function generateSummary(transcript: string, type: 'academic' | 'bullet_points' | 'key_concepts' = 'academic'): Promise<string> {
  try {
    const prompt = type === 'academic' 
      ? `Create an academic summary of the following transcript, highlighting key concepts, main arguments, and important details:\n\n${transcript}`
      : type === 'bullet_points'
      ? `Create a bullet-point summary of the following transcript with key takeaways:\n\n${transcript}`
      : `Extract the key concepts from the following transcript:\n\n${transcript}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert academic assistant. Provide clear, concise summaries that help students understand and retain information.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.3,
    })

    return completion.choices[0]?.message?.content || 'Failed to generate summary'
  } catch (error) {
    console.error('OpenAI summary generation error:', error)
    throw new Error('Failed to generate summary')
  }
}

export async function generateStudyQuestions(transcript: string, mode: 'socratic' | 'study' = 'socratic'): Promise<string> {
  try {
    const prompt = mode === 'socratic'
      ? `Generate 3-5 Socratic questions based on this transcript that will help explore the concepts more deeply:\n\n${transcript}`
      : `Generate 3-5 study questions based on this transcript that will help test understanding:\n\n${transcript}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educator. Generate thoughtful questions that promote learning and critical thinking.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.4,
    })

    return completion.choices[0]?.message?.content || 'Failed to generate questions'
  } catch (error) {
    console.error('OpenAI question generation error:', error)
    throw new Error('Failed to generate study questions')
  }
}

export default openai
