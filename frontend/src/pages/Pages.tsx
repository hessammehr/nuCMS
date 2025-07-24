import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import type { Page } from '@shared/types';
import { Card, CardBody, CardHeader, Button, Flex, FlexItem, Icon, __experimentalHeading as Heading, __experimentalText as Text, SearchControl, SelectControl, __experimentalGrid as Grid } from '@wordpress/components';
import { page, plus, edit, trash } from '@wordpress/icons';

function Pages() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchPages = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const response = await api.get(`/pages?${params}`);
      
      if (response.data.success) {
        setPages(response.data.data.items);
        setTotalPages(response.data.data.totalPages);
        setCurrentPage(response.data.data.page);
      } else {
        setError(response.data.error || 'Failed to fetch pages');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch pages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages(1);
  }, [statusFilter, search]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this page?')) return;
    
    try {
      const response = await api.delete(`/pages/${id}`);
      if (response.data.success) {
        setPages(pages.filter(page => page.id !== id));
      } else {
        setError(response.data.error || 'Failed to delete page');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete page');
    }
  };

  if (loading && pages.length === 0) {
    return <div className="loading">Loading pages...</div>;
  }

  return (
    <div className="wp-admin-page">
      <div className="wp-admin-page__header">
        <Flex justify="space-between" align="center">
          <Heading level={1} className="wp-admin-page__title">
            Pages
          </Heading>
          <Link 
            to="/pages/new"
            className="components-button is-primary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Icon icon={plus} />
            Create New Page
          </Link>
        </Flex>
      </div>

      {error && (
        <Card className="wp-admin-error">
          <CardBody>
            <Text>{error}</Text>
          </CardBody>
        </Card>
      )}

      <Card className="wp-admin-filters">
        <CardBody>
          <Flex gap={4} align="end">
            <FlexItem>
              <SelectControl
                label="Status Filter"
                value={statusFilter}
                options={[
                  { label: 'All Statuses', value: '' },
                  { label: 'Published', value: 'PUBLISHED' },
                  { label: 'Draft', value: 'DRAFT' },
                  { label: 'Private', value: 'PRIVATE' }
                ]}
                onChange={(value) => setStatusFilter(value || '')}
              />
            </FlexItem>
            <FlexItem style={{ flex: 1 }}>
              <SearchControl
                label="Search pages"
                value={search}
                onChange={(value) => setSearch(value)}
                placeholder="Search pages..."
              />
            </FlexItem>
          </Flex>
        </CardBody>
      </Card>

      {pages.length > 0 ? (
        <>
          <div className="wp-admin-content-grid">
            {pages.map(pageItem => (
              <Card key={pageItem.id} className="wp-admin-content-item">
                <CardBody>
                  <Flex direction="column" gap={3}>
                    <Heading level={3} className="wp-admin-content-item__title">
                      {pageItem.title}
                    </Heading>
                    <Flex className="wp-admin-content-item__meta" gap={3}>
                      <Text size="small" className="wp-admin-content-item__status">
                        Status: <strong>{pageItem.status}</strong>
                      </Text>
                      <Text size="small" className="wp-admin-content-item__author">
                        By {pageItem.author?.username}
                      </Text>
                      <Text size="small" className="wp-admin-content-item__date">
                        {new Date(pageItem.createdAt).toLocaleDateString()}
                      </Text>
                    </Flex>
                    <Flex className="wp-admin-content-item__actions" gap={2}>
                      <Link 
                        to={`/pages/${pageItem.id}/edit`}
                        className="components-button is-secondary is-small"
                        style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Icon icon={edit} />
                        Edit
                      </Link>
                      <Button 
                        variant="secondary"
                        size="small"
                        isDestructive
                        onClick={() => handleDelete(pageItem.id)}
                      >
                        <Icon icon={trash} />
                        Delete
                      </Button>
                    </Flex>
                  </Flex>
                </CardBody>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <Card className="wp-admin-pagination">
              <CardBody>
                <Flex justify="center" gap={2}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "primary" : "secondary"}
                      size="small"
                      onClick={() => fetchPages(pageNum)}
                      disabled={loading}
                    >
                      {pageNum}
                    </Button>
                  ))}
                </Flex>
              </CardBody>
            </Card>
          )}
        </>
      ) : (
        <Card className="wp-admin-empty-state">
          <CardBody>
            <Flex direction="column" align="center" gap={4}>
              <Icon icon={page} size={48} className="wp-admin-empty-state__icon" />
              <Text>No pages found.</Text>
              <Link 
                to="/pages/new"
                className="components-button is-primary"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Icon icon={plus} />
                Create your first page
              </Link>
            </Flex>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

export default Pages;
