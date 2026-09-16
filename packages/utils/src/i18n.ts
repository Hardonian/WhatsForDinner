// @ts-nocheck
/**
 * Internationalization helper
 */

const fs = typeof window === 'undefined' ? require('fs') : null;
const path = typeof window === 'undefined' ? require('path') : null;

export interface MessageKey {
  key: string;
  defaultValue: string;
}

export function extractMessages(sourceDir: string): MessageKey[] {
  const messages: MessageKey[] = [];
  const files = getAllFiles(sourceDir);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const tMatches = content.match(/t\(['"`]([^'"`]+)['"`]\)/g);
    if (tMatches) {
      tMatches.forEach((match) => {
        const key = match.replace(/t\(['"`]/, '').replace(/['"`]\)/, '');
        if (!messages.find((m) => m.key === key)) {
          messages.push({ key, defaultValue: key });
        }
      });
    }
  }

  return messages;
}

export function generateLanguagePacks(messages: MessageKey[], languages: string[] = ['en', 'es', 'fr']) {
  const packsDir = path.join(process.cwd(), 'ops', 'i18n');
  if (!fs.existsSync(packsDir)) {
    fs.mkdirSync(packsDir, { recursive: true });
  }

  for (const lang of languages) {
    const pack: Record<string, string> = {};
    messages.forEach((msg) => {
      pack[msg.key] = msg.defaultValue;
    });

    fs.writeFileSync(
      path.join(packsDir, `${lang}.json`),
      JSON.stringify(pack, null, 2)
    );
  }
}

function getAllFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      files.push(...getAllFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  }

  return files;
}
