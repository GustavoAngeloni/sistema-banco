import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Conta, Prisma, User } from 'generated/prisma/client';

@Injectable()
export class AccountService {
    constructor(private prisma: PrismaService) {}



    async account(
    accountWhereUniqueInput: Prisma.ContaWhereUniqueInput,
  ): Promise<Conta | null> {
    return this.prisma.conta.findUnique({
      where: accountWhereUniqueInput,
    });
  }

  async accounts(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ContaWhereUniqueInput;
    where?: Prisma.ContaWhereInput;
    orderBy?: Prisma.ContaOrderByWithRelationInput;
    }): Promise<Conta[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.conta.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createAccount(data: Prisma.ContaCreateInput): Promise<Conta> {
    return this.prisma.conta.create({
      data,
    });
  }

  async updateAccount(params: {
    where: Prisma.ContaWhereUniqueInput;
    data: Prisma.ContaUpdateInput;
    }): Promise<Conta> {
    const { where, data } = params;
    return this.prisma.conta.update({
      data,
      where,
    });
  }

  async deleteAccount(where: Prisma.ContaWhereUniqueInput): Promise<Conta> {
    return this.prisma.conta.delete({
      where,
    });
  }

    async deposit(params: {
      id: number;
      password: string;
      valor: number;
    }): Promise<Conta | null> {
      const { id, password, valor } = params;


      const account = await this.prisma.conta.findUnique({
        where: { id },
        include: {
          usuario: true, // Isso traz o objeto 'password' que está no Model User
        },
      });

        if (!account) {
          throw new Error('Account not found');
        }

        if (account.usuario.password !== password) {
          throw new Error('Invalid password');
        }
        
        const novoSaldo = Number(account.saldo) + Number(valor);

        if (isNaN(novoSaldo)) {
          throw new Error('Erro ao calcular o novo saldo. Verifique os valores de entrada.');
        }

        return this.updateAccount({
          where: { id },
          data: { saldo: novoSaldo },
        });
    }

    async withdraw(params: {
      id: number;
      password: string;
      valor: number;
    }): Promise<Conta | null> {
      const { id, password, valor } = params;


      const account = await this.prisma.conta.findUnique({
        where: { id },
        include: {
          usuario: true, // Isso traz o objeto 'password' que está no Model User
        },
      });

        if (!account) {
          throw new Error('Account not found');
        }

        if (account.usuario.password !== password) {
          throw new Error('Invalid password');
        }

        if (account.saldo < valor) {
          throw new Error('Insufficient funds');
        }


        return this.updateAccount({
          where: { id },
          data: { saldo: account.saldo - valor },
        });
    }
}