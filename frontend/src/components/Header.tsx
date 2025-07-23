import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, Popover, MenuGroup, MenuItem, Icon } from '@wordpress/components';
import { wordpress, people, moreVertical, chevronDown } from '@wordpress/icons';

function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <header className="wp-admin-bar">
      <div className="wp-admin-bar__section wp-admin-bar__section--left">
        <div className="wp-admin-bar__logo">
          <Link to="/" className="wp-admin-bar__logo-link">
            <span className="wp-admin-bar__logo-text">ν</span>
            <span className="wp-admin-bar__site-name">nuCMS</span>
          </Link>
        </div>
        
        <nav className="wp-admin-bar__nav">
          <Link 
            to="/" 
            className={`wp-admin-bar__nav-item ${isActive('/') && location.pathname === '/' ? 'is-active' : ''}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/posts" 
            className={`wp-admin-bar__nav-item ${isActive('/posts') ? 'is-active' : ''}`}
          >
            Posts
          </Link>
          <Link 
            to="/pages" 
            className={`wp-admin-bar__nav-item ${isActive('/pages') ? 'is-active' : ''}`}
          >
            Pages
          </Link>
          <Link 
            to="/media" 
            className={`wp-admin-bar__nav-item ${isActive('/media') ? 'is-active' : ''}`}
          >
            Media
          </Link>
          <Link 
            to="/users" 
            className={`wp-admin-bar__nav-item ${isActive('/users') ? 'is-active' : ''}`}
          >
            <Icon icon={people} size={16} />
            Users
          </Link>
        </nav>
      </div>

      <div className="wp-admin-bar__section wp-admin-bar__section--right">
        <div className="wp-admin-bar__user-menu">
          <Button
            variant="tertiary"
            className="wp-admin-bar__user-button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <span className="wp-admin-bar__user-avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </span>
            <span className="wp-admin-bar__user-name">
              {user?.username}
            </span>
            <Icon icon={chevronDown} size={16} />
          </Button>
          
          {isUserMenuOpen && (
            <Popover
              position="bottom right"
              onClose={() => setIsUserMenuOpen(false)}
              className="wp-admin-bar__user-popover"
            >
              <MenuGroup>
                <MenuItem>
                  Edit Profile
                </MenuItem>
                <MenuItem onClick={logout}>
                  Log Out
                </MenuItem>
              </MenuGroup>
            </Popover>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
