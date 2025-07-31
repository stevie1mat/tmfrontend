"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AIAgentCard from '@/components/AIAgentCard';
import { useAuth } from '@/contexts/AuthContext';
import { FiX } from 'react-icons/fi';

function encodeWorkflow(nodes: any, edges: any) {
  return btoa(unescape(encodeURIComponent(JSON.stringify({ nodes, edges }))));
}

export default function MyWorkflowsPage() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<any>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8002';
  const WORKFLOW_API_URL = `${API_BASE_URL}/api/workflows`;

  useEffect(() => {
    if (authLoading) return;
    if (!user || !(user.id || user.ID)) {
      setWorkflows([]);
      setLoading(false);
      return;
    }
    const userId = String(user.id || user.ID || '');
    fetch(WORKFLOW_API_URL, {
      headers: { 'user-id': userId },
    })
      .then(res => res.json())
      .then(data => {
        setWorkflows(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load workflows');
        setLoading(false);
      });
  }, [authLoading, user]);

  function handleLoadWorkflow(wf: any) {
    // Save to localStorage for the create-workflow page to pick up
    localStorage.setItem('tm-loaded-workflow', JSON.stringify({ nodes: wf.nodes, edges: wf.edges, id: wf.id }));
    router.push('/ai-agents/create-workflow');
  }

  function handleDeleteClick(workflow: any) {
    setWorkflowToDelete(workflow);
    setShowDeleteDialog(true);
    setDeleteConfirmation('');
  }

  async function handleDeleteWorkflow() {
    if (deleteConfirmation.toLowerCase() !== 'delete') {
      return;
    }

    setDeleting(true);
    const userId = String(user?.id || user?.ID || '');
    try {
      const response = await fetch(`${WORKFLOW_API_URL}/${workflowToDelete.id}`, {
        method: 'DELETE',
        headers: { 'user-id': userId },
      });

      if (response.ok) {
        // Remove the workflow from the local state
        setWorkflows(prev => prev.filter(wf => wf.id !== workflowToDelete.id));
        setShowDeleteDialog(false);
        setWorkflowToDelete(null);
        setDeleteConfirmation('');
      } else {
        setError('Failed to delete workflow');
      }
    } catch (err) {
      setError('Failed to delete workflow');
    } finally {
      setDeleting(false);
    }
  }

  function closeDeleteDialog() {
    setShowDeleteDialog(false);
    setWorkflowToDelete(null);
    setDeleteConfirmation('');
  }

  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My AI Agent Workflows</h1>
        <button
          onClick={() => router.push('/ai-agents/create-workflow')}
          className="bg-emerald-600 text-white px-5 py-2 rounded font-semibold hover:bg-emerald-700 transition"
        >
          + Create an Agent
        </button>
      </div>
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[60vh]">
          {[1,2,3,4,5,6,7,8].map((i) => (
            <div key={i} className="bg-gray-100 rounded-xl p-4 animate-pulse h-64 flex flex-col">
              <div className="h-32 bg-gray-200 rounded mb-4"></div>
              <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="flex-1"></div>
              <div className="h-8 bg-gray-300 rounded w-full mt-2"></div>
            </div>
          ))}
        </div>
      )}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && workflows.length === 0 && <div>No workflows found.</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {workflows.map(wf => {
          // Map workflow to AIAgentCard props
          const agent = {
            id: wf.id,
            name: wf.name,
            description: wf.nodes?.map((n: any) => n.data?.description).find((desc: string) => desc && desc.trim()) || 'No description',
            category: 'Workflow',
            price: 0,
            rating: 5,
            reviews: 0,
            image: wf.coverImage || 'https://images.stockcake.com/public/1/1/f/11fc6018-f8a9-4eb4-bf60-0700a6a8f677_large/pathway-to-possibility-stockcake.jpg',
            features: wf.nodes?.map((n: any) => n.data?.label).filter(Boolean) || [],
            isFavorite: false,
          };
          return (
            <div key={wf.id}>
              <AIAgentCard
                agent={agent}
                onDemo={() => router.push(`/ai-agents/workflow-chat/${wf.id}`)}
                onPurchase={() => handleLoadWorkflow(wf)}
                onDelete={() => handleDeleteClick(wf)}
              />
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && workflowToDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Delete Workflow</h3>
              <button
                onClick={closeDeleteDialog}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete <span className="font-semibold text-gray-900">"{workflowToDelete.name}"</span>? 
                This action cannot be undone.
              </p>
              
              <p className="text-sm text-gray-500 mb-4">
                To confirm deletion, please type <span className="font-mono bg-gray-100 px-2 py-1 rounded">delete</span> in the field below:
              </p>
              
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type 'delete' to confirm"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                autoFocus
              />
              
              {error && (
                <p className="text-red-600 text-sm mt-2">{error}</p>
              )}
            </div>
            
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={closeDeleteDialog}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteWorkflow}
                disabled={deleteConfirmation.toLowerCase() !== 'delete' || deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete Workflow'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 