import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@/modules/auth/domain/repositories/i-user.repository';
import { RefreshTokenDto, RefreshTokenResponseDto } from './refresh-token.dto';

interface RefreshTokenPayload {
  sub: string;
  email?: string;
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
    let payload: RefreshTokenPayload;

    try {
      payload = this.jwtService.verify<RefreshTokenPayload>(dto.refreshToken);
    } catch {
      throw new UnauthorizedException('INVALID_TOKEN');
    }

    if (!payload?.sub) {
      throw new UnauthorizedException('INVALID_TOKEN');
    }

    const user = await this.userRepo.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('INVALID_TOKEN');
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: payload.email,
    });

    return {
      accessToken,
      expiresIn: 3600,
    };
  }
}
