import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import type { CreateUserRequest, UpdateUserRequest, ApiResponse, PaginatedResponse, User } from '../../../shared/types';

const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(1),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'EDITOR', 'AUTHOR']).optional()
});

const updateUserSchema = z.object({
  id: z.number(),
  email: z.string().email().optional(),
  username: z.string().min(1).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'EDITOR', 'AUTHOR']).optional()
});

export async function userRoutes(fastify: FastifyInstance) {
  // Get all users (with pagination and filtering)
  fastify.get<{
    Querystring: {
      page?: string;
      limit?: string;
      role?: string;
      search?: string;
    };
    Reply: ApiResponse<PaginatedResponse<Omit<User, 'password'>>>;
  }>('/', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      // Check if user is admin
      const { role } = request.user as any;
      if (role !== 'ADMIN') {
        return reply.status(403).send({
          success: false,
          error: 'Insufficient permissions'
        });
      }

      const page = parseInt(request.query.page || '1');
      const limit = parseInt(request.query.limit || '10');
      const roleFilter = request.query.role;
      const search = request.query.search;
      const offset = (page - 1) * limit;

      const where: any = {};
      
      if (roleFilter && ['ADMIN', 'EDITOR', 'AUTHOR'].includes(roleFilter)) {
        where.role = roleFilter;
      }
      
      if (search) {
        where.OR = [
          { username: { contains: search } },
          { email: { contains: search } }
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.user.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          items: users,
          total,
          page,
          limit,
          totalPages
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

  // Get single user
  fastify.get<{
    Params: { id: string };
    Reply: ApiResponse<Omit<User, 'password'>>;
  }>('/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { role, userId } = request.user as any;
      const targetUserId = parseInt(request.params.id);

      // Users can only view their own profile unless they are admin
      if (role !== 'ADMIN' && userId !== targetUserId) {
        return reply.status(403).send({
          success: false,
          error: 'Insufficient permissions'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'User not found'
        });
      }

      return {
        success: true,
        data: user
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Create new user
  fastify.post<{
    Body: CreateUserRequest;
    Reply: ApiResponse<Omit<User, 'password'>>;
  }>('/', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      // Only admins can create users
      const { role } = request.user as any;
      if (role !== 'ADMIN') {
        return reply.status(403).send({
          success: false,
          error: 'Insufficient permissions'
        });
      }

      const { email, username, password, role: userRole } = createUserSchema.parse(request.body);

      // Check if email or username already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { username }
          ]
        }
      });

      if (existingUser) {
        return reply.status(400).send({
          success: false,
          error: 'Email or username already exists'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          role: userRole || 'EDITOR'
        },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return {
        success: true,
        data: user
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(400).send({
        success: false,
        error: 'Invalid request data'
      });
    }
  });

  // Update user
  fastify.put<{
    Params: { id: string };
    Body: UpdateUserRequest;
    Reply: ApiResponse<Omit<User, 'password'>>;
  }>('/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { role, userId } = request.user as any;
      const targetUserId = parseInt(request.params.id);

      // Users can only edit their own profile unless they are admin
      // Non-admins cannot change roles
      if (role !== 'ADMIN' && userId !== targetUserId) {
        return reply.status(403).send({
          success: false,
          error: 'Insufficient permissions'
        });
      }

      const updateData = updateUserSchema.parse({
        id: targetUserId,
        ...request.body
      });

      // Non-admins cannot change roles
      if (role !== 'ADMIN' && updateData.role && updateData.role !== role) {
        return reply.status(403).send({
          success: false,
          error: 'Cannot change role without admin permissions'
        });
      }

      // Check if email or username already exists (excluding current user)
      if (updateData.email || updateData.username) {
        const existingUser = await prisma.user.findFirst({
          where: {
            AND: [
              { id: { not: targetUserId } },
              {
                OR: [
                  ...(updateData.email ? [{ email: updateData.email }] : []),
                  ...(updateData.username ? [{ username: updateData.username }] : [])
                ]
              }
            ]
          }
        });

        if (existingUser) {
          return reply.status(400).send({
            success: false,
            error: 'Email or username already exists'
          });
        }
      }

      const dataToUpdate: any = {};
      if (updateData.email) dataToUpdate.email = updateData.email;
      if (updateData.username) dataToUpdate.username = updateData.username;
      if (updateData.role) dataToUpdate.role = updateData.role;
      if (updateData.password) {
        dataToUpdate.password = await bcrypt.hash(updateData.password, 10);
      }

      const user = await prisma.user.update({
        where: { id: targetUserId },
        data: dataToUpdate,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return {
        success: true,
        data: user
      };
    } catch (error) {
      fastify.log.error(error);
      if ((error as any).code === 'P2025') {
        return reply.status(404).send({
          success: false,
          error: 'User not found'
        });
      }
      return reply.status(400).send({
        success: false,
        error: 'Invalid request data'
      });
    }
  });

  // Delete user
  fastify.delete<{
    Params: { id: string };
    Reply: ApiResponse<{ message: string }>;
  }>('/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      // Only admins can delete users
      const { role, userId } = request.user as any;
      if (role !== 'ADMIN') {
        return reply.status(403).send({
          success: false,
          error: 'Insufficient permissions'
        });
      }

      const targetUserId = parseInt(request.params.id);

      // Prevent admin from deleting themselves
      if (userId === targetUserId) {
        return reply.status(400).send({
          success: false,
          error: 'Cannot delete your own account'
        });
      }

      await prisma.user.delete({
        where: { id: targetUserId }
      });

      return {
        success: true,
        data: { message: 'User deleted successfully' }
      };
    } catch (error) {
      fastify.log.error(error);
      if ((error as any).code === 'P2025') {
        return reply.status(404).send({
          success: false,
          error: 'User not found'
        });
      }
      return reply.status(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });
}