import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-guard';
import { JwtStrategy } from './jwt-strategy';
import { RolesGuard } from './roles.guard';
import { UserModule } from 'src/modules/user/user.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  providers: [AuthService, JwtAuthGuard, RolesGuard, JwtStrategy],
  imports: [
    PassportModule.register({
      defaultStrategy: 'jwt',
      session: false,
    }),
    forwardRef(() => UserModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: '3600s',
          },
        };
      },
    }),
  ],
  exports: [AuthService],
})
export class AuthModule {}
