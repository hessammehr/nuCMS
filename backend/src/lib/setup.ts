import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export async function createAdminUser() {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await prisma.user.create({
      data: {
        email: 'admin@nucms.local',
        username: 'admin',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    
    console.log('✅ Default admin user created (admin/admin123)');
  }
}
