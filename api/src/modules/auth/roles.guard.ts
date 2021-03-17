import {
  CanActivate,
  ExecutionContext,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UserService } from 'src/modules/user/user.service';
import { User } from '../user/user.dto';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger: Logger = new Logger(this.constructor.name);
  constructor(
    private reflector: Reflector,
    @Inject(forwardRef(() => UserService)) private userService: UserService,
  ) {
    this.logger.debug(`${this.constructor.name} 이 생성되었습니다.`);
  }
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user.user;
    this.logger.debug(
      `RolesGuard canActivate works ${JSON.stringify(user)}, roles: ${roles},`,
    );
    return this.userService.findOne(+user.id).pipe(
      map((user: User) => {
        const hasRole = () =>
          roles?.map((role) => role?.toLowerCase()).indexOf(user.role) > -1;
        let hasPermission = false;

        if (hasRole()) {
          hasPermission = true;
        }
        return user && hasPermission;
      }),
      catchError((err) => throwError(err)),
    );
  }
}
