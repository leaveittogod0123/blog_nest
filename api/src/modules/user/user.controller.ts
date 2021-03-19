import {
  Body,
  Delete,
  Get,
  Param,
  Patch,
  Put,
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
import { UserDto, UserRole } from './user.dto';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  @ApiCreatedResponse({
    description: 'add User',
  })
  create(@Body() user: UserDto): Observable<UserDto | any> {
    return this.userService.create(user).pipe(
      map((user: UserDto) => user),
      catchError((err) => of({ error: err.message })),
    );
  }

  @Post('login')
  @ApiOperation({ summary: '회원 로그인 API' })
  @ApiOkResponse({ description: 'User login' })
  @ApiUnauthorizedResponse({ description: 'Invalid crendentials' })
  login(@Body() user: UserDto): Observable<any> {
    return this.userService.login(user).pipe(
      map((jwt: string) => {
        return { accessToken: jwt };
      }),
    );
  }

  @Get(':id')
  findOne(@Param() params): Observable<UserDto | any> {
    return this.userService.findOne(+params.id).pipe(
      map((user: UserDto) => user),
      catchError((err) => of({ error: err.message })),
    );
  }

  @ApiBearerAuth()
  @hasRoles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  @ApiOperation({ summary: '회원 목록 조회 API' })
  @ApiOkResponse({ type: [UserDto] })
  findAll(): Observable<UserDto[] | any> {
    return this.userService
      .findAll()
      .pipe(catchError((err) => of({ error: err.message })));
  }

  @Delete(':id')
  deleteOne(@Param('id') id: string): Observable<UserDto> {
    return this.userService.deleteOne(+id);
  }

  @Put(':id')
  updateOne(@Param('id') id: string, @Body() user: UserDto): Observable<any> {
    return this.userService.updateOne(+id, user);
  }

  @ApiBearerAuth()
  @hasRoles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/role')
  updateRoleOfUser(
    @Param('id') id: string,
    @Body() user: UserDto,
  ): Promise<UserDto> {
    return this.userService.updateRoleOfUser(+id, user);
  }
}
