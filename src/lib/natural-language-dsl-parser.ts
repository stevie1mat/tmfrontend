/**
 * Natural Language to DSL Parser
 * Converts natural language messages into tmflow-DSL workflows
 */

type WorkflowType = 'python_coding_agent' | 'poem_writing_agent' | 'blog_writing_agent' | 'data_analysis_agent' | 'study_assistant_agent' | 'javascript_coding_agent' | 'story_writing_agent' | 'email_assistant_agent' | 'translation_agent' | 'content_generation' | 'data_processing' | 'notification' | 'analysis' | 'automation';

interface WorkflowIntent {
  type: WorkflowType;
  confidence: number;
  entities: {
    inputs?: string[];
    outputs?: string[];
    actions?: string[];
    conditions?: string[];
    data_sources?: string[];
    recipients?: string[];
  };
}

interface DSLStep {
  id: number;
  command: string;
  args: string[];
  description: string;
}

export class NaturalLanguageDSLParser {
  private mistralApiUrl = '/api/mistral-poem'; // Reuse existing Mistral endpoint
  
  private intentPatterns = {
    content_generation: [
      /generate|create|write|compose|draft/i,
      /article|blog|post|content|text|story/i,
      /about|on|regarding|concerning/i
    ],
    data_processing: [
      /fetch|get|retrieve|collect|gather/i,
      /data|information|api|url|endpoint/i,
      /process|transform|convert|format/i
    ],
    notification: [
      /send|notify|alert|email|message/i,
      /to|recipient|user|admin/i,
      /when|if|after|upon/i
    ],
    analysis: [
      /analyze|examine|study|review|check/i,
      /trends|patterns|insights|metrics/i,
      /report|summary|findings/i
    ],
    automation: [
      /automate|schedule|trigger|execute/i,
      /workflow|process|task|job/i,
      /daily|hourly|weekly|monthly/i
    ]
  };

  private commandMappings = {
    // Input commands
    'collect': 'input',
    'get input': 'input',
    'ask for': 'input',
    'request': 'input',
    
    // Processing commands
    'fetch': 'fetch',
    'get data': 'fetch',
    'retrieve': 'fetch',
    'call api': 'fetch',
    
    // AI commands
    'generate': 'generate',
    'create': 'generate',
    'write': 'generate',
    'compose': 'generate',
    'draft': 'generate',
    
    // Transform commands
    'convert': 'transform',
    'format': 'transform',
    'process': 'transform',
    'change': 'transform',
    
    // Validation commands
    'check': 'validate',
    'verify': 'validate',
    'validate': 'validate',
    'ensure': 'validate',
    
    // Output commands
    'save': 'output',
    'export': 'output',
    'create file': 'output',
    'generate file': 'output',
    
    // Notification commands
    'send email': 'send_email',
    'notify': 'notify',
    'alert': 'notify',
    'message': 'notify',
    
    // Utility commands
    'log': 'log',
    'print': 'print',
    'display': 'print'
  };

  /**
   * Parse natural language message into DSL workflow using Mistral AI
   */
  async parseMessageWithAI(message: string): Promise<{
    dsl: string;
    steps: DSLStep[];
    intent: WorkflowIntent;
    confidence: number;
  }> {
    try {
      const aiResult = await this.parseWithMistral(message);
      return aiResult;
    } catch (error) {
      console.warn('Mistral AI parsing failed, falling back to pattern matching:', error);
      // Fallback to original pattern-based parsing
      return this.parseMessage(message);
    }
  }

  /**
   * Parse natural language message into DSL workflow (original pattern-based method)
   */
  parseMessage(message: string): {
    dsl: string;
    steps: DSLStep[];
    intent: WorkflowIntent;
    confidence: number;
  } {
    const intent = this.recognizeIntent(message);
    const steps = this.extractSteps(message, intent);
    const dsl = this.generateDSL(steps, intent);

    return {
      dsl,
      steps,
      intent,
      confidence: intent.confidence
    };
  }

