import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <header className="header">
      <h1>nuCMS</h1>
      
      <nav className="nav">
        <Link 
          to="/" 
          className={isActive('/') && location.pathname === '/' ? 'active' : ''}
        >
          Dashboard
        </Link>
        <Link 
          to="/posts" 
          className={isActive('/posts') ? 'active' : ''}
        >
          Posts
        </Link>
        <Link 
          to="/pages" 
          className={isActive('/pages') ? 'active' : ''}
        >
          Pages
        </Link>
        <Link 
          to="/media" 
          className={isActive('/media') ? 'active' : ''}
        >
          Media
        </Link>
      </nav>

      <div className="user-menu">
        <span>Welcome, {user?.username}</span>
        <button 
          onClick={logout}
          className="btn btn-secondary"
          style={{ marginLeft: '1rem' }}
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default Header;
