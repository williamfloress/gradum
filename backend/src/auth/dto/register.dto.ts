import { IsEmail, IsString } from 'class-validator';

export class RegisterDto {
  @IsString()
  nombre: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  // NOTA: Los campos 'rol', 'estado', 'fechaRegistro' y 'actualizadoEn'
  // NO se incluyen en el DTO por seguridad (el usuario no debe elegirlos)
  // y porque son manejados automáticamente por la base de datos.
}
