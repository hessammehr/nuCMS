import { FastifyInstance } from 'fastify';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import { pipeline } from 'stream/promises';
import { prisma } from '../lib/prisma';
import type { ApiResponse, PaginatedResponse, Media } from '../../../shared/types';

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
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
  // Ensure upload directory exists
  await mkdir(UPLOAD_DIR, { recursive: true });

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

      // Generate unique filename
      const timestamp = Date.now();
      const extension = path.extname(data.filename);
      const filename = `${timestamp}-${Math.random().toString(36).substring(7)}${extension}`;
      const filepath = path.join(UPLOAD_DIR, filename);

      // Save file
      await require('fs').promises.writeFile(filepath, buffer);

      // Save to database
      const media = await prisma.media.create({
        data: {
          filename,
          originalName: data.filename,
          mimeType: data.mimetype,
          size: buffer.length,
          url: `/uploads/${filename}`,
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

      // Delete file from filesystem
      try {
        await require('fs').promises.unlink(path.join(UPLOAD_DIR, existingMedia.filename));
      } catch (error) {
        console.warn('Failed to delete file:', error);
      }

      // Delete from database
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
}
