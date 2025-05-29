"use client"

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

export default function RecruiterMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [availableApplicants, setAvailableApplicants] = useState<Applicant[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [view, setView] = useState<'conversations' | 'applicants' | 'profile'>('conversations');
  const [searchQuery, setSearchQuery] = useState('');
  const { userData, isLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!isLoading && userData) {
      fetchConversations();
      fetchAvailableApplicants();
    }
  }, [isLoading, userData]);

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

  useEffect(() => {
    const c = searchParams.get('c');
    if (c && conversations.length) {
      const cid = Number(c);
      if (!isNaN(cid)) setSelectedConversation(cid);
    }
  }, [searchParams, conversations]);

  const fetchConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        id,
        participant:users!conversations_applicant_user_id_fkey(name, avatar_url),
        job:jobs(title),
        last_message_timestamp,
        unread_count
      `)
      .eq('recruiter_id', user.id)
      .order('last_message_timestamp', { ascending: false });

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

    // Mark messages as read
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ unread_count: 0 })
      .eq('id', conversationId);

    if (updateError) {
      console.error('Error marking messages as read:', updateError);
    }
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
    fetchConversations();
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
      sender_type: 'recruiter',
      timestamp: new Date().toISOString(),
      read: true,
    };
    setMessages((current) => [...current, tempMessage]);

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: selectedConversation,
        sender_id: user.id,
        sender_type: 'recruiter',
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
      <div style={{ height: 'calc(100vh - 8rem)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ marginBottom: '1rem', flexShrink: 0 }}>
          <button
            onClick={() => setView('applicants')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              color: '#9ca3af',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = '#9ca3af';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ArrowLeft style={{ width: '1rem', height: '1rem' }} />
            Back to Applicants
          </button>
        </div>

        <div style={{ 
          flex: 1, 
          padding: '1.5rem', 
          backgroundColor: 'rgba(0, 0, 0, 0.5)', 
          border: '1px solid rgba(255, 255, 255, 0.1)', 
          borderRadius: '0.5rem',
          overflowY: 'auto',
          minHeight: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '4rem',
                height: '4rem',
                borderRadius: '0.5rem',
                backgroundColor: 'rgba(168, 85, 247, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c084fc',
                fontWeight: '600',
                fontSize: '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                {selectedApplicant.avatar_url ? (
                  <img 
                    src={selectedApplicant.avatar_url} 
                    alt={selectedApplicant.name}
                    style={{ width: '100%', height: '100%', borderRadius: '0.5rem', objectFit: 'cover' }}
                  />
                ) : (
                  selectedApplicant.name.split(' ').map(n => n[0]).join('')
                )}
              </div>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#ffffff', margin: 0, marginBottom: '0.25rem' }}>{selectedApplicant.name}</h1>
                <p style={{ color: '#9ca3af', margin: 0, marginBottom: '0.25rem' }}>{selectedApplicant.location}</p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Applied for: {selectedApplicant.job.title}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => startConversation(selectedApplicant)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#a855f7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                <MessageSquare style={{ width: '1rem', height: '1rem' }} />
                Message
              </button>
              {getStatusBadge(selectedApplicant.status)}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: '#9ca3af' }}>
              <Briefcase style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', color: '#c084fc' }} />
              <span>{selectedApplicant.experience}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: '#9ca3af' }}>
              <DollarSign style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', color: '#c084fc' }} />
              <span>Highest ticket: {selectedApplicant.highest_ticket}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: '#9ca3af' }}>
              <Target style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', color: '#c084fc' }} />
              <span>Style: {selectedApplicant.sales_style}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: '#9ca3af' }}>
              <Wrench style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', color: '#c084fc' }} />
              <span>Tools: {selectedApplicant.tools}</span>
            </div>
          </div>

          {selectedApplicant.video_url && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', color: '#ffffff', margin: 0 }}>
                <Video style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem', color: '#c084fc' }} />
                Video Introduction
              </h3>
              <div style={{ 
                aspectRatio: '16/9', 
                backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                borderRadius: '0.5rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    width: '3rem', 
                    height: '3rem', 
                    backgroundColor: 'rgba(168, 85, 247, 0.2)', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 0.5rem auto' 
                  }}>
                    <Play style={{ width: '1.5rem', height: '1.5rem', color: '#c084fc' }} />
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>Watch video introduction</p>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem', color: '#ffffff', margin: 0 }}>Experience</h3>
              <p style={{ color: '#cccccc', margin: 0 }}>{selectedApplicant.experience}</p>
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem', color: '#ffffff', margin: 0 }}>Sales Style</h3>
              <p style={{ color: '#cccccc', margin: 0 }}>{selectedApplicant.sales_style}</p>
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem', color: '#ffffff', margin: 0 }}>Tools & Skills</h3>
              <p style={{ color: '#cccccc', margin: 0 }}>{selectedApplicant.tools}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 8rem)', display: 'flex', gap: '1rem', overflow: 'hidden' }}>
      {/* Left Panel */}
      <div style={{ width: '20rem', flexShrink: 0, borderRight: '1px solid rgba(255, 255, 255, 0.1)', paddingRight: '1rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexShrink: 0 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ffffff', margin: 0 }}>Messages</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setView('conversations')}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: view === 'conversations' ? '#a855f7' : 'transparent',
                color: view === 'conversations' ? '#ffffff' : '#9ca3af',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: view === 'conversations' ? '#a855f7' : 'rgba(255, 255, 255, 0.1)'
              }}
              onMouseOver={(e) => {
                if (view !== 'conversations') {
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }
              }}
              onMouseOut={(e) => {
                if (view !== 'conversations') {
                  e.currentTarget.style.color = '#9ca3af';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              Chats
            </button>
            <button
              onClick={() => setView('applicants')}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: view === 'applicants' ? '#a855f7' : 'transparent',
                color: view === 'applicants' ? '#ffffff' : '#9ca3af',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: view === 'applicants' ? '#a855f7' : 'rgba(255, 255, 255, 0.1)'
              }}
              onMouseOver={(e) => {
                if (view !== 'applicants') {
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }
              }}
              onMouseOut={(e) => {
                if (view !== 'applicants') {
                  e.currentTarget.style.color = '#9ca3af';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              Candidates
            </button>
          </div>
        </div>

        {view === 'applicants' && (
          <div style={{ marginBottom: '1rem', flexShrink: 0 }}>
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.375rem',
                color: '#ffffff',
                fontSize: '0.875rem'
              }}
            />
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: 0 }}>
          {view === 'conversations' ? (
            conversations.length > 0 ? (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  style={{
                    padding: '1rem',
                    backgroundColor: selectedConversation === conversation.id ? 'rgba(168, 85, 247, 0.1)' : 'rgba(0, 0, 0, 0.5)',
                    border: selectedConversation === conversation.id ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    if (selectedConversation !== conversation.id) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedConversation !== conversation.id) {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(168, 85, 247, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#c084fc',
                      fontWeight: '600',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      {conversation.participant.avatar_url ? (
                        <img 
                          src={conversation.participant.avatar_url} 
                          alt={conversation.participant.name}
                          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        conversation.participant.name.charAt(0)
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: '500', color: '#ffffff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conversation.participant.name}
                      </p>
                      <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conversation.job.title}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                        {formatDistanceToNow(new Date(conversation.last_message_timestamp), {
                          addSuffix: true,
                        })}
                      </p>
                      {conversation.unread_count > 0 && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '1.25rem',
                          height: '1.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          color: '#ffffff',
                          backgroundColor: '#a855f7',
                          borderRadius: '50%',
                          marginTop: '0.25rem'
                        }}>
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <MessageSquare style={{ width: '3rem', height: '3rem', color: '#6b7280', margin: '0 auto 1rem auto' }} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#ffffff', marginBottom: '0.5rem', margin: 0 }}>No conversations yet</h3>
                <p style={{ color: '#9ca3af', marginBottom: '1rem', margin: 0 }}>
                  Start messaging candidates by clicking on 'Candidates' tab
                </p>
                <button 
                  onClick={() => setView('applicants')} 
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#a855f7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  View Candidates
                </button>
              </div>
            )
          ) : (
            // Applicants view
            filteredApplicants.length > 0 ? (
              filteredApplicants.map((applicant) => (
                <div
                  key={applicant.id}
                  style={{
                    padding: '1rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(168, 85, 247, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#c084fc',
                      fontWeight: '600',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      {applicant.avatar_url ? (
                        <img 
                          src={applicant.avatar_url} 
                          alt={applicant.name}
                          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        applicant.name.split(' ').map(n => n[0]).join('')
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: '500', color: '#ffffff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {applicant.name}
                      </p>
                      <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {applicant.job.title}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>{applicant.location}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      {getStatusBadge(applicant.status)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => {
                        setSelectedApplicant(applicant);
                        setView('profile');
                      }}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        fontSize: '0.875rem',
                        backgroundColor: 'transparent',
                        color: '#9ca3af',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <Eye style={{ width: '1rem', height: '1rem' }} />
                      View Profile
                    </button>
                    <button
                      onClick={() => startConversation(applicant)}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        fontSize: '0.875rem',
                        backgroundColor: '#a855f7',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <MessageSquare style={{ width: '1rem', height: '1rem' }} />
                      Message
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <User style={{ width: '3rem', height: '3rem', color: '#6b7280', margin: '0 auto 1rem auto' }} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#ffffff', marginBottom: '0.5rem', margin: 0 }}>No candidates found</h3>
                <p style={{ color: '#9ca3af', margin: 0 }}>
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {selectedConversation ? (
          <>
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              marginBottom: '1rem', 
              padding: '1rem', 
              backgroundColor: 'rgba(0, 0, 0, 0.5)', 
              borderRadius: '0.5rem', 
              border: '1px solid rgba(255, 255, 255, 0.1)',
              minHeight: 0
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    style={{
                      display: 'flex',
                      justifyContent: message.sender_type === 'recruiter' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '70%',
                        borderRadius: '0.5rem',
                        padding: '0.75rem',
                        backgroundColor: message.sender_type === 'recruiter' ? '#a855f7' : 'rgba(255, 255, 255, 0.05)',
                        color: '#ffffff',
                        border: message.sender_type === 'recruiter' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <p style={{ margin: 0, marginBottom: '0.25rem' }}>{message.content}</p>
                      <p style={{ fontSize: '0.75rem', margin: 0, opacity: 0.7 }}>
                        {formatDistanceToNow(new Date(message.timestamp), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.375rem',
                  color: '#ffffff',
                  fontSize: '0.875rem'
                }}
              />
              <button 
                onClick={sendMessage} 
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#a855f7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280' }}>
            <div style={{ textAlign: 'center' }}>
              <MessageSquare style={{ width: '4rem', height: '4rem', color: '#6b7280', margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '500', color: '#ffffff', marginBottom: '0.5rem', margin: 0 }}>
                {view === 'conversations' 
                  ? "Select a conversation to start messaging"
                  : "Select a candidate to view their profile or start messaging"
                }
              </h3>
              <p style={{ color: '#9ca3af', margin: 0 }}>
                {view === 'conversations'
                  ? "Switch to the Candidates tab to start new conversations"
                  : "Choose from the list on the left to get started"
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
