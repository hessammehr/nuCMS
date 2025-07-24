import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import type { ApiResponse, PaginatedResponse, Media } from '../../../shared/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'text/plain'
];

export async function mediaRoutes(fastify: FastifyInstance) {

  // Get all media
  fastify.get<{
    Querystring: {
      page?: string;
      limit?: string;
      type?: string;
      search?: string;
    };
    Reply: ApiResponse<PaginatedResponse<Media>>;
  }>('/', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const page = parseInt(request.query.page || '1');
      const limit = parseInt(request.query.limit || '20');
      const type = request.query.type;
      const search = request.query.search;
      const offset = (page - 1) * limit;

      const where: any = {};
      
      if (type) {
        where.mimeType = { startsWith: type };
      }
      
      if (search) {
        where.OR = [
          { originalName: { contains: search } },
          { alt: { contains: search } },
          { caption: { contains: search } }
        ];
      }

      const [media, total] = await Promise.all([
        prisma.media.findMany({
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
        prisma.media.count({ where })
      ]);

      return {
        success: true,
        data: {
          items: media,
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

  // Get single media item
  fastify.get<{
    Params: { id: string };
    Reply: ApiResponse<Media>;
  }>('/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      
      const media = await prisma.media.findUnique({
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

      if (!media) {
        return reply.status(404).send({
          success: false,
          error: 'Media not found'
        });
      }

      return {
        success: true,
        data: media
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Upload media
  fastify.post<{
    Reply: ApiResponse<Media>;
  }>('/upload', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { userId } = request.user as any;
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({
          success: false,
          error: 'No file provided'
        });
      }

      // Validate file type
      if (!ALLOWED_TYPES.includes(data.mimetype)) {
        return reply.status(400).send({
          success: false,
          error: 'File type not allowed'
        });
      }

      // Validate file size
      const buffers = [];
      for await (const chunk of data.file) {
        buffers.push(chunk);
      }
      const buffer = Buffer.concat(buffers);

      if (buffer.length > MAX_FILE_SIZE) {
        return reply.status(400).send({
          success: false,
          error: 'File size too large'
        });
      }

      // Generate unique filename for reference (no longer used for filesystem)
      const timestamp = Date.now();
      const extension = data.filename.includes('.') ? data.filename.split('.').pop() : '';
      const filename = `${timestamp}-${Math.random().toString(36).substring(7)}${extension ? '.' + extension : ''}`;

      // Save to database with file content as blob
      const media = await prisma.media.create({
        data: {
          filename,
          originalName: data.filename,
          mimeType: data.mimetype,
          size: buffer.length,
          url: `/api/media/file/${filename}`, // Changed to point to database-served content
          data: buffer, // Store file content as binary data
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
        data: media
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Upload failed'
      });
    }
  });

  // Update media metadata
  fastify.put<{
    Params: { id: string };
    Body: { alt?: string; caption?: string };
    Reply: ApiResponse<Media>;
  }>('/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      const { userId, role } = request.user as any;
      const { alt, caption } = request.body;

      const existingMedia = await prisma.media.findUnique({
        where: { id }
      });

      if (!existingMedia) {
        return reply.status(404).send({
          success: false,
          error: 'Media not found'
        });
      }

      // Check permissions
      if (role !== 'ADMIN' && existingMedia.authorId !== userId) {
        return reply.status(403).send({
          success: false,
          error: 'Insufficient permissions'
        });
      }

      const media = await prisma.media.update({
        where: { id },
        data: { alt, caption },
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
        data: media
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Delete media
  fastify.delete<{
    Params: { id: string };
    Reply: ApiResponse<{ id: number }>;
  }>('/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      const { userId, role } = request.user as any;

      const existingMedia = await prisma.media.findUnique({
        where: { id }
      });

      if (!existingMedia) {
        return reply.status(404).send({
          success: false,
          error: 'Media not found'
        });
      }

      // Check permissions
      if (role !== 'ADMIN' && existingMedia.authorId !== userId) {
        return reply.status(403).send({
          success: false,
          error: 'Insufficient permissions'
        });
      }

      // Delete from database (file content is stored in database)
      await prisma.media.delete({
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

  // Serve media files from database
  fastify.get<{
    Params: { filename: string };
  }>('/file/:filename', async (request, reply) => {
    try {
      const { filename } = request.params;
      
      const media = await prisma.media.findFirst({
        where: { filename },
        select: {
          data: true,
          mimeType: true,
          originalName: true,
          size: true
        }
      });

      if (!media) {
        return reply.status(404).send({
          success: false,
          error: 'File not found'
        });
      }

      // Set appropriate headers
      reply.header('Content-Type', media.mimeType);
      reply.header('Content-Length', media.size);
      reply.header('Content-Disposition', `inline; filename="${media.originalName}"`);
      reply.header('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

      // Send the binary data
      return reply.send(media.data);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });
}
