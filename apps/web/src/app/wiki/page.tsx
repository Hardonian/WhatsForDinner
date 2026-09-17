'use client';


import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Search, BookOpen, MessageCircle, HelpCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  view_count: number;
  helpful_count: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
}

export default function WikiPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Article[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showChatBot, setShowChatBot] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadCategories();
    loadPopularArticles();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('knowledge_base_categories')
      .select('*')
      .order('order_index');
    
    if (data) {
      setCategories(data);
    }
  };

  const loadPopularArticles = async () => {
    const { data } = await supabase
      .from('knowledge_base_articles')
      .select('id, title, slug, excerpt, category, tags, view_count, helpful_count')
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(6);
    
    if (data) {
      setArticles(data);
    }
  };

  const performSearch = async (query: string) => {
    setIsSearching(true);
    
    // Track search query
    await supabase.from('search_queries').insert({
      query,
      session_id: typeof window !== 'undefined' ? localStorage.getItem('session_id') || 'anonymous' : 'anonymous'
    });

    // Full-text search
    const { data } = await supabase
      .from('knowledge_base_articles')
      .select('id, title, slug, excerpt, category, tags, view_count, helpful_count')
      .eq('status', 'published')
      .textSearch('search_vector', query)
      .limit(20);

    if (data) {
      setSearchResults(data);
    }
    
    setIsSearching(false);
  };

  const handleArticleClick = async (articleId: string) => {
    // Track view
    await supabase.from('article_views').insert({
      article_id: articleId,
      session_id: typeof window !== 'undefined' ? localStorage.getItem('session_id') || 'anonymous' : 'anonymous'
    });

    // Increment view count
    await supabase.rpc('increment_article_views', { article_id: articleId });
  };

  const displayArticles = searchQuery.trim() ? searchResults : articles;
  const hasResults = displayArticles.length > 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 flex items-center gap-2">
          <BookOpen className="w-10 h-10" />
          Help Center & Wiki
        </h1>
        <p className="text-muted-foreground text-lg">
          Find answers, learn features, and get the most out of What's for Dinner
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            type="text"
            placeholder="Search for help articles, features, or questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-6 text-lg"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowChatBot(true)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Ask AI Assistant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Get instant answers from our AI chat bot
            </p>
          </CardContent>
        </Card>
        <Link href="/wiki/getting-started">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                New to What's for Dinner? Start here
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/support">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Contact Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Need human help? Contact our support team
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Categories */}
      {!searchQuery.trim() && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Browse by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/wiki/category/${category.slug}`}
                className="block"
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{category.icon}</span>
                      {category.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">{category.description}</p>
                    <div className="mt-4 flex items-center text-primary">
                      <span className="text-sm">Explore</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Search Results or Popular Articles */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">
          {searchQuery.trim() ? `Search Results (${searchResults.length})` : 'Popular Articles'}
        </h2>
        
        {!hasResults && searchQuery.trim() && !isSearching && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">
                No articles found for "{searchQuery}". Try different keywords or ask the AI assistant.
              </p>
              <Button onClick={() => setShowChatBot(true)}>
                Ask AI Assistant
              </Button>
            </CardContent>
          </Card>
        )}

        {hasResults && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayArticles.map((article) => (
              <Link
                key={article.id}
                href={`/wiki/article/${article.slug}`}
                onClick={() => handleArticleClick(article.id)}
                className="block"
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary">{article.category}</Badge>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>👁️ {article.view_count}</span>
                        <span>👍 {article.helpful_count}</span>
                      </div>
                    </div>
                    <CardTitle className="text-xl">{article.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-3">{article.excerpt}</p>
                    <div className="flex flex-wrap gap-2">
                      {article.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Chat Bot (would be a separate component) */}
      {showChatBot && (
        <div className="fixed bottom-4 right-4 z-50">
          {/* Chat bot component will be rendered here */}
          <Card className="w-96 h-96 shadow-2xl">
            <CardHeader>
              <CardTitle>AI Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Chat bot interface coming soon...</p>
              <Button onClick={() => setShowChatBot(false)} className="mt-4">
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
