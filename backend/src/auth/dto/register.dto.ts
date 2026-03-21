export class RegisterDto {
  nombre: string;
  email: string;

  /**
   * El cliente envía la contraseña en texto plano.
   * El servidor se encarga de cifrarla (hashing) antes de guardarla.
   */
  password: string;

  // NOTA: Los campos 'rol', 'estado', 'fechaRegistro' y 'actualizadoEn'
  // NO se incluyen en el DTO por seguridad (el usuario no debe elegirlos)
  // y porque son manejados automáticamente por la base de datos.
}
