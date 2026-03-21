export class LoginDto {
  email: string;

  /**
   * Se usa 'password' (texto plano) porque es lo que el usuario envía.
   * El servidor lo comparará con el 'passwordHash' guardado en la DB.
   */
  password: string;
}
