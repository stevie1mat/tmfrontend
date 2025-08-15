/**
 * Workflow Chat Interface
 * A chat-like interface for creating workflows through natural language
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { NaturalLanguageDSLParser } from '@/lib/natural-language-dsl-parser';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  workflow?: {
    dsl: string;
    steps: string[];
    intent: any;
  };
}

interface WorkflowChatInterfaceProps {
  onWorkflowGenerated?: (workflow: { dsl: string; steps: string[]; intent: any }) => void;
}

export default function WorkflowChatInterface({ onWorkflowGenerated }: WorkflowChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi! I can help you create workflows using natural language. Just describe what you want to accomplish!\n\nFor example:\n• \"Generate a blog post about AI and save it as PDF\"\n• \"Fetch data from an API and send results via email\"\n• \"Collect user feedback and categorize it automatically\"",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nlParser = new NaturalLanguageDSLParser();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsProcessing(true);

    // Simulate processing delay
    setTimeout(() => {
      try {
        const result = nlParser.parseMessage(inputMessage);
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `I've analyzed your request and created a workflow with ${result.steps.length} steps. Here's what I understood:

**Intent:** ${result.intent.type.replace('_', ' ')} (${Math.round(result.confidence * 100)}% confidence)

**Workflow Steps:**
${result.steps.map(step => `${step.id}. ${step.description}`).join('\n')}

Would you like me to generate the visual workflow or make any adjustments?`,
          timestamp: new Date(),
          workflow: {
            dsl: result.dsl,
            steps: result.steps.map(step => step.description),
            intent: result.intent
          }
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // Notify parent component
        if (onWorkflowGenerated) {
          onWorkflowGenerated({
            dsl: result.dsl,
            steps: result.steps.map(step => step.description),
            intent: result.intent
          });
        }
      } catch (error) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: "I'm sorry, I had trouble understanding your request. Could you try rephrasing it? For example:\n• \"Create a content generator that asks for a topic\"\n• \"Build a data pipeline that fetches from an API\"",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
      
      setIsProcessing(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleExampleClick = (example: string) => {
    setInputMessage(example);
  };

  const examples = [
    "Generate a blog post about machine learning and export as PDF",
    "Fetch stock prices and send daily reports to investors",
    "Create a customer feedback analyzer with email notifications",
    "Build a social media content scheduler with approval workflow"
  ];

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl border border-gray-200 shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-lg">🤖</span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Workflow AI Assistant</h3>
          <p className="text-sm text-gray-600">Describe your workflow in plain English</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="whitespace-pre-line">{message.content}</p>
              
              {message.workflow && (
                <div className="mt-3 p-3 bg-white/10 rounded-lg">
                  <div className="text-xs opacity-75 mb-2">Generated DSL:</div>
                  <pre className="text-xs font-mono bg-black/20 p-2 rounded overflow-x-auto">
                    {message.workflow.dsl}
                  </pre>
                </div>
              )}
              
              <div className="text-xs opacity-75 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm">Analyzing your request...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Example suggestions */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <div className="text-xs text-gray-500 mb-2">Quick examples:</div>
          <div className="flex flex-wrap gap-2">
            {examples.map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(example)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-3">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Describe your workflow... (Press Enter to send)"
            className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] max-h-32"
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isProcessing}
            className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
