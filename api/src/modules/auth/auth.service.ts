import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { from, of } from 'rxjs';
import { Observable } from 'rxjs';
import { UserDto } from 'src/modules/user/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  generateJWT(user: UserDto): Observable<string> {
    const result = this.jwtService.sign(user, {
      secret: process.env.JWT_SECRET,
    });
    return of(result);
  }

  hashPassword(password: string): Observable<string> {
    return from(bcrypt.hash(password, 12));
  }

  comparePassword(newPassword: string, passwordHash: string): Observable<any> {
    return from(bcrypt.compare(newPassword, passwordHash));
  }
}
