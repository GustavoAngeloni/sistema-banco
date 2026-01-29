import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  Patch,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { AccountService } from 'src/account/account.service';
import { User as UserModel, Conta as AccountModel } from 'generated/prisma/client';

@Controller()
export class AppController {
  constructor(
    private readonly userService: UserService,
    private readonly accountService: AccountService,
  ) {}
  @Get('users/:id')
  async getUserById(@Param('id') id: string): Promise<UserModel | null> {
    return this.userService.user({ id: Number(id) });
  }

  @Get('users/:id/:password')
  async getAccountById(
    @Param('id') id: string,
    @Param('password') password: string,
  ): Promise< AccountModel | null> {
    if (!password) {
      return null;
    }
      return this.accountService.account({ id: Number(id) });
  }

  @Patch('accounts/deposit')
  async deposit(
    @Body('id') id: string,
    @Body('password') password: string,
    @Body('amount') amount: string,
  ): Promise<AccountModel | null> {
    if (!password) {
      return null;
    }
    return this.accountService.deposit({ id: Number(id), password: password, valor: Number(amount) });
  }

  @Patch('accounts/withdraw')
  async withdraw(
    @Body('id') id: string,
    @Body('password') password: string,
    @Body('amount') amount: string,
  ): Promise<AccountModel | null> {
    if (!password) {
      return null;
    }
    return this.accountService.withdraw({ id: Number(id), password: password, valor: Number(amount) });
  }

  @Post('users/create')
  async createUser(@Body() userData: any): Promise<UserModel> {
    return this.userService.createUser(userData);
  }

  @Post('accounts/create')
  async createAccount(@Body() accountData: any): Promise<AccountModel> {
    return this.accountService.createAccount(accountData);
  }
}