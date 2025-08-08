"use client";
import React, { useCallback, useState, useEffect, useRef } from "react";
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import ProtectedLayout from '@/components/Layout/ProtectedLayout';
import { FaRobot, FaMagic, FaFeather, FaBrain, FaGoogle } from "react-icons/fa";
import { MdOutlineWeb, MdCode, MdMemory, MdAttachFile, MdCalculate } from "react-icons/md";
import { FiTrash2, FiPlus, FiMail, FiFileText, FiZap, FiChevronDown, FiArrowLeft, FiEdit2 } from 'react-icons/fi';
import jsPDF from 'jspdf';
import CreateAgentModal from "../CreateAgentModal";
import { useAuth } from '@/contexts/AuthContext';

const initialNodes: Node[] = [
  {
    id: "1",
    type: "input",
    data: { label: "Input (e.g., User Prompt)" },
    position: { x: 100, y: 100 },
  },
  {
    id: "2",
    data: { label: "AI Action (e.g., Generate Text)" },
    position: { x: 400, y: 100 },
  },
  {
    id: "3",
    type: "output",
    data: { label: "Output (e.g., Response)" },
    position: { x: 700, y: 100 },
  },
];

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e2-3", source: "2", target: "3", animated: true },
  { id: "e1-3", source: "1", target: "3", animated: true },
];

const AI_MODELS = [
  { label: "OpenAI GPT-4", value: "openai-gpt4", icon: <FaRobot className="inline mr-2 text-emerald-600" /> },
  { label: "Mistral", value: "mistral", icon: <FaMagic className="inline mr-2 text-indigo-500" /> },
  { label: "Ollama", value: "ollama", icon: <FaFeather className="inline mr-2 text-orange-500" /> },
  { label: "Anthropic Claude", value: "claude", icon: <FaBrain className="inline mr-2 text-purple-500" /> },
  { label: "Google Gemini", value: "gemini", icon: <FaGoogle className="inline mr-2 text-blue-500" /> },
];

const AGENT_TOOLS = [
  { label: "Web Search", value: "web-search", icon: <MdOutlineWeb className="inline text-blue-500 mr-1" /> },
  { label: "Code Interpreter", value: "code-interpreter", icon: <MdCode className="inline text-green-600 mr-1" /> },
  { label: "Memory", value: "memory", icon: <MdMemory className="inline text-purple-500 mr-1" /> },
  { label: "File Upload", value: "file-upload", icon: <MdAttachFile className="inline text-gray-500 mr-1" /> },
  { label: "Math", value: "math", icon: <MdCalculate className="inline text-yellow-500 mr-1" /> },
];

