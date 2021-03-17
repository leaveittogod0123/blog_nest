import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-guard';
import { JwtStrategy } from './jwt-strategy';
import { RolesGuard } from './roles.guard';
import { UserModule } from 'src/modules/user/user.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: '3600s',
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    JwtAuthGuard,
    JwtStrategy,
    RolesGuard,
    ConfigService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
