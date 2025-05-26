'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useUser } from "@/lib/hooks/use-user";
import { getSupabaseClient } from "@/lib/supabase/client";
import { ArrowLeft, MessageSquare, User, Briefcase, DollarSign, Target, Wrench, Video, Play, Eye } from 'lucide-react';

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

interface Applicant {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  location: string;
  experience: string;
  highest_ticket: string;
  sales_style: string;
  tools: string;
  video_url: string | null;
  applied_date: string;
  status: string;
  user_id: string | null;
  job: {
    id: number;
    title: string;
  };
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [availableApplicants, setAvailableApplicants] = useState<Applicant[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [role, setRole] = useState<'recruiter' | 'sales-professional' | null>(null);
  const [view, setView] = useState<'conversations' | 'applicants' | 'profile'>('conversations');
  const [searchQuery, setSearchQuery] = useState('');
  const { userData, isLoading } = useUser();
  const router = useRouter();

  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!isLoading && userData) {
      setRole(userData.role as 'recruiter' | 'sales-professional');
    }
  }, [isLoading, userData]);

  useEffect(() => {
    if (role) {
      fetchConversations(role);
      if (role === 'recruiter') {
        fetchAvailableApplicants();
      }
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

  const fetchConversations = async (currentRole: 'recruiter' | 'sales-professional') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const base = supabase.from('conversations');
    let query;
    
    if (currentRole === 'recruiter') {
      query = base
        .select(`
          id,
          participant:users!conversations_applicant_user_id_fkey(name, avatar_url),
          job:jobs(title),
          last_message_timestamp,
          unread_count
        `)
        .eq('recruiter_id', user.id);
    } else {
      query = base
        .select(`
          id,
          participant:users!conversations_recruiter_id_fkey(name, avatar_url),
          job:jobs(title),
          last_message_timestamp,
          unread_count
        `)
        .eq('applicant_user_id', user.id);
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

  const fetchAvailableApplicants = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get applicants for jobs posted by this recruiter
    const { data, error } = await supabase
      .from('applicants')
      .select(`
        id,
        name,
        email,
        avatar_url,
        location,
        experience,
        highest_ticket,
        sales_style,
        tools,
        video_url,
        applied_date,
        status,
        user_id,
        job:jobs!inner(id, title, recruiter_id)
      `)
      .eq('jobs.recruiter_id', user.id)
      .order('applied_date', { ascending: false });

    if (error) {
      console.error('Error fetching applicants:', error);
      return;
    }

    const transformed: Applicant[] = (data || []).map((applicant: any) => ({
      id: applicant.id,
      name: applicant.name,
      email: applicant.email,
      avatar_url: applicant.avatar_url,
      location: applicant.location,
      experience: applicant.experience,
      highest_ticket: applicant.highest_ticket,
      sales_style: applicant.sales_style,
      tools: applicant.tools,
      video_url: applicant.video_url,
      applied_date: applicant.applied_date,
      status: applicant.status,
      user_id: applicant.user_id,
      job: {
        id: applicant.job.id,
        title: applicant.job.title,
      },
    }));

    setAvailableApplicants(transformed);
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
  };

  const startConversation = async (applicant: Applicant) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !applicant.user_id) return;

    // Check if conversation already exists
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('recruiter_id', user.id)
      .eq('applicant_user_id', applicant.user_id)
      .eq('job_id', applicant.job.id)
      .single();

    if (existingConversation) {
      setSelectedConversation(existingConversation.id);
      setView('conversations');
      return;
    }

    // Create new conversation
    const { data: newConversation, error } = await supabase
      .from('conversations')
      .insert({
        recruiter_id: user.id,
        applicant_id: applicant.id,
        applicant_user_id: applicant.user_id,
        job_id: applicant.job.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return;
    }

    setSelectedConversation(newConversation.id);
    setView('conversations');
    fetchConversations(role!);
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
    fetchConversations(role);
  };

  const filteredApplicants = availableApplicants.filter((applicant) => {
    if (searchQuery && !applicant.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">New</Badge>;
      case "reviewing":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Reviewing</Badge>;
      case "interviewing":
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Interviewing</Badge>;
      case "hired":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Hired</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejected</Badge>;
      default:
        return null;
    }
  };

  if (view === 'profile' && selectedApplicant) {
    return (
      <div className="container mx-auto p-4 h-[calc(100vh-4rem)]">
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => setView('applicants')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Applicants
          </Button>
        </div>

        <Card className="p-6 h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={selectedApplicant.avatar_url || ''} />
                <AvatarFallback>
                  {selectedApplicant.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{selectedApplicant.name}</h1>
                <p className="text-gray-600">{selectedApplicant.location}</p>
                <p className="text-sm text-gray-500">Applied for: {selectedApplicant.job.title}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => startConversation(selectedApplicant)}
                className="flex items-center"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Message
              </Button>
              {getStatusBadge(selectedApplicant.status)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center text-sm text-gray-600">
              <Briefcase className="w-4 h-4 mr-2" />
              <span>{selectedApplicant.experience}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <DollarSign className="w-4 h-4 mr-2" />
              <span>Highest ticket: {selectedApplicant.highest_ticket}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Target className="w-4 h-4 mr-2" />
              <span>Style: {selectedApplicant.sales_style}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Wrench className="w-4 h-4 mr-2" />
              <span>Tools: {selectedApplicant.tools}</span>
            </div>
          </div>

          {selectedApplicant.video_url && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Video className="w-5 h-5 mr-2" />
                Video Introduction
              </h3>
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Play className="w-6 h-6 text-blue-500" />
                  </div>
                  <p className="text-sm text-gray-600">Watch video introduction</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Experience</h3>
              <p className="text-gray-700">{selectedApplicant.experience}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Sales Style</h3>
              <p className="text-gray-700">{selectedApplicant.sales_style}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Tools & Skills</h3>
              <p className="text-gray-700">{selectedApplicant.tools}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-4rem)]">
      <div className="grid grid-cols-12 gap-4 h-full">
        {/* Left Panel */}
        <div className="col-span-4 border-r pr-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Messages</h2>
            {role === 'recruiter' && (
              <div className="flex space-x-2">
                <Button
                  variant={view === 'conversations' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setView('conversations')}
                >
                  Chats
                </Button>
                <Button
                  variant={view === 'applicants' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setView('applicants')}
                >
                  Candidates
                </Button>
              </div>
            )}
          </div>

          {view === 'applicants' && role === 'recruiter' && (
            <div className="mb-4">
              <Input
                type="text"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
          )}

          <div className="space-y-2">
            {view === 'conversations' ? (
              conversations.length > 0 ? (
                conversations.map((conversation) => (
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
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
                  <p className="text-gray-500 mb-4">
                    {role === 'recruiter' 
                      ? "Start messaging candidates by clicking on 'Candidates' tab"
                      : "You don't have any conversations yet"
                    }
                  </p>
                  {role === 'recruiter' && (
                    <Button onClick={() => setView('applicants')}>
                      View Candidates
                    </Button>
                  )}
                </div>
              )
            ) : (
              // Applicants view
              filteredApplicants.length > 0 ? (
                filteredApplicants.map((applicant) => (
                  <Card
                    key={applicant.id}
                    className="p-4 cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={applicant.avatar_url || ''} />
                        <AvatarFallback>
                          {applicant.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{applicant.name}</p>
                        <p className="text-sm text-gray-500 truncate">{applicant.job.title}</p>
                        <p className="text-xs text-gray-400">{applicant.location}</p>
                      </div>
                      <div className="flex flex-col space-y-1">
                        {getStatusBadge(applicant.status)}
                      </div>
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedApplicant(applicant);
                          setView('profile');
                        }}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Profile
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => startConversation(applicant)}
                        className="flex-1"
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Message
                      </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
                  <p className="text-gray-500">
                    {searchQuery 
                      ? "No candidates match your search criteria"
                      : "You don't have any candidates yet"
                    }
                  </p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Right Panel - Messages Area */}
        <div className="col-span-8 flex flex-col h-full">
          {selectedConversation ? (
            <>
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      (role === 'recruiter' && message.sender_type === 'recruiter') ||
                      (role === 'sales-professional' && message.sender_type === 'applicant')
                        ? 'justify-end' 
                        : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        (role === 'recruiter' && message.sender_type === 'recruiter') ||
                        (role === 'sales-professional' && message.sender_type === 'applicant')
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-black'
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
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {view === 'conversations' 
                    ? "Select a conversation to start messaging"
                    : "Select a candidate to view their profile or start messaging"
                  }
                </h3>
                <p className="text-gray-500">
                  {role === 'recruiter' && view === 'conversations'
                    ? "Switch to the Candidates tab to start new conversations"
                    : "Choose from the list on the left to get started"
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 