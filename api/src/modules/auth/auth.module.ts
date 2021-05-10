import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from 'src/modules/user/user.module';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-guard';
import { JwtStrategy } from './jwt-strategy';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [
    forwardRef(() => UserModule),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService, JwtAuthGuard, JwtStrategy, RolesGuard],
  exports: [AuthService],
})
export class AuthModule {}
