/**
 * Workflow Rust DSL Bridge
 * Converts ReactFlow nodes to Rust tmflow-DSL and generates human-readable steps
 */

interface ReactFlowNode {
  id: string;
  type: 'inputNode' | 'actionNode' | 'outputNode';
  data: any;
  position: { x: number; y: number };
}

interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

interface DSLVariable {
  name: string;
  value: string;
  type: string;
}

export class WorkflowRustDSLBridge {
  
  /**
   * Convert ReactFlow nodes and edges to Rust DSL format
   */
  convertToDSL(nodes: ReactFlowNode[], edges: ReactFlowEdge[]): string {
    if (nodes.length === 0) {
      return 'workflow "Empty Workflow" {\n    // No steps defined\n}';
    }

    const sortedNodes = this.sortNodesByFlow(nodes, edges);
    const workflowName = this.generateWorkflowName(sortedNodes);
    let dsl = `workflow "${workflowName}" {\n`;
    
    // Add variables
    const variables = this.extractVariables(sortedNodes);
    variables.forEach(variable => {
      dsl += `    let ${variable.name} = "${variable.value}"\n`;
    });
    
    if (variables.length > 0) dsl += '\n';
    
    // Add steps
    sortedNodes.forEach((node, index) => {
      const stepNum = index + 1;
      const command = this.nodeToCommand(node, stepNum, sortedNodes);
      dsl += `    step ${stepNum}: ${command}\n`;
    });
    
    dsl += '}';
    return dsl;
  }
  
  /**
   * Generate human-readable steps from DSL string
   */
  generateHumanSteps(dslString: string): string[] {
    const steps: string[] = [];
    const lines = dslString.split('\n');
    
    lines.forEach(line => {
      const stepMatch = line.trim().match(/step (\d+): (.+)/);
      if (stepMatch) {
        const stepNum = stepMatch[1];
        const command = stepMatch[2];
        const humanStep = this.commandToHuman(command, parseInt(stepNum));
        steps.push(`Step ${stepNum}: ${humanStep}`);
      }
    });
    
    return steps;
  }
  
  /**
   * Generate workflow execution plan
   */
  generateExecutionPlan(nodes: ReactFlowNode[]): {
    totalSteps: number;
    estimatedTime: string;
    complexity: 'Simple' | 'Medium' | 'Complex';
    description: string;
  } {
    const totalSteps = nodes.length;
    const hasAI = nodes.some(n => n.type === 'actionNode');
    const hasConditions = false; // TODO: Detect conditional logic
    
    let complexity: 'Simple' | 'Medium' | 'Complex' = 'Simple';
    let estimatedTime = '< 1 minute';
    
    if (totalSteps > 5 || hasConditions) {
      complexity = 'Complex';
      estimatedTime = '2-5 minutes';
    } else if (totalSteps > 2 || hasAI) {
      complexity = 'Medium';
      estimatedTime = '1-2 minutes';
    }
    
    const description = this.generateWorkflowDescription(nodes);
    
    return {
      totalSteps,
      estimatedTime,
      complexity,
      description
    };
  }
  
  /**
   * Sort nodes by workflow execution order
   */
  private sortNodesByFlow(nodes: ReactFlowNode[], edges: ReactFlowEdge[]): ReactFlowNode[] {
    // Simple sorting by position for now
    // In a more complex implementation, we'd build a dependency graph
    return nodes.sort((a, b) => {
      // Sort by type priority: input -> action -> output
      const typePriority = { inputNode: 1, actionNode: 2, outputNode: 3 };
      const aPriority = typePriority[a.type] || 999;
      const bPriority = typePriority[b.type] || 999;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // If same type, sort by position
      return a.position.x - b.position.x;
    });
  }
  
  /**
   * Extract variables from nodes
   */
  private extractVariables(nodes: ReactFlowNode[]): DSLVariable[] {
    const variables: DSLVariable[] = [];
    
    nodes.forEach(node => {
      if (node.type === 'inputNode' && node.data.variable) {
        variables.push({
          name: node.data.variable,
          value: node.data.defaultValue || '',
          type: node.data.inputType || 'text'
        });
      }
      
      if (node.type === 'actionNode') {
        if (node.data.model) {
          variables.push({
            name: 'ai_model',
            value: node.data.model,
            type: 'string'
          });
        }
        if (node.data.temperature) {
          variables.push({
            name: 'temperature',
            value: node.data.temperature.toString(),
            type: 'number'
          });
        }
      }
    });
    
    return variables;
  }
  
