'use client';

export const dynamic = 'force-dynamic';


import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Plus, Search, Edit, Trash2, Eye, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  view_count: number;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export default function WikiAdminPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadArticles();
  }, [selectedStatus, selectedCategory]);

  const loadArticles = async () => {
    let query = supabase
      .from('knowledge_base_articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (selectedStatus !== 'all') {
      query = query.eq('status', selectedStatus);
    }

    if (selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory);
    }

    if (searchQuery) {
      query = query.textSearch('search_vector', searchQuery);
    }

    const { data } = await query;
    if (data) {
      setArticles(data);
    }
  };

  const handlePublish = async (articleId: string) => {
    await supabase
      .from('knowledge_base_articles')
      .update({
        status: 'published',
        published_at: new Date().toISOString()
      })
      .eq('id', articleId);

    loadArticles();
  };

  const handleDelete = async (articleId: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
      await supabase
        .from('knowledge_base_articles')
        .delete()
        .eq('id', articleId);

      loadArticles();
    }
  };

  const handleSyncMarkdown = async () => {
    // Call API to sync markdown files
    const response = await fetch('/api/admin/wiki/sync-markdown', {
      method: 'POST'
    });

    if (response.ok) {
      alert('Markdown files synced successfully!');
      loadArticles();
    } else {
      alert('Failed to sync markdown files');
    }
  };

  const draftCount = articles.filter(a => a.status === 'draft').length;
  const publishedCount = articles.filter(a => a.status === 'published').length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Wiki Admin</h1>
        <p className="text-muted-foreground">
          Manage wiki articles, review drafts, and sync content
        </p>
      </div>

      <div className="mb-6 flex gap-4">
        <Button onClick={() => window.location.href = '/admin/wiki/new'}>
          <Plus className="w-4 h-4 mr-2" />
          New Article
        </Button>
        <Button variant="outline" onClick={handleSyncMarkdown}>
          Sync Markdown Files
        </Button>
      </div>

      <Tabs defaultValue="articles" className="mb-6">
        <TabsList>
          <TabsTrigger value="articles">
            Articles ({articles.length})
          </TabsTrigger>
          <TabsTrigger value="drafts">
            Drafts ({draftCount})
          </TabsTrigger>
          <TabsTrigger value="published">
            Published ({publishedCount})
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border rounded"
            >
              <option value="all">All Categories</option>
              <option value="getting-started">Getting Started</option>
              <option value="meal-planning">Meal Planning</option>
              <option value="pantry">Pantry</option>
              <option value="recipes">Recipes</option>
            </select>
          </div>

          <div className="space-y-4">
            {articles.map((article) => (
              <Card key={article.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="mb-2">{article.title}</CardTitle>
                      <div className="flex gap-2 items-center">
                        <Badge variant="secondary">{article.category}</Badge>
                        <Badge variant={article.status === 'published' ? 'default' : 'outline'}>
                          {article.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          👁️ {article.view_count} • 👍 {article.helpful_count}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.location.href = `/wiki/article/${article.slug}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.location.href = `/admin/wiki/edit/${article.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {article.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePublish(article.id)}
                        >
                          <Check className="w-4 h-4 text-green-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(article.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Created: {new Date(article.created_at).toLocaleDateString()}
                    {article.updated_at && (
                      <> • Updated: {new Date(article.updated_at).toLocaleDateString()}</>
                    )}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Tabs>
    </div>
  );
}
