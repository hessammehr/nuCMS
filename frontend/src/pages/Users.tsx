import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import type { User, CreateUserRequest } from '@shared/types';
import { Button, Modal, TextControl, SelectControl, Panel, PanelBody, Card, CardBody } from '@wordpress/components';
import { people, edit, trash, shield } from '@wordpress/icons';

function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createUserData, setCreateUserData] = useState<CreateUserRequest>({
    email: '',
    username: '',
    password: '',
    role: 'EDITOR'
  });

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (roleFilter) params.append('role', roleFilter);
      if (search) params.append('search', search);

      const response = await api.get(`/users?${params}`);
      
      if (response.data.success) {
        setUsers(response.data.data.items);
        setTotalPages(response.data.data.totalPages);
        setCurrentPage(response.data.data.page);
        setError('');
      } else {
        setError(response.data.error || 'Failed to fetch users');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [roleFilter, search]);

  const handleCreateUser = async () => {
    try {
      const response = await api.post('/users', createUserData);
      if (response.data.success) {
        setShowCreateModal(false);
        setCreateUserData({
          email: '',
          username: '',
          password: '',
          role: 'EDITOR'
        });
        fetchUsers(currentPage);
      } else {
        setError(response.data.error || 'Failed to create user');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (id: number, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) return;
    
    try {
      const response = await api.delete(`/users/${id}`);
      if (response.data.success) {
        setUsers(users.filter(user => user.id !== id));
      } else {
        setError(response.data.error || 'Failed to delete user');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return '#d63638';
      case 'EDITOR': return '#00a32a';
      case 'AUTHOR': return '#0073aa';
      default: return '#757575';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return shield;
      case 'EDITOR': return edit;
      case 'AUTHOR': return people;
      default: return people;
    }
  };

  if (loading && users.length === 0) {
    return <div className="loading">Loading users...</div>;
  }

  // Only admins can see user management
  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="wp-admin-content">
        <Card>
          <CardBody>
            <h2>Access Denied</h2>
            <p>You don't have permission to access user management.</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="wp-admin-content">
      <div className="wp-admin-header">
        <h1 className="wp-admin-title">
          Users
        </h1>
        <Button 
          variant="primary" 
          onClick={() => setShowCreateModal(true)}
          icon={people}
        >
          Add New User
        </Button>
      </div>

      {error && (
        <div className="notice notice-error">
          <p>{error}</p>
        </div>
      )}

      <div className="wp-admin-filters">
        <SelectControl
          label="Filter by Role"
          value={roleFilter}
          options={[
            { label: 'All Roles', value: '' },
            { label: 'Admin', value: 'ADMIN' },
            { label: 'Editor', value: 'EDITOR' },
            { label: 'Author', value: 'AUTHOR' }
          ]}
          onChange={(value) => setRoleFilter(value || '')}
        />
        
        <TextControl
          label="Search Users"
          value={search}
          onChange={(value) => setSearch(value || '')}
          placeholder="Search by username or email..."
        />
      </div>

      {users.length > 0 ? (
        <>
          <div className="wp-admin-table-container">
            <table className="wp-list-table widefat fixed striped">
              <thead>
                <tr>
                  <th scope="col" className="column-username">Username</th>
                  <th scope="col" className="column-email">Email</th>
                  <th scope="col" className="column-role">Role</th>
                  <th scope="col" className="column-created">Created</th>
                  <th scope="col" className="column-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="column-username">
                      <strong>{user.username}</strong>
                      {user.id === currentUser?.id && (
                        <span className="wp-admin-badge">(You)</span>
                      )}
                    </td>
                    <td className="column-email">
                      {user.email}
                    </td>
                    <td className="column-role">
                      <span 
                        className="wp-admin-role-badge"
                        style={{ 
                          backgroundColor: getRoleColor(user.role),
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '3px',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="column-created">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="column-actions">
                      <div className="wp-admin-actions">
                        <Button
                          variant="secondary"
                          size="small"
                          icon={edit}
                          onClick={() => {
                            // TODO: Implement edit user modal
                            alert('Edit user functionality coming soon!');
                          }}
                        >
                          Edit
                        </Button>
                        {user.id !== currentUser?.id && (
                          <Button
                            variant="secondary"
                            size="small"
                            icon={trash}
                            isDestructive
                            onClick={() => handleDeleteUser(user.id, user.username)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="wp-admin-pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={page === currentPage ? 'primary' : 'secondary'}
                  onClick={() => fetchUsers(page)}
                  disabled={loading}
                >
                  {page}
                </Button>
              ))}
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardBody>
            <p>No users found.</p>
          </CardBody>
        </Card>
      )}

      {showCreateModal && (
        <Modal
          title="Add New User"
          onRequestClose={() => setShowCreateModal(false)}
          size="medium"
        >
          <Panel>
            <PanelBody>
              <TextControl
                label="Username"
                value={createUserData.username}
                onChange={(value) => setCreateUserData(prev => ({ ...prev, username: value || '' }))}
                required
              />
              
              <TextControl
                label="Email"
                type="email"
                value={createUserData.email}
                onChange={(value) => setCreateUserData(prev => ({ ...prev, email: value || '' }))}
                required
              />
              
              <TextControl
                label="Password"
                type="password"
                value={createUserData.password}
                onChange={(value) => setCreateUserData(prev => ({ ...prev, password: value || '' }))}
                help="Password must be at least 6 characters long"
                required
              />
              
              <SelectControl
                label="Role"
                value={createUserData.role}
                options={[
                  { label: 'Author', value: 'AUTHOR' },
                  { label: 'Editor', value: 'EDITOR' },
                  { label: 'Admin', value: 'ADMIN' }
                ]}
                onChange={(value) => setCreateUserData(prev => ({ 
                  ...prev, 
                  role: (value as 'ADMIN' | 'EDITOR' | 'AUTHOR') || 'EDITOR' 
                }))}
              />
              
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <Button
                  variant="tertiary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateUser}
                  disabled={!createUserData.username || !createUserData.email || !createUserData.password}
                >
                  Create User
                </Button>
              </div>
            </PanelBody>
          </Panel>
        </Modal>
      )}
    </div>
  );
}

export default Users;