  /**
   * Parse message using Mistral AI
   */
  private async parseWithMistral(message: string): Promise<{
    dsl: string;
    steps: DSLStep[];
    intent: WorkflowIntent;
    confidence: number;
  }> {
    const prompt = `You are an expert at converting natural language descriptions into structured workflow DSL (Domain Specific Language).

Your task is to analyze this user request and return a JSON response with the following structure:

{
  "intent": {
    "type": "agent_type",
    "confidence": 0.95,
    "entities": {
      "inputs": ["list of inputs needed"],
      "outputs": ["list of outputs"],
      "languages": ["source_lang", "target_lang"],
      "topics": ["main topics"]
    }
  },
  "steps": [
    {
      "id": 1,
      "command": "input",
      "args": ["variable_name", "input_type", "placeholder_text"],
      "description": "Step description"
    }
  ]
}

Available agent types:
- python_coding_agent: For generating Python code
- poem_writing_agent: For writing poetry
- blog_writing_agent: For creating blog posts
- data_analysis_agent: For analyzing data
- study_assistant_agent: For educational content
- javascript_coding_agent: For JavaScript code
- story_writing_agent: For creative stories
- email_assistant_agent: For writing emails
- translation_agent: For language translation
- content_generation: For general content
- data_processing: For data workflows
- notification: For sending notifications

Available DSL commands:
- input(variable_name, type, placeholder): Collect user input
- generate(prompt, model, temperature): Generate AI content using Mistral
- output(data, format, filename): Export results
- fetch(url): Get data from API
- transform(data, format): Convert data format
- validate(data, criteria): Validate data
- send_email(recipient, subject): Send email
- notify(message): Send notification

For translation agents, create steps that:
1. Collect source language
2. Collect target language  
3. Collect text to translate
4. Generate translation using AI
5. Output the translated text

Use "mistral-small-latest" as the model for generate commands.

User request: "${message}"

Return only valid JSON, no other text:`;

    const response = await fetch(this.mistralApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        temperature: 0.3,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.response || data.content || data.text || '';
    
    // Parse the AI response as JSON
    let parsedResponse;
    try {
      // Clean the response - remove any markdown formatting
      const cleanResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      parsedResponse = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('Failed to parse Mistral response as JSON:', aiResponse);
      throw new Error('Invalid JSON response from Mistral');
    }

    // Convert the AI response to our expected format
    const intent: WorkflowIntent = {
      type: parsedResponse.intent.type as WorkflowType,
      confidence: parsedResponse.intent.confidence || 0.9,
      entities: parsedResponse.intent.entities || {}
    };

    const steps: DSLStep[] = parsedResponse.steps.map((step: any) => ({
      id: step.id,
      command: step.command,
      args: step.args,
      description: step.description
    }));

    const dsl = this.generateDSL(steps, intent);

    return {
      dsl,
      steps,
      intent,
      confidence: intent.confidence
    };
  }

  /**
   * Recognize the intent of the message - focused on agent creation
   */
  private recognizeIntent(message: string): WorkflowIntent {
    const lowerMessage = message.toLowerCase();
    
    // Agent creation patterns with high confidence
    const agentPatterns = [
      {
        type: 'python_coding_agent' as WorkflowType,
        patterns: [
          /make.*python.*agent/i,
          /create.*python.*coding/i,
          /python.*programming.*agent/i,
          /coding.*agent.*python/i,
          /agent.*python.*code/i
        ],
        confidence: 0.95
      },
      {
        type: 'poem_writing_agent' as WorkflowType,
        patterns: [
          /make.*poem.*agent/i,
          /create.*poetry.*agent/i,
          /poem.*writing.*agent/i,
          /agent.*write.*poem/i,
          /poetry.*generator/i
        ],
        confidence: 0.95
      },
      {
        type: 'blog_writing_agent' as WorkflowType,
        patterns: [
          /make.*blog.*agent/i,
          /create.*blog.*writing/i,
          /blog.*writer.*agent/i,
          /content.*writing.*agent/i,
          /article.*writer/i
        ],
        confidence: 0.95
      },
      {
        type: 'data_analysis_agent' as WorkflowType,
        patterns: [
          /make.*data.*analysis/i,
          /create.*data.*analyst/i,
          /data.*analyzer.*agent/i,
          /analysis.*agent/i,
          /agent.*analyze.*data/i
        ],
        confidence: 0.95
      },
      {
        type: 'study_assistant_agent' as WorkflowType,
        patterns: [
          /make.*study.*agent/i,
          /create.*study.*assistant/i,
          /learning.*helper.*agent/i,
          /educational.*agent/i,
          /tutor.*agent/i
        ],
        confidence: 0.95
      },
      {
        type: 'javascript_coding_agent' as WorkflowType,
        patterns: [
          /make.*javascript.*agent/i,
          /create.*js.*coding/i,
          /javascript.*programming/i,
          /web.*development.*agent/i,
          /frontend.*coding/i
        ],
        confidence: 0.95
      },
      {
        type: 'story_writing_agent' as WorkflowType,
        patterns: [
          /make.*story.*agent/i,
          /create.*story.*writer/i,
          /narrative.*agent/i,
          /creative.*writing.*agent/i,
          /fiction.*writer/i
        ],
        confidence: 0.95
      },
      {
        type: 'email_assistant_agent' as WorkflowType,
        patterns: [
          /make.*email.*agent/i,
          /create.*email.*assistant/i,
          /email.*writer.*agent/i,
          /communication.*agent/i,
          /message.*helper/i
        ],
        confidence: 0.95
      },
      {
        type: 'translation_agent' as WorkflowType,
        patterns: [
          /make.*translation.*agent/i,
          /create.*translat.*agent/i,
          /translat.*agent/i,
          /english.*to.*malayalam.*agent/i,
          /malayalam.*translat/i,
          /language.*translat.*agent/i,
          /translat.*from.*to/i,
          /convert.*english.*malayalam/i
        ],
        confidence: 0.95
      }
    ];

    // Find the best matching agent pattern
    let bestMatch = { type: 'content_generation' as WorkflowType, confidence: 0.3 };
    
    for (const agentType of agentPatterns) {
      for (const pattern of agentType.patterns) {
        if (pattern.test(message)) {
          if (agentType.confidence > bestMatch.confidence) {
            bestMatch = { type: agentType.type, confidence: agentType.confidence };
          }
        }
      }
    }

    // Fallback to general patterns if no agent-specific match
    if (bestMatch.confidence < 0.5) {
      const generalScores = Object.entries(this.intentPatterns).map(([type, patterns]) => {
        const score = patterns.reduce((acc, pattern) => {
          const matches = message.match(pattern);
          return acc + (matches ? matches.length : 0);
        }, 0);
        return { type: type as WorkflowType, score };
      });

      const generalBest = generalScores.reduce((best, current) => 
        current.score > best.score ? current : best
      );

      if (generalBest.score > 0) {
        bestMatch = { 
          type: generalBest.type, 
          confidence: Math.min(generalBest.score / 3, 0.8) 
        };
      }
    }

    const entities = this.extractEntities(message);
    
    return {
      type: bestMatch.type,
      confidence: bestMatch.confidence,
      entities
    };
  }

  /**
   * Extract entities from the message
   */
  private extractEntities(message: string): WorkflowIntent['entities'] {
    const entities: WorkflowIntent['entities'] = {};

    // Extract inputs
    const inputPatterns = [
      /input (?:for |about )?([^,.]+)/gi,
      /ask (?:for |about )?([^,.]+)/gi,
      /collect ([^,.]+)/gi,
      /get (?:the )?([^,.]+) from (?:user|input)/gi
    ];
    entities.inputs = this.extractMatches(message, inputPatterns);

    // Extract outputs
    const outputPatterns = [
      /(?:save|export|create) (?:as |to )?([^,.]+)/gi,
      /generate (?:a )?([^,.]+)/gi,
      /output (?:as )?([^,.]+)/gi
    ];
    entities.outputs = this.extractMatches(message, outputPatterns);

    // Extract data sources
    const dataSourcePatterns = [
      /from ([^,.]+\.com[^,.\s]*)/gi,
      /fetch (?:from )?([^,.]+)/gi,
      /api (?:at )?([^,.]+)/gi
    ];
    entities.data_sources = this.extractMatches(message, dataSourcePatterns);

    // Extract recipients
    const recipientPatterns = [
      /send (?:to |email )?([^,.]+@[^,.]+)/gi,
      /notify ([^,.]+)/gi,
      /alert ([^,.]+)/gi
    ];
    entities.recipients = this.extractMatches(message, recipientPatterns);

    return entities;
  }

  /**
   * Extract matches from patterns
   */
  private extractMatches(text: string, patterns: RegExp[]): string[] {
    const matches: string[] = [];
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match[1]) {
          matches.push(match[1].trim());
        }
      }
    });
    return [...new Set(matches)]; // Remove duplicates
  }

  /**
   * Extract workflow steps from message
   */
  private extractSteps(message: string, intent: WorkflowIntent): DSLStep[] {
    const steps: DSLStep[] = [];
    const lowerMessage = message.toLowerCase();

    // Check if this is an agent creation request (high priority)
    const agentCreationPatterns = [
      /make.*agent/i,
      /create.*agent/i,
      /build.*agent/i,
      /agent.*for/i
    ];

    const isAgentCreation = agentCreationPatterns.some(pattern => pattern.test(message));
    
    // If this is agent creation, always use the default template for that agent type
    if (isAgentCreation || intent.type.endsWith('_agent')) {
      console.log('[DEBUG] Agent creation detected, using default template for:', intent.type);
      return this.generateDefaultSteps(intent);
    }

    // Otherwise, try to extract specific workflow steps from the message
    let stepId = 1;
    
    // Check for input collection patterns
    if (lowerMessage.includes('ask') || lowerMessage.includes('input') || lowerMessage.includes('collect') || 
        lowerMessage.includes('get') && (lowerMessage.includes('user') || lowerMessage.includes('topic'))) {
      steps.push({
        id: stepId++,
        command: 'input',
        args: ['"topic"', '"text"', '"Enter topic"'],
        description: 'Collect input from user'
      });
    }

    // Check for generation patterns (but not if it's agent creation)
    if ((lowerMessage.includes('generate') || lowerMessage.includes('write') || 
        lowerMessage.includes('compose') || lowerMessage.includes('draft')) && !isAgentCreation) {
      const topic = this.extractGenerationTopic(message);
      steps.push({
        id: stepId++,
        command: 'generate',
        args: [`"Generate ${topic}"`, '"mistral-small-latest"', '"0.7"'],
        description: `Generate ${topic} using AI`
      });
    }

    // Check for output/save patterns
    if (lowerMessage.includes('save') || lowerMessage.includes('export') || lowerMessage.includes('output') ||
        lowerMessage.includes('pdf') || lowerMessage.includes('file') || lowerMessage.includes('document')) {
      const format = this.extractOutputFormat(message);
      const filename = this.extractFilename(message);
      steps.push({
        id: stepId++,
        command: 'output',
        args: [stepId > 1 ? `step ${stepId - 1}` : 'data', `"${format}"`, `"${filename}"`],
        description: `Export result as ${format} file`
      });
    }

    // Check for email/notification patterns
    if (lowerMessage.includes('email') || lowerMessage.includes('send') || lowerMessage.includes('notify')) {
      const recipient = this.extractEmailRecipient(message);
      if (recipient) {
        steps.push({
          id: stepId++,
          command: 'send_email',
          args: [`"${recipient}"`, '"Workflow Results"'],
          description: `Send email to ${recipient}`
        });
      }
    }

    // If no steps extracted, generate based on intent
    if (steps.length === 0) {
      steps.push(...this.generateDefaultSteps(intent));
    }

    return steps;
  }

  /**
   * Map sentence to DSL command
   */
  private mapSentenceToCommand(sentence: string): { name: string; args: string[] } | null {
    const lowerSentence = sentence.toLowerCase();

    // Try to find matching command
    for (const [phrase, command] of Object.entries(this.commandMappings)) {
      if (lowerSentence.includes(phrase)) {
        const args = this.extractCommandArgs(sentence, command);
        return { name: command, args };
      }
    }

    return null;
  }

  /**
   * Extract arguments for a command
   */
  private extractCommandArgs(sentence: string, command: string): string[] {
    const args: string[] = [];

    switch (command) {
      case 'input':
        // Extract variable name and type
        const inputMatch = sentence.match(/(?:input|ask for|collect) (?:the )?([^,.]+)/i);
        if (inputMatch) {
          args.push(`"${inputMatch[1].trim()}"`, '"text"', `"Enter ${inputMatch[1].trim()}"`);
        }
        break;

      case 'fetch':
        // Extract URL or endpoint
        const urlMatch = sentence.match(/(https?:\/\/[^\s]+)/i) || 
                        sentence.match(/from ([^,.]+)/i);
        if (urlMatch) {
          args.push(`"${urlMatch[1]}"`);
        }
        break;

      case 'generate':
        // Extract what to generate
        const generateMatch = sentence.match(/(?:generate|create|write) (?:a |an )?([^,.]+)/i);
        if (generateMatch) {
          args.push(`"Generate ${generateMatch[1].trim()}"`, '"mistral"', '"0.7"');
        }
        break;

      case 'output':
        // Extract format and filename
        const formatMatch = sentence.match(/(?:as |to |format )([^,.]+)/i);
        const format = formatMatch ? formatMatch[1].trim() : 'text';
        args.push('step_data', `"${format}"`, '"output"');
        break;

      case 'send_email':
        // Extract recipient and subject
        const emailMatch = sentence.match(/(?:send|email) (?:to )?([^,.]+@[^,.]+)/i);
        const subjectMatch = sentence.match(/(?:about|subject|regarding) ([^,.]+)/i);
        if (emailMatch) {
          args.push(`"${emailMatch[1]}"`, `"${subjectMatch ? subjectMatch[1] : 'Notification'}"`);
        }
        break;

      case 'validate':
        // Extract validation type
        const validateMatch = sentence.match(/(?:check|validate|verify) (?:that |if )?([^,.]+)/i);
        if (validateMatch) {
          args.push('input_data', `"${validateMatch[1].trim()}"`);
        }
        break;

      default:
        // Extract quoted strings and identifiers
        const quotes = sentence.match(/"([^"]+)"/g);
        if (quotes) {
          args.push(...quotes);
        }
        break;
    }

    return args;
  }

  /**
   * Generate default steps based on intent - creates complete agent workflows
   */
  private generateDefaultSteps(intent: WorkflowIntent): DSLStep[] {
    const steps: DSLStep[] = [];

    switch (intent.type) {
      case 'python_coding_agent':
        steps.push(
          {
            id: 1,
            command: 'input',
            args: ['"requirements"', '"textarea"', '"Describe what Python code you need"'],
            description: 'Collect coding requirements from user'
          },
          {
            id: 2,
            command: 'generate',
            args: ['"Write clean, efficient Python code for: " + requirements + ". Include proper imports, docstrings, comments, error handling, and follow PEP 8 guidelines."', '"mistral-small-latest"', '"0.3"'],
            description: 'Generate Python code using AI'
          },
          {
            id: 3,
            command: 'output',
            args: ['step 2', '"python"', '"Generated Python Code"'],
            description: 'Export Python code ready for use'
          }
        );
        break;

      case 'poem_writing_agent':
        steps.push(
          {
            id: 1,
            command: 'input',
            args: ['"topic"', '"text"', '"Enter a topic for your poem"'],
            description: 'Collect poetry topic from user'
          },
          {
            id: 2,
            command: 'generate',
            args: ['"Write a beautiful, creative poem about " + topic + ". Use vivid imagery, emotional depth, and consider different poetic forms like sonnets, haikus, or free verse."', '"mistral-small-latest"', '"0.8"'],
            description: 'Generate poem using AI'
          },
          {
            id: 3,
            command: 'output',
            args: ['step 2', '"text"', '"Your Beautiful Poem"'],
            description: 'Export formatted poem'
          }
        );
        break;

      case 'blog_writing_agent':
        steps.push(
          {
            id: 1,
            command: 'input',
            args: ['"topic"', '"text"', '"Enter your blog post topic"'],
            description: 'Collect blog topic from user'
          },
          {
            id: 2,
            command: 'input',
            args: ['"audience"', '"text"', '"Who is your target audience?"'],
            description: 'Collect target audience information'
          },
          {
            id: 3,
            command: 'generate',
            args: ['"Write a comprehensive, engaging blog post about: " + topic + " for " + audience + ". Include headlines, introduction, clear sections, examples, and SEO optimization."', '"mistral-small-latest"', '"0.7"'],
            description: 'Generate blog post using AI'
          },
          {
            id: 4,
            command: 'output',
            args: ['step 3', '"markdown"', '"Complete Blog Post"'],
            description: 'Export SEO-optimized blog post'
          }
        );
        break;

      case 'data_analysis_agent':
        steps.push(
          {
            id: 1,
            command: 'input',
            args: ['"data_description"', '"textarea"', '"Describe your data or paste data samples"'],
            description: 'Collect data information from user'
          },
          {
            id: 2,
            command: 'input',
            args: ['"analysis_goals"', '"textarea"', '"What insights are you looking for?"'],
            description: 'Collect analysis objectives'
          },
          {
            id: 3,
            command: 'generate',
            args: ['"Analyze the following data: " + data_description + ". Analysis goals: " + analysis_goals + ". Provide key findings, patterns, statistical insights, trends, actionable recommendations, and next steps."', '"mistral-small-latest"', '"0.4"'],
            description: 'Perform data analysis using AI'
          },
          {
            id: 4,
            command: 'output',
            args: ['step 3', '"markdown"', '"Data Analysis Report"'],
            description: 'Export comprehensive analysis report'
          }
        );
        break;

      case 'study_assistant_agent':
        steps.push(
          {
            id: 1,
            command: 'input',
            args: ['"topic"', '"text"', '"Enter the subject or topic to study"'],
            description: 'Collect study topic from user'
          },
          {
            id: 2,
            command: 'input',
            args: ['"level"', '"select"', '"Select your current level: beginner, intermediate, advanced"'],
            description: 'Collect learning level'
          },
          {
            id: 3,
            command: 'generate',
            args: ['"Create comprehensive study materials for: " + topic + " at " + level + " level. Include key concepts, definitions, examples, practice questions, memory aids, and additional resources."', '"mistral-small-latest"', '"0.5"'],
            description: 'Generate study materials using AI'
          },
          {
            id: 4,
            command: 'output',
            args: ['step 3', '"markdown"', '"Complete Study Guide"'],
            description: 'Export structured study materials'
          }
        );
        break;

      case 'javascript_coding_agent':
        steps.push(
          {
            id: 1,
            command: 'input',
            args: ['"requirements"', '"textarea"', '"Describe what JavaScript code you need"'],
            description: 'Collect JavaScript coding requirements'
          },
          {
            id: 2,
            command: 'generate',
            args: ['"Write clean, modern JavaScript code for: " + requirements + ". Include proper ES6+ syntax, comments, error handling, and best practices for web development."', '"mistral-small-latest"', '"0.3"'],
            description: 'Generate JavaScript code using AI'
          },
          {
            id: 3,
            command: 'output',
            args: ['step 2', '"javascript"', '"Generated JavaScript Code"'],
            description: 'Export JavaScript code ready for use'
          }
        );
        break;

      case 'story_writing_agent':
        steps.push(
          {
            id: 1,
            command: 'input',
            args: ['"prompt"', '"textarea"', '"Enter your story idea or prompt"'],
            description: 'Collect story prompt from user'
          },
          {
            id: 2,
            command: 'input',
            args: ['"genre"', '"text"', '"What genre? (fantasy, sci-fi, mystery, etc.)"'],
            description: 'Collect story genre preference'
          },
          {
            id: 3,
            command: 'generate',
            args: ['"Write an engaging " + genre + " story based on: " + prompt + ". Include compelling characters, vivid descriptions, dialogue, and a satisfying narrative arc."', '"mistral-small-latest"', '"0.8"'],
            description: 'Generate story using AI'
          },
          {
            id: 4,
            command: 'output',
            args: ['step 3', '"text"', '"Your Creative Story"'],
            description: 'Export completed story'
          }
        );
        break;

      case 'email_assistant_agent':
        steps.push(
          {
            id: 1,
            command: 'input',
            args: ['"purpose"', '"text"', '"What is the purpose of this email?"'],
            description: 'Collect email purpose from user'
          },
          {
            id: 2,
            command: 'input',
            args: ['"tone"', '"select"', '"Select tone: professional, friendly, formal, casual"'],
            description: 'Collect desired tone'
          },
          {
            id: 3,
            command: 'generate',
            args: ['"Write a " + tone + " email for: " + purpose + ". Include appropriate subject line, greeting, clear message body, and professional closing."', '"mistral-small-latest"', '"0.6"'],
            description: 'Generate email using AI'
          },
          {
            id: 4,
            command: 'output',
            args: ['step 3', '"text"', '"Professional Email"'],
            description: 'Export formatted email'
          }
        );
        break;

      case 'translation_agent':
        steps.push(
          {
            id: 1,
            command: 'input',
            args: ['"source_language"', '"text"', '"Enter source language (e.g., English)"'],
            description: 'Collect source language from user'
          },
          {
            id: 2,
            command: 'input',
            args: ['"target_language"', '"text"', '"Enter target language (e.g., Malayalam)"'],
            description: 'Collect target language'
          },
          {
            id: 3,
            command: 'input',
            args: ['"text_to_translate"', '"textarea"', '"Enter text to translate"'],
            description: 'Collect text for translation'
          },
          {
            id: 4,
            command: 'generate',
            args: ['"You are a professional translator. TRANSLATE IMMEDIATELY from " + source_language + " to " + target_language + ": " + text_to_translate + ". Provide ONLY the direct translation, no explanations or suggestions for other tools."', '"mistral-small-latest"', '"0.2"'],
            description: 'Translate text using AI'
          },
          {
            id: 5,
            command: 'output',
            args: ['step 4', '"text"', '"Translated Text"'],
            description: 'Export translated text'
          }
        );
        break;

      case 'content_generation':
        steps.push(
          {
            id: 1,
            command: 'input',
            args: ['"topic"', '"text"', '"Enter topic to write about"'],
            description: 'Collect topic from user'
          },
          {
            id: 2,
            command: 'generate',
            args: ['"Write content about " + topic', '"mistral-small-latest"', '"0.7"'],
            description: 'Generate content using AI'
          },
          {
            id: 3,
            command: 'output',
            args: ['step 2', '"pdf"', '"generated_content"'],
            description: 'Export generated content as PDF'
          }
        );
        break;

      case 'data_processing':
        steps.push(
          {
            id: 1,
            command: 'fetch',
            args: ['"https://api.example.com/data"'],
            description: 'Fetch data from API'
          },
          {
            id: 2,
            command: 'transform',
            args: ['step 1', '"json"'],
            description: 'Transform data format'
          },
          {
            id: 3,
            command: 'output',
            args: ['step 2', '"csv"', '"processed_data"'],
            description: 'Export processed data'
          }
        );
        break;

      case 'notification':
        steps.push(
          {
            id: 1,
            command: 'input',
            args: ['"message"', '"text"', '"Enter message to send"'],
            description: 'Get message content'
          },
          {
            id: 2,
            command: 'send_email',
            args: ['"recipient@example.com"', 'message'],
            description: 'Send email notification'
          }
        );
        break;

      default:
        steps.push({
          id: 1,
          command: 'print',
          args: ['"Workflow created from natural language"'],
          description: 'Basic workflow step'
        });
        break;
    }

    return steps;
  }

  /**
   * Generate step description
   */
  private generateStepDescription(command: string, args: string[]): string {
    switch (command) {
      case 'input':
        return `Collect ${args[0] || 'input'} from user`;
      case 'generate':
        return `Generate content using AI`;
      case 'fetch':
        return `Fetch data from ${args[0] || 'source'}`;
      case 'output':
        return `Export result as ${args[1] || 'file'}`;
      case 'send_email':
        return `Send email to ${args[0] || 'recipient'}`;
      case 'validate':
        return `Validate ${args[1] || 'data'}`;
      case 'transform':
        return `Transform data to ${args[1] || 'format'}`;
      default:
        return `Execute ${command}`;
    }
  }

  /**
   * Generate DSL from steps
   */
  private generateDSL(steps: DSLStep[], intent: WorkflowIntent): string {
    const workflowName = this.generateWorkflowName(intent);
    let dsl = `workflow "${workflowName}" {\n`;

    // Add common variables
    if (intent.type === 'content_generation') {
      dsl += `    let ai_model = "mistral"\n`;
      dsl += `    let temperature = "0.7"\n\n`;
    }

    // Add steps
    steps.forEach(step => {
      const argsStr = step.args.join(', ');
      dsl += `    step ${step.id}: ${step.command}(${argsStr})\n`;
    });

    dsl += '}';
    return dsl;
  }

  /**
   * Extract generation topic from message
   */
  private extractGenerationTopic(message: string): string {
    const patterns = [
      /(?:write|generate|create|compose|draft) (?:a |an )?(?:blog post|article|content|post|story|text) (?:about |on |regarding |concerning )([^,.]+)/i,
      /(?:write|generate|create) (?:about |on )([^,.]+)/i,
      /(?:blog post|article|content) (?:about |on )([^,.]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return 'content';
  }

  /**
   * Extract output format from message
   */
  private extractOutputFormat(message: string): string {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('pdf')) return 'pdf';
    if (lowerMessage.includes('docx') || lowerMessage.includes('word')) return 'docx';
    if (lowerMessage.includes('xlsx') || lowerMessage.includes('excel')) return 'xlsx';
    if (lowerMessage.includes('csv')) return 'csv';
    if (lowerMessage.includes('json')) return 'json';
    if (lowerMessage.includes('markdown') || lowerMessage.includes('md')) return 'markdown';
    return 'text';
  }

  /**
   * Extract filename from message
   */
  private extractFilename(message: string): string {
    const patterns = [
      /(?:save|export|create|name) (?:as |to |it )?(?:a )?(?:file )?(?:named |called )?([^,.]+)/i,
      /filename[:\s]+([^,.]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].trim().replace(/['"]/g, '');
      }
    }
    
    return 'output';
  }

  /**
   * Extract email recipient from message
   */
  private extractEmailRecipient(message: string): string | null {
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    const match = message.match(emailPattern);
    return match ? match[1] : null;
  }

  /**
   * Generate workflow name from intent
   */
  private generateWorkflowName(intent: WorkflowIntent): string {
    const names = {
      python_coding_agent: 'Python Coding Agent',
      poem_writing_agent: 'Poem Writing Agent',
      blog_writing_agent: 'Blog Writing Agent',
      data_analysis_agent: 'Data Analysis Agent',
      study_assistant_agent: 'Study Assistant Agent',
      javascript_coding_agent: 'JavaScript Coding Agent',
      story_writing_agent: 'Story Writing Agent',
      email_assistant_agent: 'Email Assistant Agent',
      translation_agent: 'Translation Agent',
      content_generation: 'AI Content Generator',
      data_processing: 'Data Processing Pipeline',
      notification: 'Notification System',
      analysis: 'Data Analysis Workflow',
      automation: 'Automation Pipeline'
    };
    return names[intent.type] || 'Custom Workflow';
  }

  /**
   * Get example messages for testing
   */
  getExampleMessages(): { message: string; description: string }[] {
    return [
      {
        message: "Make this agent a Python coding agent",
        description: "Creates a complete Python code generation workflow"
      },
      {
        message: "Create a poem writing agent",
        description: "Creates a poetry generator with topic input and creative output"
      },
      {
        message: "Make this agent a blog writing agent",
        description: "Creates a blog post generator with topic and audience inputs"
      },
      {
        message: "Create a data analysis agent",
        description: "Creates a data analyzer with input collection and report generation"
      },
      {
        message: "Make this agent a study assistant",
        description: "Creates an educational agent with topic and level inputs"
      },
      {
        message: "Create a JavaScript coding agent",
        description: "Creates a JavaScript code generator workflow"
      },
      {
        message: "Make this agent a story writing agent",
        description: "Creates a creative story generator with prompt and genre inputs"
      },
      {
        message: "Create an email assistant agent",
        description: "Creates an email writing helper with purpose and tone inputs"
      },
      {
        message: "Make this a English to Malayalam translating agent",
        description: "Creates a translation agent with language and text inputs"
      },
      {
        message: "Create a translation agent",
        description: "Creates a language translation workflow with source/target language inputs"
      }
    ];
  }
}
