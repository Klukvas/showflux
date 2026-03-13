import { applyDecorators } from '@nestjs/common';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export function IsStrongPassword() {
  return applyDecorators(
    IsString() as PropertyDecorator,
    MinLength(8) as PropertyDecorator,
    MaxLength(128) as PropertyDecorator,
    Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, and one digit',
    }) as PropertyDecorator,
  );
}
