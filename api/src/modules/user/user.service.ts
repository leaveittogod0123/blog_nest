import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, identity, throwError } from 'rxjs';
import { Observable } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { AuthService } from 'src/modules/auth/auth.service';
import { getConnection, Repository, Transaction } from 'typeorm';
import { User } from './user.entity';
import {
  PaginationDto,
  PatchUserDto,
  RequestUserDto,
  ResponseUserDto,
  UserRole,
} from './dto/user.dto';

@Injectable()
export class UserService {
  private readonly logger: Logger = new Logger(this.constructor.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private authService: AuthService,
  ) {}

  async create(user: RequestUserDto): Promise<ResponseUserDto> {
    const connection = getConnection();
    const queryRunner = connection.createQueryRunner();
    await queryRunner.connect(); // performs connection
    await queryRunner.startTransaction();

    // rxjs로 구현하고싶은데 몰라서 async await 으로 구현

    const isDuplicate: boolean = await this.findByName(user.username);

    if (isDuplicate) {
      throw Error('AnError');
    }

    const passwordHash: string = await this.authService
      .hashPassword(user.password)
      .toPromise();

    const newUser = new User();
    newUser.name = user.name;
    newUser.username = user.username;
    newUser.email = user.email;
    newUser.password = passwordHash;

    let savedUser: ResponseUserDto;

    try {
      const { id, password, ...rest }: User = await this.userRepository.save(
        newUser,
      );
      savedUser = {
        id: `${id}`,
        ...rest,
      };

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(err);
      throw Error(err);
    } finally {
      await queryRunner.release();
    }

    return savedUser;
  }

  async findByName(username: string): Promise<boolean> {
    const user: User = await this.userRepository.findOne(username);
    return !!user;
  }

  findOne(id: number): Observable<ResponseUserDto> {
    return from(this.userRepository.findOne(id)).pipe(
      map((_user: User) => {
        const { id, password, ...rest } = _user;
        return {
          id: `${id}`,
          ...rest,
        };
      }),
      catchError((err) => throwError(err)),
    );
  }

  async findAll(cursor?): Promise<PaginationDto> {
    const connection = getConnection();
    const queryRunner = connection.createQueryRunner();
    const conditions: string[] = [];
    if (cursor) {
      conditions.push(
        `AND CONCAT(LPAD(id,10,'0'), LPAD(username,10,'0')) >= '${cursor}'`,
      );
    }

    const query = `SELECT id, name, username, email, role, CONCAT(LPAD(id,10,'0'), LPAD(username,10,'0')) as custom_cursor
    FROM user WHERE 1=1 ${conditions.join()}
    LIMIT 3`;
    try {
      const result = await queryRunner.query(query);
      const users = result.map((user: User) => {
        const { id, ...rest } = user;
        return {
          id: `${id}`,
          ...rest,
        };
      });
      const beforeCursor = users[0]?.custom_cursor || null;
      const nextCursor = users[users.length - 1]?.custom_cursor || null;
      const paginationDto: PaginationDto = new PaginationDto();
      paginationDto.data = users;
      paginationDto.paging = {
        cursor: {
          after: nextCursor,
          before: beforeCursor,
        },
      };
      // paginationDto.paging.cursor.after = nextCursor;
      // paginationDto.paging.cursor.before = beforeCursor;
      // console.log(paginationDto);
      return paginationDto;
    } catch (error) {
      throw Error('findAll() failed');
    }
  }

  deleteOne(id: number): Observable<any> {
    return from(this.userRepository.delete(id));
  }

  updateOne(id: number, user: RequestUserDto): Observable<any> {
    const newUser = new User();
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
      await queryRunner.manager
        .getRepository(User)
        .createQueryBuilder()
        .update(User)
        .set({ ...req, role: UserRole[req.role.toUpperCase()] })
        .where('id = :id', { id })
        .execute();

      await queryRunner.commitTransaction();
    } catch (err) {
      // since we have errors let's rollback changes we made
      await queryRunner.rollbackTransaction();
      this.logger.error(err);
    } finally {
      // you need to release query runner which is manually created:
      await queryRunner.release();
    }
  }

  login(user: RequestUserDto): Observable<string> {
    return this.validateUser(user.email, user.password).pipe(
      switchMap((user: ResponseUserDto) => {
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

  validateUser(email: string, password: string): Observable<ResponseUserDto> {
    return this.findByMail(email).pipe(
      switchMap((user: RequestUserDto) => {
        return this.authService.comparePassword(password, user.password).pipe(
          map((match: boolean) => {
            if (match) {
              return user;
            } else {
              throw Error;
            }
          }),
        );
      }),
    );
  }

  findByMail(email: string): Observable<ResponseUserDto> {
    return from(this.userRepository.findOne({ email })).pipe(
      map((_user: User) => {
        const { id, ...rest } = _user;
        return {
          id: `${id}`,
          ...rest,
        };
      }),
    );
  }
}
