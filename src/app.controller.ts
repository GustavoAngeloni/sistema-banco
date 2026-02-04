import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  Patch,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from 'src/user/user.service';
import { AccountService } from 'src/account/account.service';
import { User as UserModel, Conta as AccountModel } from 'generated/prisma/client';
import { BadRequestException } from '@nestjs/common';

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

  @Post('pix')
  async pix(@Body() body: { remetenteId: number, emailDestino: string, valor: number }) {
    return this.accountService.transferirPix(body.remetenteId, body.emailDestino, body.valor);
  }

  @Post('accounts/login')
  async login(@Body() body: any) {
  return this.userService.login(body.email, body.password);
  }

  @Post('users/register')
  async register(@Body() userData: any): Promise<UserModel> {
    return this.userService.register(userData);
  }

  @Post('accounts/create')
  async createAccount(@Body() accountData: any): Promise<AccountModel> {
    return this.accountService.createAccount(accountData);
  }

  @Post('forgot-password')
  async forgot(@Body() body: { email: string }) {
    return this.userService.esqueciSenha(body.email);
  }

  @Post('reset-password')
  async reset(@Body() body: { email: string, code: string, newPass: string }) {
    return this.userService.redefinirSenha(body.email, body.code, body.newPass);
  }

  @Get('extrato/:id') // Note que o caminho deve bater com o fetch: /accounts/extrato/ID
  async buscarExtrato(@Param('id') id: string) {
    return this.accountService.getExtrato(Number(id));
  }

  // Area de Imagem

  @Post('upload-foto/:id')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFoto(@Param('id') id: string, @UploadedFile() file: any) {
    const userId = Number(id);

    // Se o ID não for um número, pare aqui mesmo
    if (isNaN(userId)) {
      throw new BadRequestException("ID de usuário inválido!");
    }

    return this.accountService.salvarFoto(userId, file);
  }

  @Get('foto/:id')
  async buscarFoto(@Param('id') id: string) {
  const fotoUrl = await this.accountService.buscarFoto(Number(id));
  return { url: fotoUrl }; // Retorna a string Base64 que está no Redis
}

}

