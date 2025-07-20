import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import type { LoginRequest, LoginResponse, ApiResponse } from '../../../shared/types';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

export async function authRoutes(fastify: FastifyInstance) {
  // Login
  fastify.post<{
    Body: LoginRequest;
    Reply: ApiResponse<LoginResponse>;
  }>('/login', async (request, reply) => {
    try {
      const { username, password } = loginSchema.parse(request.body);

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { username },
            { email: username }
          ]
        }
      });

      if (!user || !await bcrypt.compare(password, user.password)) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid credentials'
        });
      }

      const token = fastify.jwt.sign(
        { userId: user.id, role: user.role },
        { expiresIn: '7d' }
      );

      const { password: _, ...userWithoutPassword } = user;

      return {
        success: true,
        data: {
          token,
          user: userWithoutPassword
        }
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(400).send({
        success: false,
        error: 'Invalid request data'
      });
    }
  });

  // Get current user
  fastify.get<{
    Reply: ApiResponse<Omit<any, 'password'>>;
  }>('/me', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { userId } = request.user as any;
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
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

  // Refresh token
  fastify.post<{
    Reply: ApiResponse<{ token: string }>;
  }>('/refresh', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { userId, role } = request.user as any;
      
      const token = fastify.jwt.sign(
        { userId, role },
        { expiresIn: '7d' }
      );

      return {
        success: true,
        data: { token }
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
