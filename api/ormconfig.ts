import { TypeOrmModuleOptions } from '@nestjs/typeorm';

const config: TypeOrmModuleOptions[] = [
  {
    type: 'mysql',
    host: 'localhost',
    port: 3307,
    username: 'service',
    password: 'local',
    database: 'blog',
    entities: ['dist/**/*.entity{.ts,.js}'],
    synchronize: false, // https://medium.com/swlh/migrations-over-synchronize-in-typeorm-2c66bc008e74
  },
];

export = config;
