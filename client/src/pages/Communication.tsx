import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { 
  MessageSquare, 
  Users, 
  Video, 
  Phone, 
  Send, 
  Paperclip, 
  Search,
  Plus,
  MoreVertical,
  UserPlus,
  Settings
} from 'lucide-react';

interface Conversation {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'teacher';
  lastMessage: string;
  timestamp: string;
  unread: number;
  avatar?: string;
  online?: boolean;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  type: 'text' | 'file' | 'image';
}

export const Communication: React.FC = () => {
  const [activeConversation, setActiveConversation] = useState<string>('1');
  const [messageInput, setMessageInput] = useState('');

  const conversations: Conversation[] = [
    {
      id: '1',
      name: 'Math Study Group',
      type: 'group',
      lastMessage: 'Can someone help with problem 15?',
      timestamp: '2 min ago',
      unread: 3,
      online: true,
    },
    {
      id: '2',
      name: 'Ms. Johnson (Math Teacher)',
      type: 'teacher',
      lastMessage: 'Your assignment has been graded',
      timestamp: '1 hour ago',
      unread: 1,
      online: true,
    },
    {
      id: '3',
      name: 'Science Project Team',
      type: 'group',
      lastMessage: 'Meeting tomorrow at 3 PM',
      timestamp: '3 hours ago',
      unread: 0,
      online: false,
    },
    {
      id: '4',
      name: 'Alex Chen',
      type: 'direct',
      lastMessage: 'Thanks for the notes!',
      timestamp: '1 day ago',
      unread: 0,
      online: true,
    },
  ];

  const messages: Message[] = [
    {
      id: '1',
      senderId: 'user1',
      senderName: 'Sarah Kim',
      content: 'Can someone help with problem 15?',
      timestamp: '2:30 PM',
      type: 'text',
    },
    {
      id: '2',
      senderId: 'current',
      senderName: 'You',
      content: 'Sure! Which part are you stuck on?',
      timestamp: '2:32 PM',
      type: 'text',
    },
    {
      id: '3',
      senderId: 'user2',
      senderName: 'Mike Rodriguez',
      content: 'I can share my solution approach',
      timestamp: '2:33 PM',
      type: 'text',
    },
  ];

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      console.log('Sending message:', messageInput);
      setMessageInput('');
    }
  };

  const getConversationIcon = (type: string) => {
    switch (type) {
      case 'group':
        return Users;
      case 'teacher':
        return MessageSquare;
      default:
        return MessageSquare;
    }
  };

  return (
    <div className="h-full flex">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            <Button size="sm" icon={Plus}>
              New Chat
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conversation) => {
            const Icon = getConversationIcon(conversation.type);
            return (
              <div
                key={conversation.id}
                onClick={() => setActiveConversation(conversation.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  activeConversation === conversation.id ? 'bg-primary-50 border-primary-200' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary-600" />
                    </div>
                    {conversation.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900 truncate">{conversation.name}</h3>
                      <span className="text-xs text-gray-500">{conversation.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
                    <div className="flex items-center justify-between mt-1">
                      <Badge variant="secondary" size="sm">
                        {conversation.type}
                      </Badge>
                      {conversation.unread > 0 && (
                        <Badge variant="primary" size="sm">
                          {conversation.unread}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Math Study Group</h3>
              <p className="text-sm text-gray-600">5 members • 3 online</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" icon={Video}>
              <span className="sr-only">Video call</span>
            </Button>
            <Button variant="ghost" size="sm" icon={Phone}>
              <span className="sr-only">Voice call</span>
            </Button>
            <Button variant="ghost" size="sm" icon={UserPlus}>
              <span className="sr-only">Add member</span>
            </Button>
            <Button variant="ghost" size="sm" icon={MoreVertical}>
              <span className="sr-only">More options</span>
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.senderId === 'current' ? 'flex-row-reverse' : ''}`}
            >
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-gray-600">
                  {message.senderName.charAt(0)}
                </span>
              </div>
              <div className={`max-w-[70%] ${message.senderId === 'current' ? 'text-right' : ''}`}>
                <div className={`inline-block p-3 rounded-2xl ${
                  message.senderId === 'current'
                    ? 'bg-primary-600 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-900 rounded-bl-md'
                }`}>
                  <p className="text-sm">{message.content}</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-gray-500">{message.senderName}</p>
                  <p className="text-xs text-gray-500">{message.timestamp}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-12"
              />
              <Button variant="ghost" size="sm" icon={Paperclip} className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <span className="sr-only">Attach file</span>
              </Button>
            </div>
            <Button onClick={handleSendMessage} icon={Send} disabled={!messageInput.trim()}>
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};