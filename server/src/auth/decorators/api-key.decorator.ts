import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ApiKey } from '../../database/schema/api-keys';

/**
 * Декоратор для получения информации об API ключе из request
 * Использование: @GetApiKey() apiKey: ApiKey
 * Работает как с JWT-based API ключами, так и со старым форматом
 */
export const GetApiKey = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ApiKey | undefined => {
    const request = ctx.switchToHttp().getRequest();
    // Проверяем, есть ли API ключ в request (для api-key-jwt стратегии)
    if (request.user?.apiKey) {
      return request.user.apiKey;
    }
    // Для обратной совместимости
    return request.apiKey;
  },
);
