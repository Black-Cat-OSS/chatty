import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { DATABASE_CONNECTION, Database } from '../database/database.module';
import { users, User, NewUser } from '../database/schema/users';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: Database,
  ) {}

  async create(userData: NewUser): Promise<User> {
    // Хешируем пароль перед сохранением
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const [user] = await this.db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword,
      })
      .returning();

    this.logger.log(`User created: ${user.email} (${user.id})`);
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.db.select().from(users);
  }

  async findOne(id: string): Promise<User> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await this.db.select().from(users).where(eq(users.email, email)).limit(1);

    return user || null;
  }

  async update(id: string, userData: Partial<NewUser>): Promise<User> {
    const updateData: Partial<NewUser> = { ...userData, updatedAt: new Date() };

    // Если обновляется пароль, хешируем его
    if (userData.password) {
      updateData.password = await bcrypt.hash(userData.password, 10);
      this.logger.log(`Password updated for user: ${id}`);
    }

    const [user] = await this.db.update(users).set(updateData).where(eq(users.id, id)).returning();

    if (!user) {
      this.logger.warn(`Attempt to update non-existent user: ${id}`);
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    this.logger.log(`User updated: ${user.email} (${user.id})`);
    return user;
  }

  async remove(id: string): Promise<void> {
    const [deletedUser] = await this.db.delete(users).where(eq(users.id, id)).returning();

    if (!deletedUser) {
      this.logger.warn(`Attempt to delete non-existent user: ${id}`);
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    this.logger.log(`User deleted: ${deletedUser.email} (${id})`);
  }
}
