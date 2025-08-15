'use client';

import React, { useState, useEffect } from 'react';

interface PromptTemplate {
  name: string;
  system_message: string;
  user_prompt_template: string;
  variables: string[];
  temperature: number;
  description: string;
  version: string;
}

interface PromptTemplateManagerProps {
  onTemplateSelect?: (agentType: string, template: PromptTemplate) => void;
}

export default function PromptTemplateManager({ onTemplateSelect }: PromptTemplateManagerProps) {
  const [templates, setTemplates] = useState<Record<string, string>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [selectedAgentType, setSelectedAgentType] = useState<string>('');
  const [testVariables, setTestVariables] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch available templates
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('http://localhost:8002/api/prompt-templates');
      const data = await response.json();
      if (data.status === 'success') {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchTemplateDetails = async (agentType: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8002/api/prompt-templates/${agentType}`);
      const data = await response.json();
      if (data.status === 'success') {
        setSelectedTemplate(data.template);
        setSelectedAgentType(agentType);
        
        // Initialize test variables
        const initialVars: Record<string, string> = {};
        data.template.variables.forEach((varName: string) => {
          initialVars[varName] = getDefaultValue(varName);
        });
        setTestVariables(initialVars);
      }
    } catch (error) {
      console.error('Failed to fetch template details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultValue = (varName: string): string => {
    const defaults: Record<string, string> = {
      'requirements': 'Create a function to calculate fibonacci numbers',
      'topic': 'artificial intelligence',
      'audience': 'software developers',
      'data_description': 'Sales data from Q1 2024',
      'analysis_goals': 'Identify top-performing products',
      'level': 'intermediate',
      'prompt': 'A mysterious forest where time moves differently',
      'genre': 'fantasy',
      'purpose': 'Schedule a team meeting',
      'tone': 'professional'
    };
    return defaults[varName] || `Enter ${varName}`;
  };

  const testTemplate = async () => {
    if (!selectedAgentType) return;

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8002/api/prompt-templates/${selectedAgentType}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variables: testVariables })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setTestResult(data.generated_prompt);
      }
    } catch (error) {
      console.error('Failed to test template:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVariableChange = (varName: string, value: string) => {
    setTestVariables(prev => ({ ...prev, [varName]: value }));
  };

  const handleSelectTemplate = () => {
    if (selectedTemplate && selectedAgentType && onTemplateSelect) {
      onTemplateSelect(selectedAgentType, selectedTemplate);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Prompt Template Manager</h2>
          <p className="text-gray-600">Customize and test AI agent prompts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Available Templates</h3>
          <div className="grid gap-2">
            {Object.entries(templates).map(([agentType, description]) => (
              <button
                key={agentType}
                onClick={() => fetchTemplateDetails(agentType)}
                className={`p-3 text-left rounded-lg border transition-colors ${
                  selectedAgentType === agentType
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-gray-900 capitalize">
                  {agentType.replace('_', ' ')}
                </div>
                <div className="text-sm text-gray-600">{description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Template Details */}
        <div className="space-y-4">
          {selectedTemplate && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{selectedTemplate.name}</h3>
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                  v{selectedTemplate.version}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    System Message
                  </label>
                  <div className="p-3 bg-gray-50 rounded border text-sm text-gray-700 max-h-32 overflow-y-auto">
                    {selectedTemplate.system_message}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User Prompt Template
                  </label>
                  <div className="p-3 bg-gray-50 rounded border text-sm text-gray-700 max-h-32 overflow-y-auto">
                    {selectedTemplate.user_prompt_template}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Temperature</label>
                    <div className="mt-1 text-sm text-gray-900">{selectedTemplate.temperature}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Variables</label>
                    <div className="mt-1 text-sm text-gray-900">
                      {selectedTemplate.variables.join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Test Variables */}
      {selectedTemplate && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Test Template</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedTemplate.variables.map((varName) => (
              <div key={varName}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                  {varName.replace('_', ' ')}
                </label>
                <input
                  type="text"
                  value={testVariables[varName] || ''}
                  onChange={(e) => handleVariableChange(varName, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Enter ${varName}`}
                />
              </div>
            ))}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={testTemplate}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Testing...' : 'Test Template'}
            </button>
            
            {onTemplateSelect && (
              <button
                onClick={handleSelectTemplate}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Use This Template
              </button>
            )}
          </div>
        </div>
      )}

      {/* Test Result */}
      {testResult && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Generated Prompt</h3>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">System Message</label>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm text-gray-700 max-h-40 overflow-y-auto">
                {testResult.system_message}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User Prompt</label>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-sm text-gray-700 max-h-40 overflow-y-auto">
                {testResult.user_prompt}
              </div>
            </div>
            <div className="flex gap-4 text-sm text-gray-600">
              <span>Temperature: {testResult.temperature}</span>
              <span>Model: {testResult.model}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
