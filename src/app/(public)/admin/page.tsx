'use client';

import { useState, useEffect, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaTrash, FaEdit, FaEye, FaSearch, FaFilter, FaSort, FaTimes, FaCheck } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

interface Task {
  ID?: string;
  id?: string;
  Title?: string;
  title?: string;
  Description?: string;
  description?: string;
  Credits?: number;
  credits?: number;
  Category?: string;
  category?: string;
  Location?: string;
  location?: string;
  Author?: {
    Name?: string;
    name?: string;
    Email?: string;
    email?: string;
    Avatar?: string;
    avatar?: string;
  };
  author?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
  Images?: string[];
  Status?: string;
  status?: string;
  CreatedAt?: number;
  createdAt?: number;
  Tiers?: Array<{ name: string; credits: number; title: string; description: string; features: string[]; availableTimeSlot: string; maxDays: number }>;
}

interface User {
  _id?: string;
  id?: string;
  Name?: string;
  name?: string;
  Email?: string;
  email?: string;
  Avatar?: string;
  avatar?: string;
  ProfilePictureURL?: string;
  profilePictureURL?: string;
  Credits?: number;
  credits?: number;
  College?: string;
  college?: string;
  Program?: string;
  program?: string;
  YearOfStudy?: string;
  yearOfStudy?: string;
  Location?: string;
  location?: string;
  Bio?: string;
  bio?: string;
  Skills?: string[];
  skills?: string[];
  CreatedAt?: number;
  createdAt?: number;
}

interface TaskApiResponse {
  data: Task[];
  total: number;
  limit: number;
  skip: number;
  hasMore: boolean;
  message: string;
}

interface UserApiResponse {
  data: User[];
  count: number;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'users'>('tasks');
  
  // Task state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskLoading, setTaskLoading] = useState(true);
  const [taskTotalCount, setTaskTotalCount] = useState(0);
  const [taskHasMore, setTaskHasMore] = useState(false);
  const [taskCurrentPage, setTaskCurrentPage] = useState(0);
  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  // User state
  const [users, setUsers] = useState<User[]>([]);
  const [userLoading, setUserLoading] = useState(true);
  const [userTotalCount, setUserTotalCount] = useState(0);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  // Delete state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'task' | 'user', name: string} | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  // Build task API parameters
  const buildTaskApiParams = useCallback((page: number = 0) => {
    const params = new URLSearchParams();
    const limit = 50; // Show more tasks per page for admin
    const skip = page * limit;
    
    params.append('limit', limit.toString());
    params.append('skip', skip.toString());

    if (taskSearchTerm) {
      params.append('q', taskSearchTerm);
    }

    if (categoryFilter) {
      params.append('category', categoryFilter);
    }

    if (statusFilter) {
      params.append('status', statusFilter);
    }

    if (sortBy !== 'newest') {
      params.append('sortBy', sortBy);
    }

    return params;
  }, [taskSearchTerm, categoryFilter, statusFilter, sortBy]);

  // Build user API parameters
  const buildUserApiParams = useCallback(() => {
    const params = new URLSearchParams();
    if (userSearchTerm) {
      params.append('q', userSearchTerm);
    }
    return params;
  }, [userSearchTerm]);

