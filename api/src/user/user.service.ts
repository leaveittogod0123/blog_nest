import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from } from 'rxjs';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { User } from './user.interface';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  create(user: User): Observable<User> {
    const newUser = new UserEntity();
    newUser.name = user.name;
    newUser.username = user.username;
    return from(this.userRepository.save(newUser)).pipe(
      map((user: UserEntity) => {
        const { id, ...rest } = user;
        return {
          id: `${id}`,
          ...rest,
        };
      }),
    );
  }

  findOne(id: number): Observable<User> {
    return from(this.userRepository.findOne(id)).pipe(
      map((_user: UserEntity) => {
        const { id, ...rest } = _user;
        return {
          id: `${id}`,
          ...rest,
        };
      }),
    );
  }

  findAll(): Observable<User[]> {
    return from(this.userRepository.find()).pipe(
      map((_users: UserEntity[]) => {
        const users = _users.map((user: UserEntity) => {
          const { id, ...rest } = user;
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
}
