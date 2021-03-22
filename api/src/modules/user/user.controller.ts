import {
  Body,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Controller, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { of } from 'rxjs';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { JwtAuthGuard } from 'src/modules/auth/jwt-guard';
import { hasRoles } from 'src/modules/auth/role.decorator';
import { RolesGuard } from 'src/modules/auth/roles.guard';
import {
  PaginationDto,
  RequestUserDto,
  ResponseUserDto,
  UserRole,
} from './dto/user.dto';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  private readonly logger: Logger = new Logger(this.constructor.name);

  constructor(private userService: UserService) {}

  @Post()
  @ApiCreatedResponse({
    description: 'add User',
  })
  create(@Body() user: RequestUserDto): Promise<ResponseUserDto> {
    return this.userService.create(user);
  }

  @Post('login')
  @ApiOperation({ summary: '회원 로그인 API' })
  @ApiOkResponse({ description: 'User login' })
  @ApiUnauthorizedResponse({ description: 'Invalid crendentials' })
  login(@Body() user: RequestUserDto): Observable<any> {
    return this.userService.login(user).pipe(
      map((jwt: string) => {
        return { accessToken: jwt };
      }),
    );
  }

  @Get(':id')
  findOne(@Param() params): Observable<ResponseUserDto | any> {
    return this.userService.findOne(+params.id).pipe(
      map((user: ResponseUserDto) => user),
      catchError((err) => of({ error: err.message })),
    );
  }

  @Get()
  @ApiOperation({ summary: '회원 목록 조회 API' })
  @ApiOkResponse({ type: [PaginationDto] })
  findAll(@Query() queryParam): Promise<PaginationDto | any> {
    return this.userService.findAll(queryParam?.cursor);
    // .pipe(catchError((err) => of({ error: err.message })));
  }

  @ApiBearerAuth()
  @hasRoles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  deleteOne(@Param('id') id: string): Observable<ResponseUserDto> {
    return this.userService.deleteOne(+id);
  }

  @Put(':id')
  updateOne(
    @Param('id') id: string,
    @Body() user: RequestUserDto,
  ): Observable<any> {
    return this.userService.updateOne(+id, user);
  }

  @ApiBearerAuth()
  @hasRoles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/role')
  updateRoleOfUser(
    @Param('id') id: string,
    @Body() user: RequestUserDto,
  ): Promise<ResponseUserDto> {
    return this.userService.updateRoleOfUser(+id, user);
  }
}
