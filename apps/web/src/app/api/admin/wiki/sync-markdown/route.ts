import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user?.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get all markdown files from docs/wiki
    const wikiDir = path.join(process.cwd(), 'docs/wiki');
    
    if (!fs.existsSync(wikiDir)) {
      return NextResponse.json(
        { error: 'Wiki directory not found' },
        { status: 404 }
      );
    }

    const files: string[] = [];
    
    function walkDir(dir: string, basePath: string = '') {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(basePath, entry.name);
        
        if (entry.isDirectory()) {
          walkDir(fullPath, relativePath);
        } else if (entry.name.endsWith('.md')) {
          files.push(relativePath);
        }
      }
    }

    walkDir(wikiDir);

    // Sync each file
    const results = [];
    for (const file of files) {
      try {
        const filePath = path.join(wikiDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        const article = await wikiAutoUpdate.syncFromMarkdown(
          file,
          content,
          {
            category: extractCategoryFromPath(file),
            source: 'markdown_sync'
          }
        );

        if (article) {
          results.push({
            file,
            status: 'success',
            article_id: article.id
          });
        }
      } catch (error) {
        results.push({
          file,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      files_processed: files.length,
      results
    });
  } catch (error) {
    logger.error('Sync markdown error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Failed to sync markdown files' },
      { status: 500 }
    );
  }
}

function extractCategoryFromPath(filePath: string): string {
  const parts = filePath.split(path.sep);
  // Remove filename and get parent directory
  if (parts.length > 1) {
    return parts[parts.length - 2];
  }
  return 'general';
}

export const dynamic = "force-dynamic";
