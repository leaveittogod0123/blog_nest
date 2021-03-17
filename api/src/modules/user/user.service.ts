import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, throwError } from 'rxjs';
import { Observable } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AuthService } from 'src/modules/auth/auth.service';
import { getConnection, Repository, Transaction } from 'typeorm';
import { UserEntity } from './user.entity';
import { PatchUserDto, User, UserRole } from './user.dto';

@Injectable()
export class UserService {
  private readonly logger: Logger = new Logger(this.constructor.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private authService: AuthService,
  ) {}

  create(user: User): Observable<User> {
    return this.authService.hashPassword(user.password).pipe(
      switchMap((passwordHash: string) => {
        const newUser = new UserEntity();
        newUser.name = user.name;
        newUser.username = user.username;
        newUser.email = user.email;
        newUser.password = passwordHash;
        return from(this.userRepository.save(newUser)).pipe(
          map((user: UserEntity) => {
            const { id, password, ...rest } = user;
            return {
              id: `${id}`,
              ...rest,
            };
          }),
          catchError((err) => throwError(err)),
        );
      }),
    );
  }

  findOne(id: number): Observable<User> {
    return from(this.userRepository.findOne(id)).pipe(
      map((_user: UserEntity) => {
        const { id, password, ...rest } = _user;
        return {
          id: `${id}`,
          ...rest,
        };
      }),
      catchError((err) => throwError(err)),
    );
  }

  findAll(): Observable<User[]> {
    return from(this.userRepository.find()).pipe(
      map((_users: UserEntity[]) => {
        const users = _users.map((user: UserEntity) => {
          const { id, password, ...rest } = user;
          return {
            id: `${id}`,
            ...rest,
          };
        });
        return users;
      }),
      catchError((err) => throwError(err)),
    );
  }

  deleteOne(id: number): Observable<any> {
    return from(this.userRepository.delete(id));
  }

  updateOne(id: number, user: User): Observable<any> {
    const newUser = new UserEntity();
    newUser.name = user.name;
    newUser.username = user.username;
    return from(this.userRepository.update(id, newUser));
  }

  async updateRoleOfUser(id: number, req: PatchUserDto): Promise<any> {
    const connection = getConnection();
    const queryRunner = connection.createQueryRunner();
    await queryRunner.connect(); // performs connection

    await queryRunner.startTransaction();

    try {
      // execute some operations on this transaction:
      // commit transaction now:
      const result = await queryRunner.manager
        .getRepository(UserEntity)
        .createQueryBuilder()
        .update(UserEntity)
        .set({ ...req, role: UserRole[req.role.toUpperCase()] })
        .where('id = :id', { id })
        .execute();

      await queryRunner.commitTransaction();
      this.logger.debug(`patch result : ${JSON.stringify(result)}`);
    } catch (err) {
      // since we have errors let's rollback changes we made
      await queryRunner.rollbackTransaction();
    } finally {
      // you need to release query runner which is manually created:
      await queryRunner.release();
    }
  }

  login(user: User): Observable<string> {
    return this.validateUser(user.email, user.password).pipe(
      switchMap((user: User) => {
        if (user) {
          return this.authService
            .generateJWT(user)
            .pipe(map((jwt: string) => jwt));
        } else {
          return 'Wrong Credentials';
        }
      }),
    );
  }

  validateUser(email: string, password: string): Observable<User> {
    return this.findByMail(email).pipe(
      switchMap((user: User) =>
        this.authService.comparePassword(password, user.password).pipe(
          map((match: boolean) => {
            if (match) {
              return user;
            } else {
              throw Error;
            }
          }),
        ),
      ),
    );
  }

  findByMail(email: string): Observable<User> {
    return from(this.userRepository.findOne({ email })).pipe(
      map((_user: UserEntity) => {
        const { id, ...rest } = _user;
        return {
          id: `${id}`,
          ...rest,
        };
      }),
    );
  }
}
