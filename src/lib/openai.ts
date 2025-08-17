import { openai, CHAT_MODEL } from './ai/clients';
import { SYSTEM_SOCRATIC, SYSTEM_STUDY, FLASHCARD_INSTRUCTIONS } from './ai/prompts';

export default openai;

// Helper function to generate Socratic questions
export async function generateSocraticQuestion(userText: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        {
          role: "system",
          content: SYSTEM_SOCRATIC
        },
        {
          role: "user",
          content: userText
        }
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || "What makes you think that way?";
  } catch (error) {
    console.error('OpenAI API error:', error);
    return "What assumptions are you making here?";
  }
}

// Helper function to generate study assistance
export async function generateStudyResponse(userQuestion: string, context: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        {
          role: "system",
          content: SYSTEM_STUDY
        },
        {
          role: "user",
          content: `Context: ${context}\n\nQuestion: ${userQuestion}`
        }
      ],
      max_tokens: 150,
      temperature: 0.5,
    });

    return completion.choices[0]?.message?.content || "I'd be happy to help you with that question. What specific aspect would you like me to clarify?";
  } catch (error) {
    console.error('OpenAI API error:', error);
    return "I'd be happy to help you with that question. What specific aspect would you like me to clarify?";
  }
}

// Helper function to generate flashcards from content
export async function generateFlashcards(content: string): Promise<{ q: string; a: string }[]> {
  try {
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        {
          role: "system",
          content: FLASHCARD_INSTRUCTIONS
        },
        {
          role: "user",
          content: content
        }
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const response = completion.choices[0]?.message?.content || "";
    
    // Parse the response to extract Q&A pairs
    const flashcards: { q: string; a: string }[] = [];
    const lines = response.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('Q:')) {
        const question = lines[i].substring(2).trim();
        const answer = lines[i + 1]?.startsWith('A:') ? lines[i + 1].substring(2).trim() : '';
        if (question && answer) {
          flashcards.push({ q: question, a: answer });
        }
      }
    }

    // Fallback if parsing fails
    if (flashcards.length === 0) {
      return [
        { q: "What is the main topic discussed in this content?", a: "The main topic is the content you provided for analysis." },
        { q: "What are the key points mentioned?", a: "The key points would be extracted from your content for study purposes." },
        { q: "How does this connect to what you already know?", a: "This connects to your existing knowledge in several ways." }
      ];
    }

    return flashcards;
  } catch (error) {
    console.error('OpenAI API error:', error);
    return [
      { q: "What is the main topic discussed in this content?", a: "The main topic is the content you provided for analysis." },
      { q: "What are the key points mentioned?", a: "The key points would be extracted from your content for study purposes." }
    ];
  }
}

