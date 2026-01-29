import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from 'generated/prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

    async user(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });
  }


  async register(data: Prisma.UserCreateInput) {
  return this.prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: data.password, // Lembre-se de usar hash no futuro!
      conta: {
        create: {
          saldo: 0, // A conta nasce com saldo zerado
        }
      }
    },
    include: { conta: true } // Retorna os dados da conta junto
  });
}


  async login(email: string, senha: string) {
  const user = await this.prisma.user.findUnique({
    where: { email },
    include: { conta: true }, // Traz a conta junto para pegar o saldo
  });

  if (!user || user.password !== senha) {
    throw new Error('E-mail ou senha incorretos');
  }

  return {
    nome: user.name,
    saldo: user.conta!.saldo,
    contaId: user.conta!.id
  };
}

  async users(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }


  async updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;
    return this.prisma.user.update({
      data,
      where,
    });
  }

  async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where,
    });
  }
}