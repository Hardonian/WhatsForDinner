'use client';

export const dynamic = 'force-dynamic';


import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Users, Heart, Share2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFamily, useFamilyChat, useSendFamilyMessage } from '@/hooks/nomad/useNomadData';

export default function FamilyChatPage() {
  const { data: familyData } = useFamily();
  const familyId = familyData?.family?.id;
  const { data: chatData } = useFamilyChat(familyId);
  const sendMessage = useSendFamilyMessage();
  
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = chatData?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || !familyId) return;
    
    sendMessage.mutate({
      familyId,
      message: message.trim(),
      type: 'text',
    }, {
      onSuccess: () => {
        setMessage('');
      },
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!familyId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No Family Group</h2>
          <p className="text-muted-foreground mb-4">
            Create or join a family to start chatting
          </p>
          <Button>Create Family</Button>
        </Card>
      </div>
    );
  }

  const familyMembers = familyData?.members || [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-purple-600" />
              <div>
                <h1 className="text-xl font-bold">Family Chat</h1>
                <p className="text-sm text-muted-foreground">
                  {familyMembers.length} members
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Users className="w-4 h-4 mr-2" />
              Members
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
              <p className="text-muted-foreground">
                Start the conversation with your family
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg: any) => {
                const sender = familyMembers.find((m: any) => m.user_id === msg.user_id);
                const isOwnMessage = msg.user_id === familyMembers[0]?.user_id; // Simplified

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/20 flex items-center justify-center">
                        {sender?.user_profiles?.avatar_emoji || '??'}
                      </div>
                    </div>
                    <div className={`flex-1 ${isOwnMessage ? 'text-right' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">
                          {sender?.user_profiles?.name || 'Unknown'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <Card className={`inline-block p-3 ${
                        isOwnMessage 
                          ? 'bg-brand-500 text-white' 
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm">{msg.message}</p>
                      </Card>
                      <div className="flex items-center gap-2 mt-1">
                        <button className="text-xs text-muted-foreground hover:text-red-600 flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          <span>0</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Message Input */}
      <div className="border-t bg-background sticky bottom-0">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              onClick={handleSend}
              disabled={!message.trim() || sendMessage.isPending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}