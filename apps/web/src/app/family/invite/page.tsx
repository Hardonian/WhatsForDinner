'use client';
/**
 * Family Plan Invite Page
 * Easy family sharing setup
 */


import { useState } from 'react';
import { Users, Mail, Send, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function FamilyInvitePage() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [invited, setInvited] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const handleInvite = async () => {
    if (!email) return;

    setSending(true);
    try {
      const response = await fetch('/api/family/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });

      if (response.ok) {
        setInvited([...invited, email]);
        setEmail('');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Invite Family Members</h1>
        <p className="text-xl text-muted-foreground">
          Share meal plans, pantry, and recipes with your family
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Family Plan Benefits
          </CardTitle>
          <CardDescription>
            Up to 6 members included. $2.99 per additional member.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Shared meal plans and calendar
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Shared pantry tracking
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Multiple dietary profiles
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Kid-friendly recipe filters
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Family budget tracking
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Send Invitation</CardTitle>
          <CardDescription>
            Invite family members to join your meal planning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="family@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
              className="px-3 py-2 border rounded-md"
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <Button onClick={handleInvite} disabled={!email || sending}>
              <Send className="w-4 h-4 mr-2" />
              Send Invite
            </Button>
          </div>

          {invited.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Invited:</p>
              {invited.map((inviteEmail, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{inviteEmail}</span>
                  <Badge variant="secondary">Pending</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}