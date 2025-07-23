import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import type { Post, Page } from '@shared/types';
import { Card, CardBody, CardHeader, Button, Flex, FlexItem, Icon, __experimentalHeading as Heading, __experimentalText as Text } from '@wordpress/components';
import { postList, page, media, plus, edit } from '@wordpress/icons';

function Dashboard() {
  const [stats, setStats] = useState({
    posts: 0,
    pages: 0,
    media: 0
  });
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [postsRes, pagesRes, mediaRes] = await Promise.all([
          api.get('/posts?limit=5'),
          api.get('/pages?limit=5'),
          api.get('/media?limit=1')
        ]);

        if (postsRes.data.success) {
          setStats(prev => ({ ...prev, posts: postsRes.data.data.total }));
          setRecentPosts(postsRes.data.data.items);
        }

        if (pagesRes.data.success) {
          setStats(prev => ({ ...prev, pages: pagesRes.data.data.total }));
        }

        if (mediaRes.data.success) {
          setStats(prev => ({ ...prev, media: mediaRes.data.data.total }));
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="wp-dashboard">
      <div className="wp-dashboard__header">
        <Heading level={1} className="wp-dashboard__title">
          Dashboard
        </Heading>
      </div>
      
      <div className="wp-dashboard__stats">
        <Card className="wp-stat-card">
          <CardBody>
            <Flex direction="column" align="center" gap={2}>
              <Icon icon={postList} size={32} className="wp-stat-card__icon" />
              <Heading level={3} className="wp-stat-card__number">
                {stats.posts}
              </Heading>
              <Text className="wp-stat-card__label">Posts</Text>
              <Button 
                variant="primary" 
                size="small"
                as={Link}
                to="/posts"
                className="wp-stat-card__button"
              >
                Manage Posts
              </Button>
            </Flex>
          </CardBody>
        </Card>
        
        <Card className="wp-stat-card">
          <CardBody>
            <Flex direction="column" align="center" gap={2}>
              <Icon icon={page} size={32} className="wp-stat-card__icon" />
              <Heading level={3} className="wp-stat-card__number">
                {stats.pages}
              </Heading>
              <Text className="wp-stat-card__label">Pages</Text>
              <Button 
                variant="primary" 
                size="small"
                as={Link}
                to="/pages"
                className="wp-stat-card__button"
              >
                Manage Pages
              </Button>
            </Flex>
          </CardBody>
        </Card>
        
        <Card className="wp-stat-card">
          <CardBody>
            <Flex direction="column" align="center" gap={2}>
              <Icon icon={media} size={32} className="wp-stat-card__icon" />
              <Heading level={3} className="wp-stat-card__number">
                {stats.media}
              </Heading>
              <Text className="wp-stat-card__label">Media Files</Text>
              <Button 
                variant="primary" 
                size="small"
                as={Link}
                to="/media"
                className="wp-stat-card__button"
              >
                Manage Media
              </Button>
            </Flex>
          </CardBody>
        </Card>
      </div>

      <Card className="wp-dashboard__recent-posts">
        <CardHeader>
          <Flex justify="space-between" align="center">
            <Heading level={2}>Recent Posts</Heading>
            <Button 
              variant="primary"
              icon={plus}
              as={Link}
              to="/posts/new"
            >
              Create New Post
            </Button>
          </Flex>
        </CardHeader>
        <CardBody>
          {recentPosts.length > 0 ? (
            <div className="wp-dashboard__post-list">
              {recentPosts.map(post => (
                <Card key={post.id} className="wp-post-summary">
                  <CardBody>
                    <Flex direction="column" gap={3}>
                      <Heading level={4} className="wp-post-summary__title">
                        {post.title}
                      </Heading>
                      <Text className="wp-post-summary__excerpt">
                        {post.excerpt || 'No excerpt available'}
                      </Text>
                      <Flex className="wp-post-summary__meta">
                        <Text size="small" className="wp-post-summary__status">
                          Status: <strong>{post.status}</strong>
                        </Text>
                        <Text size="small" className="wp-post-summary__author">
                          By {post.author?.username}
                        </Text>
                        <Text size="small" className="wp-post-summary__date">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </Text>
                      </Flex>
                      <Flex className="wp-post-summary__actions">
                        <Button 
                          variant="secondary"
                          size="small"
                          icon={edit}
                          as={Link}
                          to={`/posts/${post.id}/edit`}
                        >
                          Edit
                        </Button>
                      </Flex>
                    </Flex>
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="wp-dashboard__empty-state">
              <CardBody>
                <Flex direction="column" align="center" gap={4}>
                  <Icon icon={postList} size={48} className="wp-empty-state__icon" />
                  <Text>No posts yet.</Text>
                  <Button 
                    variant="primary"
                    icon={plus}
                    as={Link}
                    to="/posts/new"
                  >
                    Create your first post
                  </Button>
                </Flex>
              </CardBody>
            </Card>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default Dashboard;
