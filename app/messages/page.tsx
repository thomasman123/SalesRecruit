'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useUser } from "@/lib/hooks/use-user";

interface Message {
  id: number;
  content: string;
  sender_type: 'recruiter' | 'applicant';
  timestamp: string;
  read: boolean;
}

interface Conversation {
  id: number;
  participant: {
    name: string;
    avatar_url: string | null;
  };
  job: {
    title: string;
  };
  last_message_timestamp: string;
  unread_count: number;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [role, setRole] = useState<'recruiter' | 'sales-professional' | null>(null);
  const { userData, isLoading } = useUser();
  const router = useRouter();

  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!isLoading && !userData) {
      router.push('/login');
    }
  }, [isLoading, userData, router]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { user } = session;
      const { data: userRow, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Failed to fetch user role', error);
        return;
      }

      if (userRow) {
        setRole(userRow.role as 'recruiter' | 'sales-professional');
      }

      // Keep role updated if auth state changes
      supabase.auth.onAuthStateChange((_event, newSession) => {
        if (!newSession) {
          router.push('/login');
        }
      });
    };

    init();
  }, []);

  // When role is resolved fetch conversations
  useEffect(() => {
    if (role) {
      fetchConversations(role);
    }
  }, [role]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
      const channel = supabase
        .channel(`messages:${selectedConversation}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation}`,
        }, (payload) => {
          setMessages((current) => [...current, payload.new as Message]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConversation]);

  const fetchConversations = async (currentRole: 'recruiter' | 'sales-professional') => {
    const base = supabase.from('conversations');

    let query;
    if (currentRole === 'recruiter') {
      query = base.select(`
          id,
          participant:users!conversations_applicant_user_id_fkey(name, avatar_url),
          job:jobs(title),
          last_message_timestamp,
          unread_count
        `);
    } else {
      // sales professional -> show recruiter info
      query = base.select(`
          id,
          participant:users!conversations_recruiter_id_fkey(name, avatar_url),
          job:jobs(title),
          last_message_timestamp,
          unread_count
        `);
    }

    const { data, error } = await query.order('last_message_timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return;
    }

    const transformed: Conversation[] = (data || []).map((conv: any) => ({
      id: conv.id,
      participant: {
        name: conv.participant?.name ?? '',
        avatar_url: conv.participant?.avatar_url ?? null,
      },
      job: {
        title: conv.job?.title ?? '',
      },
      last_message_timestamp: conv.last_message_timestamp,
      unread_count: conv.unread_count,
    }));

    setConversations(transformed);
  };

  const fetchMessages = async (conversationId: number) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !role) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const senderType = role === 'recruiter' ? 'recruiter' : 'applicant';

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: selectedConversation,
        sender_id: user.id,
        sender_type: senderType,
        content: newMessage.trim(),
      });

    if (error) {
      console.error('Error sending message:', error);
      return;
    }

    setNewMessage('');
    fetchConversations(role); // update list
  };

  if (isLoading || !userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-4rem)]">
      <div className="grid grid-cols-12 gap-4 h-full">
        {/* Conversations List */}
        <div className="col-span-4 border-r pr-4 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-4">Messages</h2>
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <Card
                key={conversation.id}
                className={`p-4 cursor-pointer hover:bg-gray-50 ${
                  selectedConversation === conversation.id ? 'bg-gray-100' : ''
                }`}
                onClick={() => setSelectedConversation(conversation.id)}
              >
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={conversation.participant.avatar_url || ''} />
                    <AvatarFallback>
                      {conversation.participant.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{conversation.participant.name}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.job.title}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(conversation.last_message_timestamp), {
                        addSuffix: true,
                      })}
                    </p>
                    {conversation.unread_count > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-500 rounded-full">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Messages Area */}
        <div className="col-span-8 flex flex-col h-full">
          {selectedConversation ? (
            <>
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_type === 'recruiter' ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender_type === 'recruiter'
                          ? 'bg-gray-100 text-black'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      <p>{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {formatDistanceToNow(new Date(message.timestamp), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage}>Send</Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 