// Custom Node Components
function InputNode({ data, id, selected, deleteNode, onEdit }: any) {
  return (
    <div className={`rounded-2xl border bg-white shadow-xl hover:shadow-2xl px-0 py-0 w-[340px] min-h-[120px] flex flex-col transition-all duration-300 transform hover:scale-105 ${selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}
      style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Top label and delete button */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1 relative">
        <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">Input</span>
        <button onClick={() => deleteNode(id)} className="absolute right-2 top-2 text-gray-300 hover:text-red-500 p-1 rounded transition" title="Delete Node"><FiTrash2 size={18} /></button>
      </div>
      {/* User-provided content */}
      <div className="px-4 flex flex-col gap-1">
        <div className="flex items-center gap-2 mt-1">
          <FiFileText className="text-gray-700" size={20} />
          <span className="font-semibold text-base">{data.label || <span className='text-gray-400 font-normal'>Label</span>}</span>
        </div>
        <div className="mt-2">
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-gray-50"
            placeholder={data.placeholder || 'Enter value...'}
            disabled
          />
        </div>
      </div>
      {/* Bottom row: time indicator */}
      <div className="flex items-center px-4 pb-2 pt-1 mt-auto">
        <span className="bg-gray-100 text-gray-500 text-xs rounded-full px-2 py-0.5 flex items-center gap-1">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="inline mr-1"><circle cx="12" cy="12" r="10" stroke="#D1D5DB" strokeWidth="2"/><path d="M12 7v5l3 3" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/></svg>
          0.0 sec
        </span>
        <div className="flex-1" />
      </div>
      <Handle type="source" position={Position.Right} className="!w-6 !h-6 !bg-gradient-to-r !from-blue-500 !to-blue-600 !border-2 !border-white !shadow-xl" />
    </div>
  );
}

function ActionNode({ data, id, selected, deleteNode }: any) {
  return (
    <div className={`rounded-2xl border bg-white shadow-xl hover:shadow-2xl px-0 py-0 w-[340px] min-h-[120px] flex flex-col transition-all duration-300 transform hover:scale-105 ${selected ? 'border-yellow-500 ring-2 ring-yellow-200' : 'border-gray-200'}`}
      style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Top label and delete button */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1 relative">
        <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"><FiZap className="inline mr-1" />Action</span>
        <button onClick={() => deleteNode(id)} className="absolute right-2 top-2 text-gray-300 hover:text-red-500 p-1 rounded transition" title="Delete Node"><FiTrash2 size={18} /></button>
      </div>
      {/* User-provided content */}
      <div className="px-4 flex flex-col gap-1">
        <div className="flex items-center gap-2 mt-1">
          <FiZap className="text-yellow-500" size={20} />
          <span className="font-semibold text-base">{data.title || <span className='text-gray-400 font-normal'>New Action</span>}</span>
        </div>
        {/* Show prompt/model/tokens if present */}
        {(data.prompt || data.model) && (
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2 mb-2 mt-1 w-full">
            {data.prompt && <div className="text-xs text-yellow-700 font-semibold mb-1">Prompt: <span className="font-normal text-gray-700">{data.prompt}</span></div>}
            {data.model && <div className="text-xs text-yellow-700 font-semibold mb-1">Model: <span className="font-mono text-gray-700">{data.model}</span></div>}
            {data.tokens && <div className="text-xs text-yellow-700 font-semibold">Tokens: <span className="text-gray-700">{data.tokens}</span></div>}
          </div>
        )}
      </div>
      {/* Bottom row: time indicator */}
      <div className="flex items-center px-4 pb-2 pt-1 mt-auto">
        <span className="bg-gray-100 text-gray-500 text-xs rounded-full px-2 py-0.5 flex items-center gap-1">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="inline mr-1"><circle cx="12" cy="12" r="10" stroke="#FDE68A" strokeWidth="2"/><path d="M12 7v5l3 3" stroke="#F59E42" strokeWidth="2" strokeLinecap="round"/></svg>
          0.0 sec
        </span>
        <div className="flex-1" />
      </div>
      <Handle type="target" position={Position.Left} className="!w-6 !h-6 !bg-gradient-to-r !from-yellow-500 !to-yellow-600 !border-2 !border-white !shadow-xl" />
      <Handle type="source" position={Position.Right} className="!w-6 !h-6 !bg-gradient-to-r !from-yellow-500 !to-yellow-600 !border-2 !border-white !shadow-xl" />
    </div>
  );
}

function OutputNode({ data, id, selected, deleteNode }: any) {
  return (
    <div className={`rounded-2xl border bg-white shadow-xl hover:shadow-2xl px-0 py-0 w-[340px] min-h-[120px] flex flex-col transition-all duration-300 transform hover:scale-105 ${selected ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200'}`}
      style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Top label and delete button */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1 relative">
        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"><FiMail className="inline mr-1" />Output</span>
        <button onClick={() => deleteNode(id)} className="absolute right-2 top-2 text-gray-300 hover:text-red-500 p-1 rounded transition" title="Delete Node"><FiTrash2 size={18} /></button>
      </div>
      {/* User-provided content */}
      <div className="px-4 flex flex-col gap-1">
        <div className="flex items-center gap-2 mt-1">
          <FiMail className="text-green-600" size={20} />
          <span className="font-semibold text-base">{data.title || <span className='text-gray-400 font-normal'>Title</span>}</span>
        </div>
        {/* File type/description if present */}
        {data.fileType && (
          <div className="bg-green-50 rounded px-2 py-1 text-xs flex items-center gap-1 mb-1">
            <FiFileText className="text-green-400" />
            <span>{data.fileType}</span>
          </div>
        )}
        {data.fileDescription && <div className="text-xs text-gray-400">{data.fileDescription}</div>}
        {/* Show generated output if present */}
        {data.value && (
          <div className="mt-2 p-3 bg-gray-50 rounded text-gray-800 whitespace-pre-line text-sm border border-gray-200">
            {data.value}
          </div>
        )}
      </div>
      {/* Bottom row: time indicator */}
      <div className="flex items-center px-4 pb-2 pt-1 mt-auto">
        <span className="bg-gray-100 text-gray-500 text-xs rounded-full px-2 py-0.5 flex items-center gap-1">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="inline mr-1"><circle cx="12" cy="12" r="10" stroke="#6EE7B7" strokeWidth="2"/><path d="M12 7v5l3 3" stroke="#059669" strokeWidth="2" strokeLinecap="round"/></svg>
          0.0 sec
        </span>
        <div className="flex-1" />
      </div>
      <Handle type="target" position={Position.Left} className="!w-6 !h-6 !bg-gradient-to-r !from-green-500 !to-green-600 !border-2 !border-white !shadow-xl" />
      <Handle type="source" position={Position.Right} className="!w-6 !h-6 !bg-gradient-to-r !from-green-500 !to-green-600 !border-2 !border-white !shadow-xl" />
    </div>
  );
}

const nodeTypes = {
  inputNode: (props: any) => <InputNode {...props} deleteNode={props.data.deleteNode} onEdit={props.data.onEdit} />, 
  actionNode: (props: any) => <ActionNode {...props} deleteNode={props.data.deleteNode} />, 
  outputNode: (props: any) => <OutputNode {...props} deleteNode={props.data.deleteNode} />,
};

// Helper to generate unique IDs
function genId() {
  return Math.random().toString(36).substr(2, 9);
}

// Edit Node Modal
function EditNodeModal({ node, open, onClose, onSave }: any) {
  const [form, setForm] = useState(node?.data || {});
  if (!open || !node) return null;
  const isAction = node.type === 'actionNode';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={onClose}>&times;</button>
        <h3 className="text-lg font-bold mb-4">Edit Node</h3>
        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="flex flex-col gap-3">
          <label className="text-sm font-semibold">Title
            <input className="w-full border rounded px-2 py-1 mt-1" value={form.title || ''} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))} />
          </label>
          <label className="text-sm font-semibold">Description
            <input className="w-full border rounded px-2 py-1 mt-1" value={form.description || ''} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} />
          </label>
          {isAction && (
            <>
              <label className="text-sm font-semibold">Prompt
                <textarea className="w-full border rounded px-2 py-1 mt-1" value={form.prompt || ''} onChange={e => setForm((f: any) => ({ ...f, prompt: e.target.value }))} />
              </label>
              <label className="text-sm font-semibold">Model
                <input className="w-full border rounded px-2 py-1 mt-1" value={form.model || ''} onChange={e => setForm((f: any) => ({ ...f, model: e.target.value }))} />
              </label>
              <label className="text-sm font-semibold">Tokens
                <input type="number" className="w-full border rounded px-2 py-1 mt-1" value={form.tokens || ''} onChange={e => setForm((f: any) => ({ ...f, tokens: e.target.value }))} />
              </label>
            </>
          )}
          {node.type !== 'actionNode' && (
            <>
              <label className="text-sm font-semibold">File Type
                <input className="w-full border rounded px-2 py-1 mt-1" value={form.fileType || ''} onChange={e => setForm((f: any) => ({ ...f, fileType: e.target.value }))} />
              </label>
              <label className="text-sm font-semibold">File Description
                <input className="w-full border rounded px-2 py-1 mt-1" value={form.fileDescription || ''} onChange={e => setForm((f: any) => ({ ...f, fileDescription: e.target.value }))} />
              </label>
            </>
          )}
          <button type="submit" className="mt-2 bg-emerald-600 text-white px-4 py-2 rounded font-semibold hover:bg-emerald-700">Save</button>
        </form>
      </div>
    </div>
  );
}