  /**
   * Convert individual node to DSL command
   */
  private nodeToCommand(node: ReactFlowNode, stepNum: number, allNodes: ReactFlowNode[]): string {
    switch (node.type) {
      case 'inputNode':
        const variable = node.data.variable || node.data.label || 'user_input';
        const inputType = node.data.inputType || 'text';
        const placeholder = node.data.placeholder || node.data.label || 'Enter value';
        return `input("${variable}", "${inputType}", "${placeholder}")`;
      
      case 'actionNode':
        const prompt = node.data.prompt || 'Generate content';
        const model = node.data.model || 'mistral';
        const temperature = node.data.temperature || '0.7';
        
        // Check if there's an input reference
        const inputRef = this.findInputReference(node, stepNum, allNodes);
        const promptWithVar = inputRef ? prompt.replace(/\{([^}]+)\}/g, '" + $1 + "') : prompt;
        
        return `generate("${promptWithVar}", "${model}", "${temperature}")`;
      
      case 'outputNode':
        const format = node.data.fileType || 'text';
        const title = node.data.title || node.data.label || 'output';
        const dataRef = stepNum > 1 ? `step ${stepNum - 1}` : 'data';
        return `output(${dataRef}, "${format}", "${title}")`;
      
      default:
        return 'print("Unknown step")';
    }
  }
  
  /**
   * Find input reference for a node
   */
  private findInputReference(node: ReactFlowNode, stepNum: number, allNodes: ReactFlowNode[]): string | null {
    // Look for input nodes before this step
    const inputNodes = allNodes.filter((n, index) => 
      n.type === 'inputNode' && index < stepNum - 1
    );
    
    if (inputNodes.length > 0) {
      return inputNodes[inputNodes.length - 1].data.variable || 'input';
    }
    
    return null;
  }
  
  /**
   * Convert DSL command to human-readable description
   */
  private commandToHuman(command: string, stepNum: number): string {
    if (command.startsWith('input(')) {
      const match = command.match(/input\("([^"]*)",\s*"([^"]*)",\s*"([^"]*)"\)/);
      if (match) {
        const [, variable, type, placeholder] = match;
        return `Collect "${variable}" from user (${type} input)`;
      }
    }
    
    if (command.startsWith('generate(')) {
      const match = command.match(/generate\("([^"]*)",\s*"([^"]*)",\s*"([^"]*)"\)/);
      if (match) {
        const [, prompt, model, temperature] = match;
        return `Generate AI response using ${model} (temp: ${temperature}) with prompt: "${prompt}"`;
      }
    }
    
    if (command.startsWith('output(')) {
      const match = command.match(/output\([^,]+,\s*"([^"]*)",\s*"([^"]*)"\)/);
      if (match) {
        const [, format, filename] = match;
        return `Export result as ${format} file named "${filename}"`;
      }
    }
    
    if (command.startsWith('validate(')) {
      const match = command.match(/validate\([^,]+,\s*"([^"]*)"\)/);
      if (match) {
        const [, validationType] = match;
        return `Validate input for ${validationType}`;
      }
    }
    
    if (command.startsWith('transform(')) {
      const match = command.match(/transform\([^,]+,\s*"([^"]*)"\)/);
      if (match) {
        const [, transformation] = match;
        return `Transform data to ${transformation} format`;
      }
    }
    
    return `Execute: ${command}`;
  }
  
  /**
   * Generate workflow name from nodes
   */
  private generateWorkflowName(nodes: ReactFlowNode[]): string {
    const hasAI = nodes.some(n => n.type === 'actionNode');
    const hasInput = nodes.some(n => n.type === 'inputNode');
    const hasOutput = nodes.some(n => n.type === 'outputNode');
    
    if (hasAI && hasInput && hasOutput) {
      return 'AI Content Generator';
    } else if (hasAI) {
      return 'AI Workflow';
    } else if (hasInput && hasOutput) {
      return 'Data Processing Workflow';
    } else {
      return 'Custom Workflow';
    }
  }
  
  /**
   * Generate workflow description
   */
  private generateWorkflowDescription(nodes: ReactFlowNode[]): string {
    const inputNodes = nodes.filter(n => n.type === 'inputNode');
    const actionNodes = nodes.filter(n => n.type === 'actionNode');
    const outputNodes = nodes.filter(n => n.type === 'outputNode');
    
    let description = 'This workflow ';
    
    if (inputNodes.length > 0) {
      const inputs = inputNodes.map(n => n.data.label || 'input').join(', ');
      description += `collects ${inputs} from the user, `;
    }
    
    if (actionNodes.length > 0) {
      const models = actionNodes.map(n => n.data.model || 'AI').join(', ');
      description += `processes it using ${models}, `;
    }
    
    if (outputNodes.length > 0) {
      const formats = outputNodes.map(n => n.data.fileType || 'text').join(', ');
      description += `and exports the result as ${formats}.`;
    }
    
    return description.replace(/, $/, '.');
  }
  
  /**
   * Validate workflow structure
   */
  validateWorkflow(nodes: ReactFlowNode[], edges: ReactFlowEdge[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check for at least one node
    if (nodes.length === 0) {
      errors.push('Workflow must have at least one node');
    }
    
    // Check for proper flow
    const hasInput = nodes.some(n => n.type === 'inputNode');
    const hasAction = nodes.some(n => n.type === 'actionNode');
    const hasOutput = nodes.some(n => n.type === 'outputNode');
    
    if (!hasInput) {
      warnings.push('Consider adding an input node to collect user data');
    }
    
    if (!hasOutput) {
      warnings.push('Consider adding an output node to display results');
    }
    
    if (hasAction && !hasInput) {
      warnings.push('AI actions work best with user input');
    }
    
    // Check node configurations
    nodes.forEach((node, index) => {
      if (node.type === 'actionNode' && !node.data.prompt) {
        errors.push(`Action node ${index + 1} is missing a prompt`);
      }
      
      if (node.type === 'inputNode' && !node.data.label) {
        warnings.push(`Input node ${index + 1} should have a label`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
