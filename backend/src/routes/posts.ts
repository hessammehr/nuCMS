import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { renderGutenbergContent, extractSEOData } from '../lib/gutenberg';
import type { CreatePostRequest, UpdatePostRequest, ApiResponse, PaginatedResponse, Post } from '../../../shared/types';

const createPostSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string(),
  excerpt: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'PRIVATE']).optional(),
  publishedAt: z.string().optional()
});

const updatePostSchema = createPostSchema.partial().extend({
  id: z.number()
});

export async function postRoutes(fastify: FastifyInstance) {
  // Get all posts (with pagination and filtering)
  fastify.get<{
    Querystring: {
      page?: string;
      limit?: string;
      status?: string;
      search?: string;
    };
    Reply: ApiResponse<PaginatedResponse<Post>>;
  }>('/', async (request, reply) => {
    try {
      const page = parseInt(request.query.page || '1');
      const limit = parseInt(request.query.limit || '10');
      const status = request.query.status;
      const search = request.query.search;
      const offset = (page - 1) * limit;

      const where: any = {};
      
      if (status && ['DRAFT', 'PUBLISHED', 'PRIVATE'].includes(status)) {
        where.status = status;
      }
      
      if (search) {
        where.OR = [
          { title: { contains: search } },
          { excerpt: { contains: search } }
        ];
      }

      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where,
          include: {
            author: {
              select: {
                id: true,
                username: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.post.count({ where })
      ]);

      return {
        success: true,
        data: {
          items: posts,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Get single post
  fastify.get<{
    Params: { id: string };
    Reply: ApiResponse<Post & { renderedContent: string; seo: any }>;
  }>('/:id', async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      
      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              email: true,
              role: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      });

      if (!post) {
        return reply.status(404).send({
          success: false,
          error: 'Post not found'
        });
      }

      const renderedContent = renderGutenbergContent(post.content);
      const seo = extractSEOData(post.content);

      return {
        success: true,
        data: {
          ...post,
          renderedContent,
          seo
        }
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Create post
  fastify.post<{
    Body: CreatePostRequest;
    Reply: ApiResponse<Post>;
  }>('/', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { userId } = request.user as any;
      const data = createPostSchema.parse(request.body);

      // Check if slug already exists
      const existingPost = await prisma.post.findUnique({
        where: { slug: data.slug }
      });

      if (existingPost) {
        return reply.status(400).send({
          success: false,
          error: 'Slug already exists'
        });
      }

      // Auto-generate excerpt from content if not provided
      if (!data.excerpt) {
        const seo = extractSEOData(data.content);
        data.excerpt = seo.description;
      }

      const post = await prisma.post.create({
        data: {
          ...data,
          authorId: userId,
          publishedAt: data.status === 'PUBLISHED' && data.publishedAt 
            ? new Date(data.publishedAt) 
            : data.status === 'PUBLISHED' 
            ? new Date() 
            : null
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              email: true,
              role: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      });

      return {
        success: true,
        data: post
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(400).send({
        success: false,
        error: 'Invalid request data'
      });
    }
  });

  // Update post
  fastify.put<{
    Params: { id: string };
    Body: Omit<UpdatePostRequest, 'id'>;
    Reply: ApiResponse<Post>;
  }>('/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      const { userId, role } = request.user as any;
      const data = updatePostSchema.omit({ id: true }).parse(request.body);

      const existingPost = await prisma.post.findUnique({
        where: { id }
      });

      if (!existingPost) {
        return reply.status(404).send({
          success: false,
          error: 'Post not found'
        });
      }

      // Check permissions
      if (role !== 'ADMIN' && existingPost.authorId !== userId) {
        return reply.status(403).send({
          success: false,
          error: 'Insufficient permissions'
        });
      }

      // Check slug uniqueness if slug is being updated
      if (data.slug && data.slug !== existingPost.slug) {
        const slugExists = await prisma.post.findUnique({
          where: { slug: data.slug }
        });

        if (slugExists) {
          return reply.status(400).send({
            success: false,
            error: 'Slug already exists'
          });
        }
      }

      const updateData: any = { ...data };

      // Handle publishedAt logic
      if (data.status === 'PUBLISHED' && !existingPost.publishedAt) {
        updateData.publishedAt = data.publishedAt ? new Date(data.publishedAt) : new Date();
      } else if (data.status !== 'PUBLISHED') {
        updateData.publishedAt = null;
      }

      const post = await prisma.post.update({
        where: { id },
        data: updateData,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              email: true,
              role: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      });

      return {
        success: true,
        data: post
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(400).send({
        success: false,
        error: 'Invalid request data'
      });
    }
  });

  // Delete post
  fastify.delete<{
    Params: { id: string };
    Reply: ApiResponse<{ id: number }>;
  }>('/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      const { userId, role } = request.user as any;

      const existingPost = await prisma.post.findUnique({
        where: { id }
      });

      if (!existingPost) {
        return reply.status(404).send({
          success: false,
          error: 'Post not found'
        });
      }

      // Check permissions
      if (role !== 'ADMIN' && existingPost.authorId !== userId) {
        return reply.status(403).send({
          success: false,
          error: 'Insufficient permissions'
        });
      }

      await prisma.post.delete({
        where: { id }
      });

      return {
        success: true,
        data: { id }
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });
}
