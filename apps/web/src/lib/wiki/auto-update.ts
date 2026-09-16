import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('auto-update');

/**
 * Auto-Update System for Wiki Knowledge Base
 * 
 * This system automatically updates the wiki when:
 * - New features are released
 * - Chat bot learns new information
 * - Users contribute content
 * - Content needs to be synced
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface AutoUpdateConfig {
  featureName: string;
  featureDescription: string;
  category: string;
  tags: string[];
  content: string;
  screenshots?: string[];
}

export class WikiAutoUpdate {
  private supabase;

  constructor() {
    this.supabase = createClientComponentClient();
  }

  /**
   * Auto-generate wiki article from feature release
   */
  async generateFromFeature(config: AutoUpdateConfig) {
    const slug = this.generateSlug(config.featureName);
    
    // Check if article already exists
    const { data: existing } = await this.supabase
      .from('knowledge_base_articles')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      // Update existing article
      return this.updateArticle(existing.id, config);
    }

    // Create new article
    const { data: article, error } = await this.supabase
      .from('knowledge_base_articles')
      .insert({
        title: config.featureName,
        slug,
        content: config.content,
        excerpt: this.generateExcerpt(config.content),
        category: config.category,
        tags: config.tags,
        status: 'draft', // Requires review before publishing
        metadata: {
          screenshots: config.screenshots || [],
          auto_generated: true,
          source: 'feature_release'
        }
      })
      .select()
      .single();

    if (error) {
      _logger.error('Error creating article:', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }

    // Log the update
    await this.supabase.from('knowledge_base_updates').insert({
      update_type: 'feature_added',
      article_id: article.id,
      source: 'feature_release',
      changes: {
        feature: config.featureName,
        category: config.category
      }
    });

    return article;
  }

  /**
   * Learn from chat bot interaction
   */
  async learnFromChat(query: string, response: string, articleIds: string[]) {
    // If no articles found but we provided a good answer, suggest creating one
    if (articleIds.length === 0 && response.length > 50) {
      // Log for human review
      await this.supabase.from('knowledge_base_updates').insert({
        update_type: 'chat_learned',
        source: 'chat_bot',
        changes: {
          query,
          response,
          suggested_article: true
        }
      });
    }
  }

  /**
   * Sync content from markdown files
   */
  async syncFromMarkdown(filePath: string, content: string, metadata: any) {
    const slug = this.extractSlugFromPath(filePath);
    
    // Parse markdown frontmatter if present
    const frontmatter = this.parseFrontmatter(content);
    const body = this.extractBody(content);

    const { data: existing } = await this.supabase
      .from('knowledge_base_articles')
      .select('id, version')
      .eq('slug', slug)
      .single();

    const articleData = {
      title: frontmatter.title || metadata.title || this.extractTitle(body),
      slug,
      content: body,
      excerpt: frontmatter.excerpt || this.generateExcerpt(body),
      category: frontmatter.category || metadata.category || 'general',
      tags: frontmatter.tags || metadata.tags || [],
      status: frontmatter.status || 'published',
      metadata: {
        ...frontmatter,
        ...metadata,
        file_path: filePath,
        last_synced: new Date().toISOString()
      }
    };

    if (existing) {
      // Update existing - increment version
      const { data: updated } = await this.supabase
        .from('knowledge_base_articles')
        .update({
          ...articleData,
          version: existing.version + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      await this.supabase.from('knowledge_base_updates').insert({
        update_type: 'auto_sync',
        article_id: existing.id,
        source: 'markdown_sync',
        changes: {
          version: existing.version + 1,
          file_path: filePath
        }
      });

      return updated;
    } else {
      // Create new
      const { data: created } = await this.supabase
        .from('knowledge_base_articles')
        .insert(articleData)
        .select()
        .single();

      await this.supabase.from('knowledge_base_updates').insert({
        update_type: 'auto_sync',
        article_id: created?.id,
        source: 'markdown_sync',
        changes: {
          file_path: filePath,
          created: true
        }
      });

      return created;
    }
  }

  /**
   * Generate embeddings for article (for semantic search)
   */
  async generateEmbedding(articleId: string) {
    const { data: article } = await this.supabase
      .from('knowledge_base_articles')
      .select('title, excerpt, content')
      .eq('id', articleId)
      .single();

    if (!article) return;

    // Call OpenAI to generate embedding
    const text = `${article.title}\n${article.excerpt}\n${article.content.substring(0, 2000)}`;
    
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text
      })
    });

    const data = await response.json();
    const embedding = data.data[0]?.embedding;

    if (embedding) {
      await this.supabase
        .from('knowledge_base_articles')
        .update({ embedding })
        .eq('id', articleId);
    }
  }

  // Helper methods
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private generateExcerpt(content: string, maxLength: number = 200): string {
    const plainText = content.replace(/[#*`]/g, '').replace(/\n/g, ' ').trim();
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength).trim() + '...';
  }

  private extractTitle(content: string): string {
    const match = content.match(/^#\s+(.+)$/m);
    return match ? match[1] : 'Untitled';
  }

  private extractSlugFromPath(path: string): string {
    const filename = path.split('/').pop() || '';
    return filename.replace(/\.(md|markdown)$/, '').toLowerCase();
  }

  private parseFrontmatter(content: string): unknown {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return {};

    const frontmatter = match[1];
    const parsed: any = {};

    frontmatter.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length) {
        const value = valueParts.join(':').trim();
        if (key === 'tags') {
          parsed[key] = value.split(',').map(t => t.trim());
        } else {
          parsed[key.trim()] = value;
        }
      }
    });

    return parsed;
  }

  private extractBody(content: string): string {
    const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
    return match ? match[1] : content;
  }

  private async updateArticle(articleId: string, config: AutoUpdateConfig) {
    const { data: article } = await this.supabase
      .from('knowledge_base_articles')
      .select('version')
      .eq('id', articleId)
      .single();

    const { data: updated } = await this.supabase
      .from('knowledge_base_articles')
      .update({
        content: config.content,
        excerpt: this.generateExcerpt(config.content),
        tags: config.tags,
        version: (article?.version || 0) + 1,
        metadata: {
          screenshots: config.screenshots || [],
          auto_generated: true,
          source: 'feature_release',
          last_updated: new Date().toISOString()
        }
      })
      .eq('id', articleId)
      .select()
      .single();

    await this.supabase.from('knowledge_base_updates').insert({
      update_type: 'feature_added',
      article_id: articleId,
      source: 'feature_release',
      changes: {
        feature: config.featureName,
        version: article?.version || 0
      }
    });

    return updated;
  }
}

// Export singleton instance
export const wikiAutoUpdate = new WikiAutoUpdate();
