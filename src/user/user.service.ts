import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from 'generated/prisma/client';
import * as nodemailer from 'nodemailer';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}


private transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'seu_user_ethereal', 
        pass: 'sua_senha_ethereal'
    }
});

async enviarEmail(emailDestino: string, codigo: string) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'angeloni.corp@gmail.com',
      pass: 'qwxz xlpd xyea fwhn',
    },
  });

  // 2. Conteúdo do E-mail
  const info = await transporter.sendMail({
    from: '"Angeloni Bank 🏦" <noreply@angelonibank.com>',
    to: emailDestino,
    subject: "Seu código de recuperação chegou! 🔐",
    text: `Olá! Seu código de recuperação de senha é: ${codigo}`,
    html: `
      <div style="font-family: sans-serif; color: #333;">
        <h2>Recuperação de Senha - Angeloni Bank</h2>
        <p>Você solicitou a alteração de senha. Use o código abaixo para continuar:</p>
        <div style="background: #f0f2f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; color: #3182ce; border-radius: 8px;">
          ${codigo}
        </div>
        <p>Se você não solicitou isso, ignore este e-mail.</p>
      </div>
    `,
  });

  console.log("E-mail enviado: %s", info.messageId);
  console.log("URL para visualizar e-mail: %s", nodemailer.getTestMessageUrl(info));
}


async redefinirSenha(email: string, codigo: string, novaSenha: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || user.recoveryCode !== codigo) {
        throw new Error('Código inválido ou expirado');
    }

    return this.prisma.user.update({
        where: { email },
        data: { 
            password: novaSenha,
            recoveryCode: null 
        }
    });
}

async esqueciSenha(email: string) {
  const emailLimpo = email.toLowerCase().trim();
  const user = await this.prisma.user.findUnique({ where: { email: emailLimpo } });

  if (!user) throw new BadRequestException('E-mail não encontrado.');

  const codigo = Math.floor(1000 + Math.random() * 9000).toString();

  await this.prisma.user.update({
    where: { email: emailLimpo },
    data: { recoveryCode: codigo }
  });

  // CHAMADA DO ENVIO DE E-MAIL AQUI
  await this.enviarEmail(emailLimpo, codigo);

  return { message: 'Código enviado com sucesso para o seu e-mail!' };
}


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
    userId: user.id,
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