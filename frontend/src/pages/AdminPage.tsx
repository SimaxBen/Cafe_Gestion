import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

interface User {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
}

interface Cafe {
  id: string;
  name: string;
  address?: string;
  currency_symbol: string;
}

interface CafeUser {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
}

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'cafes' | 'users' | 'assignments'>('cafes');
  const [showCafeModal, setShowCafeModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCafe, setSelectedCafe] = useState<string>('');
  
  const [newUser, setNewUser] = useState({ email: '', password: '', full_name: '' });
  const [newCafe, setNewCafe] = useState({ name: '', address: '', currency_symbol: '$' });
  const [assignment, setAssignment] = useState({ cafe_id: '', user_id: '', role: 'manager' });

  // Fetch data
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['admin', 'users'],
    queryFn: async () => (await api.get('/admin/users')).data,
  });

  const { data: cafes = [] } = useQuery<Cafe[]>({
    queryKey: ['admin', 'cafes'],
    queryFn: async () => (await api.get('/admin/cafes')).data,
  });

  const { data: cafeUsers = [] } = useQuery<CafeUser[]>({
    queryKey: ['admin', 'cafe-users', selectedCafe],
    queryFn: async () => {
      if (!selectedCafe) return [];
      return (await api.get(`/admin/cafe/${selectedCafe}/users`)).data;
    },
    enabled: !!selectedCafe,
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: async (data: typeof newUser) => await api.post('/admin/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setNewUser({ email: '', password: '', full_name: '' });
      setShowUserModal(false);
      alert('✅ User created successfully!');
    },
    onError: (error: any) => {
      alert('❌ Error: ' + (error.response?.data?.detail || 'Failed to create user'));
    },
  });

  const createCafeMutation = useMutation({
    mutationFn: async (data: typeof newCafe) => await api.post('/admin/cafes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'cafes'] });
      setNewCafe({ name: '', address: '', currency_symbol: '$' });
      setShowCafeModal(false);
      alert('✅ Cafe created successfully!');
    },
    onError: (error: any) => {
      alert('❌ Error: ' + (error.response?.data?.detail || 'Failed to create cafe'));
    },
  });

  const assignCafeMutation = useMutation({
    mutationFn: async (data: typeof assignment) => await api.post('/admin/assign-cafe', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'cafe-users'] });
      setAssignment({ cafe_id: '', user_id: '', role: 'manager' });
      setShowAssignModal(false);
      alert('✅ User assigned to cafe successfully!');
    },
    onError: (error: any) => {
      alert('❌ Error: ' + (error.response?.data?.detail || 'Failed to assign cafe'));
    },
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: async (data: { cafe_id: string; user_id: string; role: string }) => 
      await api.delete('/admin/assign-cafe', { data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'cafe-users'] });
      alert('✅ User removed from cafe!');
    },
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage cafes, users, and assignments</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Cafes</p>
              <p className="text-3xl font-bold mt-1">{cafes.length}</p>
            </div>
            <div className="bg-blue-400 bg-opacity-30 rounded-full p-3">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold mt-1">{users.length}</p>
            </div>
            <div className="bg-green-400 bg-opacity-30 rounded-full p-3">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Admins</p>
              <p className="text-3xl font-bold mt-1">{users.filter(u => u.is_admin).length}</p>
            </div>
            <div className="bg-purple-400 bg-opacity-30 rounded-full p-3">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('cafes')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'cafes'
                  ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              ☕ Cafes
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'users'
                  ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              👥 Users
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'assignments'
                  ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              🔗 Assignments
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Cafes Tab */}
          {activeTab === 'cafes' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Cafe Management</h2>
                <button
                  onClick={() => setShowCafeModal(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <span className="text-xl">+</span> New Cafe
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cafes.map((cafe) => (
                  <div key={cafe.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-blue-500 text-white rounded-full p-3">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                        {cafe.currency_symbol}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{cafe.name}</h3>
                    <p className="text-gray-600 text-sm">{cafe.address || 'No address specified'}</p>
                  </div>
                ))}
                {cafes.length === 0 && (
                  <div className="col-span-3 text-center py-12 text-gray-500">
                    <p className="text-lg">No cafes yet. Create your first cafe!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                <button
                  onClick={() => setShowUserModal(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <span className="text-xl">+</span> New User
                </button>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                              {user.full_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.is_admin ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                              🛡️ Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                              👤 User
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Cafe Assignments</h2>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <span className="text-xl">+</span> Assign User
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Cafe to View Users</label>
                <select
                  value={selectedCafe}
                  onChange={(e) => setSelectedCafe(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Choose a cafe...</option>
                  {cafes.map((cafe) => (
                    <option key={cafe.id} value={cafe.id}>{cafe.name}</option>
                  ))}
                </select>
              </div>

              {selectedCafe && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">User</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {cafeUsers.map((user) => (
                        <tr key={user.user_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold">
                                {user.full_name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              user.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role === 'owner' ? '👑' : user.role === 'manager' ? '📊' : '🔧'} {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => removeAssignmentMutation.mutate({
                                cafe_id: selectedCafe,
                                user_id: user.user_id,
                                role: user.role
                              })}
                              className="text-red-600 hover:text-red-900 font-medium"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                      {cafeUsers.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                            No users assigned to this cafe yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Cafe Modal */}
      {showCafeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Create New Cafe</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cafe Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Downtown Coffee Shop"
                  value={newCafe.name}
                  onChange={(e) => setNewCafe({ ...newCafe, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  placeholder="e.g., 123 Main Street"
                  value={newCafe.address}
                  onChange={(e) => setNewCafe({ ...newCafe, address: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency Symbol</label>
                <input
                  type="text"
                  placeholder="$"
                  value={newCafe.currency_symbol}
                  onChange={(e) => setNewCafe({ ...newCafe, currency_symbol: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowCafeModal(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => createCafeMutation.mutate(newCafe)}
                disabled={!newCafe.name}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Cafe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Create New User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g., John Doe"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowUserModal(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => createUserMutation.mutate(newUser)}
                disabled={!newUser.email || !newUser.password || !newUser.full_name}
                className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Cafe Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Assign User to Cafe</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Cafe *</label>
                <select
                  value={assignment.cafe_id}
                  onChange={(e) => setAssignment({ ...assignment, cafe_id: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Choose a cafe...</option>
                  {cafes.map((cafe) => (
                    <option key={cafe.id} value={cafe.id}>{cafe.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select User *</label>
                <select
                  value={assignment.user_id}
                  onChange={(e) => setAssignment({ ...assignment, user_id: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Choose a user...</option>
                  {users.filter(u => !u.is_admin).map((user) => (
                    <option key={user.id} value={user.id}>{user.full_name} ({user.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                <select
                  value={assignment.role}
                  onChange={(e) => setAssignment({ ...assignment, role: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="owner">👑 Owner</option>
                  <option value="manager">📊 Manager</option>
                  <option value="server">🔧 Server</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => assignCafeMutation.mutate(assignment)}
                disabled={!assignment.cafe_id || !assignment.user_id}
                className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Assign User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
