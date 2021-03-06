import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OAuthClient } from '@app/entities';
import { GraphQLModule } from '@nestjs/graphql';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientResolver, CurrentUserResolver, UserResolver } from './resolvers';
import { GraphqlFactory } from './graphql.factory';
import { AccessControlModule } from 'nest-access-control';
import { roles } from '@app/modules/auth';
import { APP_FILTER } from '@nestjs/core';
import { GraphqlFilter } from '@app/modules/management-api/filters';
import { SessionService } from '@app/modules/management-api/services';
import { UserModule } from '@app/modules/user';

@Module({
  imports: [
    ConfigModule,
    UserModule,
    AccessControlModule.forRoles(roles),
    TypeOrmModule.forFeature([
      OAuthClient,
    ]),
    GraphQLModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useClass: GraphqlFactory,
    }),
  ],
  providers: [
    SessionService,
    ClientResolver,
    UserResolver,
    CurrentUserResolver,
    {
      provide: APP_FILTER,
      useClass: GraphqlFilter,
    },
  ],
})
export class ManagementApiModule {}
