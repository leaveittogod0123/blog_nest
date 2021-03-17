import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { from } from 'rxjs';
import { Observable } from 'rxjs';
import { User } from 'src/modules/user/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  generateJWT(user: User): Observable<string> {
    return from(this.jwtService.signAsync({ user }));
  }

  hashPassword(password: string): Observable<string> {
    return from(bcrypt.hash(password, 12));
  }

  comparePassword(newPassword: string, passwordHash: string): Observable<any> {
    return from(bcrypt.compare(newPassword, passwordHash));
  }
}
