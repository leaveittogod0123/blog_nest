import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, throwError } from 'rxjs';
import { Observable } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AuthService } from 'src/auth/auth.service';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { User } from './user.interface';

@Injectable()
export class UserService {
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
