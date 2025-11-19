import {
  Injectable,
  ExecutionContext,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Комбинированный guard, который поддерживает оба типа аутентификации:
 * - JWT (access token) через Authorization: Bearer
 * - API Key (JWT-based) через X-API-Key
 *
 * Важно: оба заголовка не могут использоваться одновременно
 */
@Injectable()
export class CombinedAuthGuard extends AuthGuard(['jwt', 'api-key-jwt']) {
  private readonly logger = new Logger(CombinedAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // Проверяем наличие обоих заголовков одновременно
    const hasAuthorization =
      request.headers.authorization && request.headers.authorization.startsWith('Bearer ');
    const hasApiKey = request.headers['x-api-key'] || request.query?.apiKey;

    if (hasAuthorization && hasApiKey) {
      this.logger.warn(`Attempt to use both Authorization and X-API-Key headers: ${request.ip}`);
      throw new BadRequestException(
        'Cannot use both Authorization and X-API-Key headers simultaneously. Use only one authentication method.',
      );
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    // Если один из guards успешно аутентифицировал пользователя, возвращаем его
    if (user) {
      return user;
    }

    // Проверяем наличие токенов
    const hasAuthorization =
      request.headers.authorization && request.headers.authorization.startsWith('Bearer ');
    const hasApiKey = request.headers['x-api-key'] || request.query?.apiKey;

    if (!hasAuthorization && !hasApiKey) {
      this.logger.warn(
        `Authentication required but not provided: ${request.method} ${request.url} from ${request.ip}`,
      );
      throw new UnauthorizedException(
        'Authentication required. Provide either Authorization Bearer token or X-API-Key header.',
      );
    }

    // Есть токен, но он невалидный
    if (err) {
      this.logger.warn(
        `Authentication error: ${err.message || 'Unknown error'} - ${request.method} ${request.url} from ${request.ip}`,
      );
      throw err;
    }

    if (info) {
      this.logger.warn(
        `Invalid token: ${info.message || 'Unknown error'} - ${request.method} ${request.url} from ${request.ip}`,
      );
      throw new UnauthorizedException(info.message || 'Invalid token');
    }

    this.logger.warn(`Authentication failed: ${request.method} ${request.url} from ${request.ip}`);
    throw new UnauthorizedException('Authentication failed');
  }
}