  // Fetch all tasks (admin access)
  const fetchTasks = useCallback(async (page: number = 0, reset: boolean = true) => {
    try {
      setTaskLoading(true);
      const API_BASE_URL = process.env.NEXT_PUBLIC_TASK_API_URL || "http://localhost:8084";
      const params = buildTaskApiParams(page);
      const response = await fetch(`${API_BASE_URL}/api/tasks/admin/all?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      
      const data: TaskApiResponse = await response.json();
      
      if (reset) {
        setTasks(data.data);
        setTaskTotalCount(data.total);
        setTaskHasMore(data.hasMore);
        setTaskCurrentPage(page);
      } else {
        setTasks(prev => [...prev, ...data.data]);
        setTaskHasMore(data.hasMore);
        setTaskCurrentPage(page);
      }
      
      console.log(`Fetched ${data.data?.length || 0} tasks (page ${page + 1})`);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to fetch tasks');
      if (reset) {
        setTasks([]);
        setTaskTotalCount(0);
        setTaskHasMore(false);
      }
    } finally {
      setTaskLoading(false);
    }
  }, [buildTaskApiParams]);

  // Fetch all users (admin access)
  const fetchUsers = useCallback(async (reset: boolean = true) => {
    try {
      setUserLoading(true);
      const API_BASE_URL = process.env.NEXT_PUBLIC_PROFILE_API_URL || "http://localhost:8081";
      const params = buildUserApiParams();
      const response = await fetch(`${API_BASE_URL}/api/users/public?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data: UserApiResponse = await response.json();

      if (reset) {
        setUsers(data.data);
        setUserTotalCount(data.count);
      } else {
        setUsers(prev => [...prev, ...data.data]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setUserLoading(false);
    }
  }, [buildUserApiParams]);

  // Initial load
  useEffect(() => {
    if (activeTab === 'tasks') {
      fetchTasks(0, true);
    } else {
      fetchUsers(true);
    }
  }, [fetchTasks, fetchUsers, activeTab]);

  // Handle search and filters
  const handleTaskSearch = () => {
    fetchTasks(0, true);
  };

  const handleUserSearch = () => {
    fetchUsers(true);
  };

  const handleFilterChange = () => {
    fetchTasks(0, true);
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    fetchTasks(0, true);
  };

  // Handle item deletion (tasks or users)
  const handleDelete = async () => {
    if (!itemToDelete) return;

    if (deleteConfirmation.toLowerCase() !== 'delete') {
      toast.error("❌ Please type 'delete' to confirm");
      return;
    }

    setIsDeleting(true);

    try {
      if (itemToDelete.type === 'task') {
        const API_BASE_URL = process.env.NEXT_PUBLIC_TASK_API_URL || "http://localhost:8084";
        const response = await fetch(`${API_BASE_URL}/api/tasks/admin/delete/${itemToDelete.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete task');
        }

        toast.success("✅ Task deleted successfully");
        setTasks(prev => prev.filter(task => (task.ID || task.id) !== itemToDelete.id));
        setTaskTotalCount(prev => prev - 1);
      } else {
        const API_BASE_URL = process.env.NEXT_PUBLIC_PROFILE_API_URL || "http://localhost:8081";
        const response = await fetch(`${API_BASE_URL}/api/admin/delete/${itemToDelete.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete user');
        }

        toast.success("✅ User deleted successfully");
        setUsers(prev => prev.filter(user => (user._id || user.id) !== itemToDelete.id));
        setUserTotalCount(prev => prev - 1);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(`❌ Failed to delete ${itemToDelete.type}`);
    } finally {
      setIsDeleting(false);
      setShowConfirmModal(false);
      setItemToDelete(null);
      setDeleteConfirmation("");
    }
  };

  const openDeleteModal = (id: string, type: 'task' | 'user', name: string) => {
    setItemToDelete({ id, type, name });
    setShowConfirmModal(true);
  };

  const viewTask = (taskId: string) => {
    router.push(`/services/view/${taskId}`);
  };

  const editTask = (taskId: string) => {
    router.push(`/services/${taskId}/edit`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage tasks and users in the system</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tasks'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tasks ({taskTotalCount})
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Users ({userTotalCount})
              </button>
            </nav>
          </div>
        </div>

        {/* Search and Filters */}
        {activeTab === 'tasks' && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    value={taskSearchTerm}
                    onChange={(e) => setTaskSearchTerm(e.target.value)}
                    placeholder="Search tasks..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">All Categories</option>
                  <option value="Design & Creative">Design & Creative</option>
                  <option value="Digital Marketing">Digital Marketing</option>
                  <option value="Writing & Translation">Writing & Translation</option>
                  <option value="Video & Animation">Video & Animation</option>
                  <option value="Music & Audio">Music & Audio</option>
                  <option value="Programming & Tech">Programming & Tech</option>
                  <option value="Business">Business</option>
                  <option value="Lifestyle">Lifestyle</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">All Status</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="in_progress">In Progress</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={handleTaskSearch}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Search
              </button>
              <div className="text-sm text-gray-600">
                {taskTotalCount} total tasks
              </div>
            </div>
          </div>
        )}

        {/* User Search */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Users</label>
                <div className="relative">
                  <input
                    type="text"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-end">
                <button
                  onClick={handleUserSearch}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Search
                </button>
                <div className="ml-4 text-sm text-gray-600">
                  {userTotalCount} total users
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Table */}
        {activeTab === 'tasks' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {taskLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">No tasks found</p>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tasks.map((task) => {
                    const taskId = task.ID || task.id;
                    const title = task.Title || task.title;
                    const authorName = task.Author?.Name || task.Author?.name || task.author?.name || 'Unknown';
                    const authorEmail = task.Author?.Email || task.Author?.email || task.author?.email || '';
                    const category = task.Category || task.category || 'Uncategorized';
                    const status = task.Status || task.status || 'open';
                    const credits = task.Credits || task.credits || 0;
                    const createdAt = task.CreatedAt || task.createdAt || 0;
                    const image = task.Images?.[0] || '';

                    return (
                      <tr key={taskId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12">
                              {image ? (
                                <img
                                  className="h-12 w-12 rounded-lg object-cover"
                                  src={image}
                                  alt={title}
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
                                  <span className="text-white font-bold text-sm">
                                    {title?.charAt(0) || 'T'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 line-clamp-1">
                                {title}
                              </div>
                              <div className="text-sm text-gray-500 line-clamp-1">
                                {task.Description || task.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{authorName}</div>
                          <div className="text-sm text-gray-500">{authorEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            status === 'open' ? 'bg-green-100 text-green-800' :
                            status === 'closed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {credits} credits
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(createdAt * 1000).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => viewTask(taskId!)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View"
                            >
                              <FaEye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => editTask(taskId!)}
                              className="text-green-600 hover:text-green-900"
                              title="Edit"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(taskId!, 'task', title || 'Task')}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )}

        {/* Users Table */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {userLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avatar</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">College</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => {
                      const userId = user._id || user.id;
                      const userName = user.Name || user.name || 'N/A';
                      const userEmail = user.Email || user.email;
                      const userCollege = user.College || user.college || 'N/A';
                      const userProgram = user.Program || user.program || 'N/A';
                      const userCredits = user.Credits || user.credits || 0;
                      const userLocation = user.Location || user.location || 'N/A';
                      const userAvatar = user.ProfilePictureURL || user.profilePictureURL;

                      return (
                        <tr key={userId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex-shrink-0 h-12 w-12">
                              {userAvatar ? (
                                <img
                                  className="h-12 w-12 rounded-full object-cover"
                                  src={userAvatar}
                                  alt={userName}
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
                                  <span className="text-white font-bold text-sm">
                                    {userName.charAt(0)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{userName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{userEmail}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{userCollege}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{userProgram}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {userCredits}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{userLocation}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openDeleteModal(userId!, 'user', userName)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <FaTrash className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {activeTab === 'tasks' && tasks.length > 0 && (
                      <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Showing {tasks.length} of {taskTotalCount} tasks
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchTasks(Math.max(0, taskCurrentPage - 1), true)}
                  disabled={taskCurrentPage === 0 || taskLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  Page {taskCurrentPage + 1}
                </span>
                <button
                  onClick={() => fetchTasks(taskCurrentPage + 1, true)}
                  disabled={!taskHasMore || taskLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 px-4">
          <div className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-md">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTrash className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Delete {itemToDelete?.type === 'user' ? 'User' : 'Task'}?</h2>
              <p className="text-gray-600 mb-4">
                This action cannot be undone. The {itemToDelete?.type === 'user' ? 'user' : 'task'} will be permanently removed.
                {itemToDelete?.type === 'user' && ' All associated tasks, bookings, and data will also be deleted.'}
              </p>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 text-left">
                  Type "delete" to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="Type 'delete' to confirm"
                  className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setDeleteConfirmation("");
                }}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirmation.toLowerCase() !== "delete" || isDeleting}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center ${
                  deleteConfirmation.toLowerCase() === "delete" && !isDeleting
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
} 