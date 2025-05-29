'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useUser } from "@/lib/hooks/use-user";
import { getSupabaseClient } from "@/lib/supabase/client";
import { MessageSquare } from 'lucide-react';

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
  const { userData, isLoading } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const supabase = getSupabaseClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading && userData) {
      fetchConversations();
    }
  }, [isLoading, userData]);

  useEffect(() => {
    const c = searchParams.get("c")
    if (c && conversations.length) {
      const cid = Number(c)
      if (!isNaN(cid)) {
        setSelectedConversation(cid)
      }
    }
  }, [searchParams, conversations])

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
          const newMessage: Message = {
            id: payload.new.id as number,
            content: payload.new.content as string,
            sender_type: payload.new.sender_type as 'recruiter' | 'applicant',
            timestamp: payload.new.timestamp as string,
            read: payload.new.read as boolean,
          };
          setMessages((current) => [...current, newMessage]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        id,
        participant:users!conversations_recruiter_id_fkey(name, avatar_url),
        job:jobs(title),
        last_message_timestamp,
        unread_count
      `)
      .eq('applicant_user_id', user.id)
      .order('last_message_timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return;
    }

    const transformedData: Conversation[] = (data || []).map((conv: any) => ({
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

    setConversations(transformedData);
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

    const transformedMessages: Message[] = (data || []).map((msg: any) => ({
      id: msg.id,
      content: msg.content,
      sender_type: msg.sender_type as 'recruiter' | 'applicant',
      timestamp: msg.timestamp,
      read: msg.read,
    }));

    setMessages(transformedMessages);

    // Mark messages as read
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ unread_count: 0 })
      .eq('id', conversationId);

    if (updateError) {
      console.error('Error marking messages as read:', updateError);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately

    // Add message to local state immediately for instant feedback
    const tempMessage: Message = {
      id: Date.now(), // Temporary ID
      content: messageContent,
      sender_type: 'applicant',
      timestamp: new Date().toISOString(),
      read: true,
    };
    setMessages((current) => [...current, tempMessage]);

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: selectedConversation,
        sender_id: user.id,
        sender_type: 'applicant',
        content: messageContent,
      });

    if (error) {
      console.error('Error sending message:', error);
      // Remove the temporary message on error
      setMessages((current) => current.filter(msg => msg.id !== tempMessage.id));
      setNewMessage(messageContent); // Restore the message content
      return;
    }

    fetchConversations();
  };

  return (
    <div className="h-[calc(100vh-8rem)] overflow-hidden">
      <div className="grid grid-cols-12 gap-4 h-full">
        {/* Left Panel */}
        <div className="col-span-4 border-r border-dark-600 pr-4 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h2 className="text-2xl font-bold text-white">Messages</h2>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="space-y-2">
              {conversations.length > 0 ? (
                conversations.map((conversation) => (
                  <Card
                    key={conversation.id}
                    className={`p-4 cursor-pointer hover:bg-dark-700 transition-colors bg-dark-800 border-dark-600 flex-shrink-0 ${
                      selectedConversation === conversation.id ? 'bg-dark-700 border-purple-500/50' : ''
                    }`}
                    onClick={() => setSelectedConversation(conversation.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="border border-dark-600">
                        <AvatarImage src={conversation.participant.avatar_url || ''} />
                        <AvatarFallback className="bg-purple-500/20 text-purple-400">
                          {conversation.participant.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-white">{conversation.job.title}</p>
                        <p className="text-sm text-gray-400 truncate">
                          {conversation.participant.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(conversation.last_message_timestamp), {
                            addSuffix: true,
                          })}
                        </p>
                        {conversation.unread_count > 0 && (
                          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-purple-500 rounded-full">
                            {conversation.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No conversations yet</h3>
                  <p className="text-gray-400">
                    You don't have any conversations with recruiters yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Messages Area */}
        <div className="col-span-8 flex flex-col h-full min-h-0">
          {selectedConversation ? (
            <>
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto min-h-0 mb-4 bg-dark-800 rounded-lg border border-dark-600">
                <div className="p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_type === 'applicant' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.sender_type === 'applicant'
                            ? 'bg-purple-500 text-white'
                            : 'bg-dark-700 text-white border border-dark-600'
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
              </div>
              
              {/* Input Area */}
              <div className="flex space-x-2 flex-shrink-0">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="bg-dark-700 border-dark-600 text-white placeholder:text-gray-500"
                />
                <Button onClick={sendMessage} className="bg-purple-500 hover:bg-purple-600">Send</Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">
                  Select a conversation to start messaging
                </h3>
                <p className="text-gray-400">
                  Choose from the list on the left to get started
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 