export default function CreateAgentWorkflowPage() {
  // Start with no nodes
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Sidebar state
  const [model, setModel] = useState(AI_MODELS[0].value);
  const [promptSeed, setPromptSeed] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [tools, setTools] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // Edit Node state
  const [editNode, setEditNode] = useState<Node<any, string | undefined> | null>(null);

  // Add content state
  const [content, setContent] = useState('');
  const [loadingContent, setLoadingContent] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [runLoading, setRunLoading] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');

  // Add state for new fields at the top of the component
  const [saveDescription, setSaveDescription] = useState('');
  const [saveCredits, setSaveCredits] = useState('');

  // Add state for workflow id (edit mode)
  const [workflowId, setWorkflowId] = useState<string | null>(null);

  // Add state for dialog
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const dialogTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save/Deploy handler
  const handleSaveDeploy = () => {
    const agentConfig = {
      model,
      promptSeed,
      temperature,
      maxTokens,
      tools,
      workflow: { nodes, edges },
    };
    localStorage.setItem('workflow-agent', JSON.stringify(agentConfig));
    alert("Agent config saved!\n" + JSON.stringify(agentConfig, null, 2));
  };

  const handleToolToggle = (tool: string) => {
    setTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  // Add node
  function handleAddNode(type: string) {
    const newId = genId();
    let newNode: any = { id: newId, position: { x: 200, y: 200 }, data: { deleteNode: handleDeleteNode } };
    if (type === 'inputNode') {
      newNode = {
        ...newNode,
        type: 'inputNode',
        data: {
          ...newNode.data,
          label: '',
          inputType: 'text',
          placeholder: '',
          variable: '',
          defaultValue: '',
          required: false,
          title: '',
          description: '',
          value: '',
        },
      };
    } else if (type === 'actionNode') {
      newNode = {
        ...newNode,
        type: 'actionNode',
        data: {
          ...newNode.data,
          label: '',
          prompt: '{topic}',
          model: 'mistral',
          temperature: 1,
          maxTokens: 256,
          outputFormat: 'text',
          title: '',
          description: '',
        },
      };
    } else if (type === 'outputNode') {
      newNode = {
        ...newNode,
        type: 'outputNode',
        data: {
          ...newNode.data,
          label: '',
          displayFormat: 'plain',
          title: '',
          description: '',
        },
      };
    }
    setNodes((nds) => [...nds, newNode]);
  }

  // Delete node
  function handleDeleteNode(id: string) {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  }

  function handleEditNodeSave(form: any) {
    if (!editNode || !('id' in editNode)) return;
    setNodes(nds => nds.map(n => n.id === editNode.id ? { ...n, data: { ...n.data, ...form, deleteNode: handleDeleteNode } } : n));
    setEditNode(null);
  }

  // Add function to run workflow
  async function runWorkflow() {
    setLoadingContent(true);
    setContent('');
    try {
      const res = await fetch('/api/mistral-poem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Generate content about ${inputValue}` }),
      });
      const data = await res.json();
      setContent(data.output || '');
    } catch (err) {
      setContent('Error generating content.');
    } finally {
      setLoadingContent(false);
    }
  }

  // Add function to export as PDF
  function exportContentAsPDF() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Generated Content', 10, 20);
    doc.setFontSize(12);
    doc.text(content, 10, 35);
    doc.save('content.pdf');
  }

  // On page load, if agent config exists, allow end user to use agent
  useEffect(() => {
    const saved = localStorage.getItem('workflow-agent');
    if (saved) {
      // Optionally, load agent config and show UI for end user
    }
  }, []);

  useEffect(() => {
    // Only load once, and only if there are no nodes yet
    if (typeof window !== 'undefined' && nodes.length === 0) {
      const loaded = localStorage.getItem('tm-loaded-workflow');
      if (loaded) {
        try {
          const { nodes: loadedNodes, edges: loadedEdges, id, name, description, credits, coverImage } = JSON.parse(loaded);
          setNodes(loadedNodes || []);
          setEdges(loadedEdges || []);
          if (id) setWorkflowId(id);
          if (name) setSaveName(name);
          if (description) setSaveDescription(description);
          if (credits) setSaveCredits(credits.toString());
          localStorage.removeItem('tm-loaded-workflow');
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
    // eslint-disable-next-line
  }, []);

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Handler for updating node data from sidebar form
  function handleSidebarNodeUpdate(form: any) {
    if (!selectedNode) return;
    setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, ...form, deleteNode: handleDeleteNode } } : n));
    setSelectedNode(null);
  }

  function handleRunWorkflowClick() {
    const inputNode = nodes.find(n => n.type === 'inputNode');
    const actionNode = nodes.find(n => n.type === 'actionNode');
    const outputNode = nodes.find(n => n.type === 'outputNode');
    if (!inputNode || !actionNode || !outputNode) {
      setRunError('Please ensure you have an input, action, and output node.');
      return;
    }
    const prompt = (actionNode.data.prompt || '').replace('{input}', inputNode.data.value || '');
    const model = 'mistral';
    const tokens = 256;
    handleRunWorkflow({ prompt, model, tokens, outputNodeId: outputNode.id });
  }

  async function handleRunWorkflow({ prompt, model, tokens, outputNodeId }: { prompt: string, model: string, tokens: number, outputNodeId: string }) {
    setRunLoading(true);
    setRunError(null);
    try {
      const response = await fetch('/api/mistral-poem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model, tokens }),
      });
      let responseBody = null;
      let errorMsg = null;
      try {
        responseBody = await response.json();
      } catch (e) {
        responseBody = await response.text();
      }
      setNodes(nds => nds.map(n => n.id === outputNodeId ? { ...n, data: { ...n.data, value: responseBody.poem } } : n));
    } catch (err: any) {
      setRunError('Failed to run workflow.');
    } finally {
      setRunLoading(false);
    }
  }

  const { user } = useAuth();
  const userId = String(user?.id || user?.ID || '');

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8002';
  const WORKFLOW_API_URL = `${API_BASE_URL}/api/workflows`;
  async function handleSaveWorkflow(name: string) {
    setSaveStatus(null);
    try {
      const method = workflowId ? 'PUT' : 'POST';
      const url = workflowId ? `${WORKFLOW_API_URL}/${workflowId}` : WORKFLOW_API_URL;
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId,
        },
        body: JSON.stringify({ name, nodes, edges }),
      });
      if (!res.ok) {
        const errText = await res.text();
        setSaveStatus('Failed to save workflow: ' + errText);
        setDialogMessage('Failed to save workflow: ' + errText);
        setShowDialog(true);
        if (dialogTimeoutRef.current) clearTimeout(dialogTimeoutRef.current);
        dialogTimeoutRef.current = setTimeout(() => setShowDialog(false), 2500);
        return;
      }
      setSaveStatus('Workflow saved!');
      setDialogMessage('Workflow saved!');
      setShowDialog(true);
      if (dialogTimeoutRef.current) clearTimeout(dialogTimeoutRef.current);
      dialogTimeoutRef.current = setTimeout(() => setShowDialog(false), 2000);
      setTimeout(() => {
        setShowSaveModal(false);
        setSaveStatus(null);
        setSaveName('');
      }, 1200);
    } catch (err: any) {
      setSaveStatus('Failed to save workflow: ' + (err.message || err));
      setDialogMessage('Failed to save workflow: ' + (err.message || err));
      setShowDialog(true);
      if (dialogTimeoutRef.current) clearTimeout(dialogTimeoutRef.current);
      dialogTimeoutRef.current = setTimeout(() => setShowDialog(false), 2500);
    }
  }

  // Enhanced save function with Cloudinary support
  async function handleSaveWorkflowWithCloudinary(
    name: string, 
    coverImage: string | null, 
    description: string, 
    credits: string
  ) {
    setSaveStatus(null);
    try {
      const method = workflowId ? 'PUT' : 'POST';
      const url = workflowId ? `${WORKFLOW_API_URL}/${workflowId}` : WORKFLOW_API_URL;
      
      const workflowData = {
        name,
        description,
        credits: parseInt(credits) || 0,
        nodes,
        edges,
        coverImage, // This will be the Cloudinary URL
      };

      console.log('🚀 Saving workflow with Cloudinary image:', workflowData);

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId,
        },
        body: JSON.stringify(workflowData),
      });

      if (!res.ok) {
        const errText = await res.text();
        setSaveStatus('Failed to save workflow: ' + errText);
        setDialogMessage('Failed to save workflow: ' + errText);
        setShowDialog(true);
        if (dialogTimeoutRef.current) clearTimeout(dialogTimeoutRef.current);
        dialogTimeoutRef.current = setTimeout(() => setShowDialog(false), 2500);
        return;
      }

      setSaveStatus('Workflow saved with Cloudinary image!');
      setDialogMessage('Workflow saved successfully!');
      setShowDialog(true);
      if (dialogTimeoutRef.current) clearTimeout(dialogTimeoutRef.current);
      dialogTimeoutRef.current = setTimeout(() => setShowDialog(false), 2000);
      
      setTimeout(() => {
        setShowSaveModal(false);
        setSaveStatus(null);
        setSaveName('');
      }, 1200);
    } catch (err: any) {
      setSaveStatus('Failed to save workflow: ' + (err.message || err));
      setDialogMessage('Failed to save workflow: ' + (err.message || err));
      setShowDialog(true);
      if (dialogTimeoutRef.current) clearTimeout(dialogTimeoutRef.current);
      dialogTimeoutRef.current = setTimeout(() => setShowDialog(false), 2500);
    }
  }



  return (
    <ProtectedLayout hideTopBar>
      <div className="min-h-screen w-full flex bg-white">
          {/* Main Workflow Area */}
          <div className="flex-1 relative flex flex-col p-6">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Create AI Agent Workflow</h1>
                <p className="text-gray-600">Design and configure your AI agent's workflow</p>
              </div>
              <div className="bg-white shadow-lg flex gap-4 px-8 py-4 border border-gray-200">
                <button 
                  onClick={() => handleAddNode('inputNode')} 
                  className="flex items-center gap-3 px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <FiPlus className="w-5 h-5" />
                  <span className="text-sm">Input</span>
                </button>
                <button 
                  onClick={() => handleAddNode('actionNode')} 
                  className="flex items-center gap-3 px-6 py-3 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-bold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <FiPlus className="w-5 h-5" />
                  <span className="text-sm">Action</span>
                </button>
                <button 
                  onClick={() => handleAddNode('outputNode')} 
                  className="flex items-center gap-3 px-6 py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <FiPlus className="w-5 h-5" />
                  <span className="text-sm">Output</span>
                </button>
              </div>
            </div>
            
            {/* Save Workflow Modal */}
            <CreateAgentModal
              isOpen={showSaveModal}
              onClose={() => setShowSaveModal(false)}
                              onSave={({ coverImage, title, description, credits, coverImageUrl }) => {
                  // Use Cloudinary URL if available
                  const imageToSave = coverImageUrl;
                  
                  console.log("💾 Saving workflow with image:", {
                    title,
                    description,
                    credits,
                    coverImageUrl: imageToSave,
                    coverImageType: typeof imageToSave,
                    hasImage: !!imageToSave
                  });
                  
                  // Update the handleSaveWorkflow to include the Cloudinary URL
                  handleSaveWorkflowWithCloudinary(title, imageToSave, description, credits);
                  setShowSaveModal(false);
                }}
            />
            
            {runError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                {runError}
              </div>
            )}
            
            {/* Workflow Canvas */}
            <div className="flex-1 w-full bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 min-h-0 max-h-[80vh]">
              <ReactFlow
                nodes={nodes.map(n => ({ ...n, data: { ...n.data, deleteNode: handleDeleteNode, onEdit: (id: string) => setEditNode(nodes.find(node => node.id === id) || null) } }))}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
                nodeTypes={nodeTypes}
                onNodeClick={(_, node) => {
                  setSelectedNode(node);
                  setSidebarCollapsed(false);
                }}
                className="rounded-xl"
              >
                {/* <MiniMap /> */}
                <Controls className="bg-white rounded-xl shadow-lg border border-gray-200" />
                <Background className="bg-gray-50" />
              </ReactFlow>
            </div>
          </div>
          {/* Right Sidebar - Always visible but collapsed by default */}
          <div className="relative transition-all duration-300" style={{ width: sidebarCollapsed ? '80px' : '400px' }}>
            <aside className={`fixed right-0 top-0 h-screen bg-white/80 backdrop-blur-xl border-l border-white/20 shadow-2xl z-30 flex flex-col gap-6 transition-all duration-300 ${sidebarCollapsed ? 'w-20 p-4' : 'w-[400px] p-8'}`}>
              <div className="flex items-center justify-between mb-6 relative">
                <div className={`bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent transition-all duration-300 ${sidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                  <h2 className="text-3xl font-bold">Node Configuration</h2>
                  <p className="text-gray-500 text-sm mt-1">Configure your workflow node settings</p>
                </div>
                                  <button 
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)} 
                    className={`absolute top-8 p-1.5 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors ${sidebarCollapsed ? '-left-8' : '-left-12'}`}
                  >
                  {sidebarCollapsed ? (
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              </div>
              {/* Node Edit Form - Only show when expanded and node is selected */}
              {!sidebarCollapsed && selectedNode && (
                <SidebarNodeEditForm node={selectedNode} onSave={handleSidebarNodeUpdate} onCancel={() => setSelectedNode(null)} runWorkflow={handleRunWorkflowClick} runLoading={runLoading} onShowSaveModal={() => { if (!workflowId) setShowSaveModal(true); else handleSaveWorkflow(saveName || 'Untitled Workflow'); }} />
              )}
            </aside>
          </div>
        </div>
        {/* Edit Node Modal */}
        <EditNodeModal node={editNode} open={!!editNode} onClose={() => setEditNode(null)} onSave={handleEditNodeSave} />
        {showDialog && (
  <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 bg-white border border-gray-300 shadow-lg rounded-lg px-6 py-4 text-lg font-semibold text-center text-emerald-700 animate-fade-in-out">
    {dialogMessage}
  </div>
)}
    </ProtectedLayout>
  );
}

// SidebarNodeEditForm: renders a form for editing a node's fields
function SidebarNodeEditForm({ node, onSave, onCancel, runWorkflow, runLoading, onShowSaveModal }: { node: Node, onSave: (form: any) => void, onCancel: () => void, runWorkflow?: () => void, runLoading?: boolean, onShowSaveModal?: () => void }) {
  const [form, setForm] = useState(node.data || {});
  useEffect(() => { setForm(node.data || {}); }, [node]);
  const isAction = node.type === 'actionNode';
  const isInput = node.type === 'inputNode';
  const isOutput = node.type === 'outputNode';
  const mistralConfig = {
    prompt: 'Generate content about {input}',
    model: 'mistral',
    tokens: 256,
  };

  // Export logic for Output node
  function handleExport() {
    if (!form.value) return;
    const fileType = (form.fileType || 'pdf').toLowerCase();
    if (fileType === 'pdf') {
      import('jspdf').then(({ default: jsPDF }) => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(form.title || 'Generated Output', 10, 20);
        doc.setFontSize(12);
        doc.text(form.value, 10, 35);
        doc.save((form.title || 'output') + '.pdf');
      });
    } else if (fileType === 'docx') {
      import('docx').then(docx => {
        const { Document, Packer, Paragraph, TextRun } = docx;
        const doc = new Document({
          sections: [
            {
              properties: {},
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: form.title || 'Generated Output', bold: true, size: 32 }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: form.value, size: 24 }),
                  ],
                }),
              ],
            },
          ],
        });
        Packer.toBlob(doc).then(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = (form.title || 'output') + '.docx';
          a.click();
          URL.revokeObjectURL(url);
        });
      });
    } else if (fileType === 'xlsx') {
      import('exceljs').then(ExcelJS => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sheet1');
        
        // Add data to worksheet
        worksheet.addRow([form.title || 'Generated Output']);
        worksheet.addRow([form.value]);
        
        // Generate and download file
        workbook.xlsx.writeBuffer().then((buffer: any) => {
          const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = (form.title || 'output') + '.xlsx';
          a.click();
          URL.revokeObjectURL(url);
        });
      });
    } else {
      alert('Unsupported file type: ' + fileType);
    }
  }

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="flex flex-col gap-5">
      {/* Node Type Summary */}
      <div className="mb-2">
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold mb-1 ${isInput ? 'bg-blue-100 text-blue-700' : isAction ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{isInput ? 'Input Node' : isAction ? 'Action Node' : 'Output Node'}</span>
        <h3 className="text-lg font-bold mt-1 mb-0.5">Node Options</h3>
        <p className="text-xs text-gray-400">{isInput ? 'User prompt for the workflow.' : isAction ? 'This node performs an action.' : 'Displays the generated output and allows export.'}</p>
      </div>
      {/* Editable for Input/Output, Readonly for Action */}
      <div className="flex flex-col gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
        {isInput && (
          <>
            <label className="text-sm font-semibold">Label
              <input className="w-full border border-gray-200 rounded-lg shadow-sm px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" value={form.label ?? ''} onChange={e => {
                const label = e.target.value;
                setForm((f: any) => ({ ...f, label, title: label, placeholder: f.placeholder || label }));
              }} placeholder="Label shown to end user" />
            </label>
            <label className="text-sm font-semibold">Input Type
              <select className="w-full border border-gray-200 rounded-lg shadow-sm px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" value={form.inputType ?? 'text'} onChange={e => setForm((f: any) => ({ ...f, inputType: e.target.value }))}>
                <option value="text">Text</option>
                <option value="textarea">Textarea</option>
                <option value="dropdown">Dropdown</option>
                <option value="multiselect">Multi-select</option>
                <option value="number">Number</option>
              </select>
            </label>
            <label className="text-sm font-semibold">Placeholder
              <input className="w-full border border-gray-200 rounded-lg shadow-sm px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" value={form.placeholder ?? ''} onChange={e => setForm((f: any) => ({ ...f, placeholder: e.target.value }))} placeholder="Placeholder text for input" />
            </label>
            <label className="text-sm font-semibold">Variable Name
              <input className="w-full border border-gray-200 rounded-lg shadow-sm px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" value={form.variable ?? ''} onChange={e => setForm((f: any) => ({ ...f, variable: e.target.value }))} placeholder="Variable name (e.g., topic)" />
            </label>
            <label className="text-sm font-semibold">Default Value
              <input className="w-full border border-gray-200 rounded-lg shadow-sm px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" value={form.defaultValue ?? ''} onChange={e => setForm((f: any) => ({ ...f, defaultValue: e.target.value }))} placeholder="Default value (optional)" />
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">Required?
              <input type="checkbox" className="ml-2" checked={!!form.required} onChange={e => setForm((f: any) => ({ ...f, required: e.target.checked }))} />
            </label>
          </>
        )}
        {isAction && (
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 mb-2">
            <label className="text-xs font-semibold mb-1 block">Prompt
              <input className="w-full border border-yellow-200 rounded-lg shadow-sm px-3 py-2 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition bg-white text-gray-700" value={form.prompt ?? ''} onChange={e => setForm((f: any) => ({ ...f, prompt: e.target.value }))} placeholder="Enter the prompt, e.g. {topic}" />
            </label>
            <label className="text-xs font-semibold mb-1 block">Temperature
              <input type="number" min="0" max="2" step="0.01" className="w-full border border-yellow-100 rounded-lg shadow-sm px-3 py-2 bg-white text-gray-700" value={form.temperature ?? 1} onChange={e => setForm((f: any) => ({ ...f, temperature: parseFloat(e.target.value) }))} placeholder="Creativity (0-2)" />
            </label>
            <label className="text-xs font-semibold mb-1 block">Max Tokens
              <input type="number" min="1" className="w-full border border-yellow-100 rounded-lg shadow-sm px-3 py-2 bg-white text-gray-700" value={form.maxTokens ?? 256} onChange={e => setForm((f: any) => ({ ...f, maxTokens: parseInt(e.target.value) }))} placeholder="Max output length" />
            </label>
            <label className="text-xs font-semibold mb-1 block">Output Format
              <select className="w-full border border-yellow-100 rounded-lg shadow-sm px-3 py-2 bg-white text-gray-700" value={form.outputFormat ?? 'text'} onChange={e => setForm((f: any) => ({ ...f, outputFormat: e.target.value }))}>
                <option value="text">Text</option>
                <option value="json">JSON</option>
                <option value="markdown">Markdown</option>
                <option value="html">HTML</option>
              </select>
            </label>
            <label className="text-xs font-semibold mb-1 block">Model
              <input className="w-full border border-yellow-100 rounded-lg shadow-sm px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed" value={mistralConfig.model} disabled />
            </label>
            <label className="text-xs font-semibold mb-1 block">Tokens
              <input type="number" className="w-full border border-yellow-100 rounded-lg shadow-sm px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed" value={mistralConfig.tokens} disabled />
            </label>
            <div className="text-xs text-yellow-600 mt-2">Model and tokens are fixed for this action.</div>
          </div>
        )}
        {isOutput && (
          <>
            <label className="text-sm font-semibold">Label
              <input className="w-full border border-gray-200 rounded-lg shadow-sm px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" value={form.label ?? ''} onChange={e => setForm((f: any) => ({ ...f, label: e.target.value }))} placeholder="Label for output (e.g., Generated Output)" />
            </label>
            <label className="text-sm font-semibold">Display Format
              <select className="w-full border border-gray-200 rounded-lg shadow-sm px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" value={form.displayFormat ?? 'plain'} onChange={e => setForm((f: any) => ({ ...f, displayFormat: e.target.value }))}>
                <option value="plain">Plain</option>
                <option value="markdown">Markdown</option>
                <option value="code">Code block</option>
                <option value="download">Downloadable</option>
              </select>
            </label>
            {form.value && (
              <div className="mt-2">
                <label className="text-sm font-semibold mb-1 block">Generated Output</label>
                <textarea
                  className="w-full bg-gray-100 rounded-lg p-3 text-gray-800 border border-gray-200"
                  value={form.value}
                  readOnly
                  rows={6}
                />
              </div>
            )}
          </>
        )}
      </div>
      {/* Export for Output node, Save for others */}
      <div className="flex gap-2 mt-2">
        {isOutput ? (
          <>
            <button type="button" className="bg-emerald-500 text-white px-4 py-2 rounded font-semibold hover:bg-emerald-700 flex-1 flex items-center justify-center" onClick={runWorkflow} disabled={runLoading}>
              {runLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Running...
                </span>
              ) : 'Run Workflow'}
            </button>
            <button type="button" className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 flex-1" onClick={onShowSaveModal}>Save Workflow</button>
          </>
        ) : isInput ? (
          <>
            <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded font-semibold hover:bg-emerald-700 flex-1">Save</button>
            <button type="button" className="bg-gray-200 text-gray-700 px-4 py-2 rounded font-semibold hover:bg-gray-300 flex-1" onClick={onCancel}>Cancel</button>
          </>
        ) : (
          <>
            <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded font-semibold hover:bg-emerald-700 flex-1">Save Workflow</button>
            <button type="button" className="bg-gray-200 text-gray-700 px-4 py-2 rounded font-semibold hover:bg-gray-300 flex-1" onClick={onCancel}>{isAction ? 'Close' : 'Cancel'}</button>
          </>
        )}
      </div>
    </form>
  );
} 