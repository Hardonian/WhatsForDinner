import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { message, conversation_id, context } = await request.json();

    // Get user
    const { data: { user } } = await supabase.auth.getUser();

    // Search knowledge base for relevant articles
    const { data: articles } = await supabase
      .from('knowledge_base_articles')
      .select('id, title, slug, content, excerpt, category')
      .eq('status', 'published')
      .textSearch('search_vector', message)
      .limit(5);

    // Build context from articles
    const contextText = articles
      ?.map((article) => `Title: ${article.title}\nContent: ${article.excerpt}\nCategory: ${article.category}`)
      .join('\n\n') || '';

    // Get conversation history
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(10);

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are a helpful assistant for "What's for Dinner", a meal planning app. 
        
Use the following knowledge base articles to answer questions:
${contextText}

Guidelines:
- Be friendly, helpful, and concise
- Reference specific articles when relevant
- If you don't know something, say so and suggest contacting support
- Focus on meal planning, recipes, pantry management, and app features
- Provide step-by-step instructions when helpful`
      },
      ...(history?.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })) || []),
      {
        role: 'user',
        content: message
      }
    ];

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: 0.7,
      max_tokens: 500
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Extract article IDs for sources
    const articleIds = articles?.map(a => a.id) || [];
    const sources = articles?.map(a => ({
      title: a.title,
      slug: a.slug
    })) || [];

    // If no relevant articles found, try to learn from this interaction
    if (articles?.length === 0) {
      // Log this query for potential knowledge base expansion
      await supabase.from('knowledge_base_updates').insert({
        update_type: 'chat_learned',
        source: 'chat_bot',
        changes: {
          query: message,
          response: response,
          user_id: user?.id
        }
      });
    }

    return NextResponse.json({
      response,
      article_ids: articleIds,
      sources
    });
  } catch (error) {
    logger.error('Chat API error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
