import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { renderGutenbergContent, extractSEOData } from '../lib/gutenberg';
import type { CreatePageRequest, UpdatePageRequest, ApiResponse, PaginatedResponse, Page } from '../../../shared/types';

const createPageSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'PRIVATE']).optional()
});

const updatePageSchema = createPageSchema.partial().extend({
  id: z.number()
});

export async function pageRoutes(fastify: FastifyInstance) {
  // Get all pages
  fastify.get<{
    Querystring: {
      page?: string;
      limit?: string;
      status?: string;
      search?: string;
    };
    Reply: ApiResponse<PaginatedResponse<Page>>;
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
          { title: { contains: search } }
        ];
      }

      const [pages, total] = await Promise.all([
        prisma.page.findMany({
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
        prisma.page.count({ where })
      ]);

      return {
        success: true,
        data: {
          items: pages,
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

  // Get single page
  fastify.get<{
    Params: { id: string };
    Reply: ApiResponse<Page & { renderedContent: string; seo: any }>;
  }>('/:id', async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      
      const page = await prisma.page.findUnique({
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

      if (!page) {
        return reply.status(404).send({
          success: false,
          error: 'Page not found'
        });
      }

      const renderedContent = renderGutenbergContent(page.content);
      const seo = extractSEOData(page.content);

      return {
        success: true,
        data: {
          ...page,
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

  // Create page
  fastify.post<{
    Body: CreatePageRequest;
    Reply: ApiResponse<Page>;
  }>('/', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { userId } = request.user as any;
      const data = createPageSchema.parse(request.body);

      // Check if slug already exists
      const existingPage = await prisma.page.findUnique({
        where: { slug: data.slug }
      });

      if (existingPage) {
        return reply.status(400).send({
          success: false,
          error: 'Slug already exists'
        });
      }

      const page = await prisma.page.create({
        data: {
          ...data,
          authorId: userId
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
        data: page
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(400).send({
        success: false,
        error: 'Invalid request data'
      });
    }
  });

  // Update page
  fastify.put<{
    Params: { id: string };
    Body: Omit<UpdatePageRequest, 'id'>;
    Reply: ApiResponse<Page>;
  }>('/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      const { userId, role } = request.user as any;
      const data = updatePageSchema.omit({ id: true }).parse(request.body);

      const existingPage = await prisma.page.findUnique({
        where: { id }
      });

      if (!existingPage) {
        return reply.status(404).send({
          success: false,
          error: 'Page not found'
        });
      }

      // Check permissions
      if (role !== 'ADMIN' && existingPage.authorId !== userId) {
        return reply.status(403).send({
          success: false,
          error: 'Insufficient permissions'
        });
      }

      // Check slug uniqueness if slug is being updated
      if (data.slug && data.slug !== existingPage.slug) {
        const slugExists = await prisma.page.findUnique({
          where: { slug: data.slug }
        });

        if (slugExists) {
          return reply.status(400).send({
            success: false,
            error: 'Slug already exists'
          });
        }
      }

      const page = await prisma.page.update({
        where: { id },
        data,
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
        data: page
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(400).send({
        success: false,
        error: 'Invalid request data'
      });
    }
  });

  // Delete page
  fastify.delete<{
    Params: { id: string };
    Reply: ApiResponse<{ id: number }>;
  }>('/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      const { userId, role } = request.user as any;

      const existingPage = await prisma.page.findUnique({
        where: { id }
      });

      if (!existingPage) {
        return reply.status(404).send({
          success: false,
          error: 'Page not found'
        });
      }

      // Check permissions
      if (role !== 'ADMIN' && existingPage.authorId !== userId) {
        return reply.status(403).send({
          success: false,
          error: 'Insufficient permissions'
        });
      }

      await prisma.page.delete({
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
