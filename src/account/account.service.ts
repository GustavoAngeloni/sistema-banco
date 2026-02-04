import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Conta, Prisma, User } from 'generated/prisma/client';
import Redis from 'ioredis';
import { InternalServerErrorException } from '@nestjs/common';



@Injectable()
export class AccountService {
    constructor(private prisma: PrismaService) {}
    private redis = new Redis({
      host: '127.0.0.1',
      port: 6379
    });

    async salvarFoto(userId: number, file: any) {
      try {
        // 1. Converter para Base64
        const base64Image = file.buffer.toString('base64');
        const dataUrl = `data:${file.mimetype};base64,${base64Image}`;
        
        const chave = `user:foto:${userId}`;

        // 2. Usar 'await' para garantir que gravou antes de responder
        await this.redis.set(chave, dataUrl);
        
        console.log(`✅ Foto salva no Redis! Chave: ${chave}`);
        
        return { url: dataUrl };
      } catch (error) {
        console.error("❌ Erro ao gravar no Redis:", error);
        throw new InternalServerErrorException("Falha no Redis");
      }
    }
    async buscarFoto(userId: number){
      return await this.redis.get(`user:foto:${userId}`);
    }

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

    async transferirPix(remetenteId: number, emailDestino: string, valor: number) {
      return this.prisma.$transaction(async (tx) => {

        const remetente = await tx.conta.findUnique({
          where: { id: remetenteId },
          include: { usuario: true }
        });

        if (!remetente || remetente.saldo < valor) {
          throw new Error('Saldo insuficiente ou conta não encontrada');
        }

        const usuarioDestino = await tx.user.findUnique({
          where: { email: emailDestino },
          include: { conta: true },
        });

        if (!usuarioDestino || !usuarioDestino.conta) {
          throw new Error('Chave PIX (e-mail) não encontrada');
        }

  
        const remetenteAtualizado = await tx.conta.update({
          where: { id: remetenteId },
          data: { saldo: { decrement: valor } },
        });

        await tx.conta.update({
          where: { id: usuarioDestino.conta.id },
          data: { saldo: { increment: valor } },
        });

        await tx.transaction.create({
          data:{
            amount: valor,
            type: "PIX_ENVIADO",
            description: `Para ${emailDestino}`,
            accountId: remetenteId
          }
        });

        await tx.transaction.create({
          data: {
            amount: valor,
            type: 'PIX_RECEBIDO',
            description: `De: ${remetente.usuario.email}`,
            accountId: usuarioDestino.conta.id,
          },
        });

        return remetenteAtualizado; 
      });
    }


    async getExtrato(accountId: number) {
    return this.prisma.transaction.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' }, 
    });
    }
}