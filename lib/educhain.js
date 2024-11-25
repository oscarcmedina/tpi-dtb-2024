const { Contract } = require("fabric-contract-api");
const crypto = require("crypto");

class EduChain extends Contract {
  async emitirCertificado(
    ctx,
    nombreEstudiante,
    dni,
    programa,
    fechaEmision,
    grado,
    tituloOtorgado,
    institucion
  ) {
    validarRolUsuario(ctx, "administrador");

    validarFormatoFecha(fechaEmision);

    validarCamposCompletos(
      nombreEstudiante,
      dni,
      programa,
      fechaEmision,
      grado,
      tituloOtorgado,
      institucion
    );

    // Consultar si ya existe un certificado para este estudiante con los mismos datos
    const certificadosExistentes = await this.obtenerCertificadosPorEstudiante(
      ctx,
      dni
    );

    // Verificar si ya existe un certificado con los mismos datos
    for (const certificado of certificadosExistentes) {
      if (
        certificado.nombreEstudiante === nombreEstudiante &&
        certificado.programa === programa &&
        certificado.fechaEmision === fechaEmision &&
        certificado.grado === grado &&
        certificado.tituloOtorgado === tituloOtorgado &&
        certificado.institucion === institucion
      ) {
        throw new Error(
          "Ya existe un certificado emitido con los mismos datos."
        );
      }
    }

    const certificadoId = generarCertificadoId(
      nombreEstudiante,
      dni,
      programa,
      fechaEmision,
      grado,
      tituloOtorgado,
      institucion
    );

    const certificado = {
      nombreEstudiante,
      dni,
      programa,
      fechaEmision,
      grado,
      tituloOtorgado,
      institucion,
      certificadoId,
      estado: "activo",
    };

    await ctx.stub.putState(
      certificadoId,
      Buffer.from(JSON.stringify(certificado))
    );

    return {
      message: "Certificado emitido correctamente.",
      certificadoId,
    };
  }

  async verificarCertificado(ctx, certificadoId) {
    const certificadoAsBytes = await ctx.stub.getState(certificadoId);
    if (!certificadoAsBytes || certificadoAsBytes.length === 0) {
      throw new Error(`Certificado con ID ${certificadoId} no encontrado.`);
    }
    const certificado = JSON.parse(certificadoAsBytes.toString());
    if (certificado.estado === "revocado") {
      throw new Error(`El certificado ${certificadoId} ha sido revocado.`);
    }
    return certificado;
  }

  async obtenerCertificadosPorEstudiante(ctx, dni) {
    const query = { selector: { dni } };
    const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
    const resultados = [];
    while (true) {
      const res = await iterator.next();
      if (res.value) {
        resultados.push(JSON.parse(res.value.value.toString("utf8")));
      }
      if (res.done) break;
    }
    return resultados;
  }

  async revocarCertificado(ctx, certificadoId, motivo) {
    validarCamposCompletos(certificadoId, motivo);

    validarRolUsuario(ctx, "administrador");

    const certificado = await this.verificarCertificado(ctx, certificadoId);

    certificado.estado = "revocado";
    certificado.motivoRevocacion = motivo;
    await ctx.stub.putState(
      certificadoId,
      Buffer.from(JSON.stringify(certificado))
    );

    return {
      message: "Revocacion Exitosa",
    };
  }

  async crearSolicitudVerificacion(
    ctx,
    certificadoId,
    nombreEmpleador,
    fechaSolicitud
  ) {
    validarCamposCompletos(certificadoId, nombreEmpleador, fechaSolicitud);

    validarFormatoFecha(fechaSolicitud);

    await this.verificarEmpleadorPorNombre(ctx, nombreEmpleador);

    const solicitudId = generarSolicitudId(
      certificadoId,
      nombreEmpleador,
      fechaSolicitud
    );

    const solicitud = {
      certificadoId,
      nombreEmpleador,
      fechaSolicitud,
      solicitudId,
      resultado: null,
    };
    const certificado = await this.verificarCertificado(ctx, certificadoId);
    solicitud.resultado =
      certificado.estado === "activo" ? "válido" : "inválido";
    await ctx.stub.putState(
      solicitudId,
      Buffer.from(JSON.stringify(solicitud))
    );
    return solicitud;
  }

  // Metodo no solicitado pero lo creamos para poder hacer la validacion de empleado registrado

  async registrarEmpleador(ctx, nombreEmpleador) {
    const contadorKey = "EMP_COUNT";
    let contador = await ctx.stub.getState(contadorKey);

    if (!contador || contador.length === 0) {
      contador = 1;
    } else {
      contador = parseInt(contador.toString()) + 1;
    }
    const empleadorKey = `EMP-${contador}`; // ID empleador - Ejemplo: EMP-1

    const empleador = {
      empleadorKey,
      nombre: nombreEmpleador,
      autorizado: true,
    };

    await ctx.stub.putState(contadorKey, Buffer.from(contador.toString()));

    await ctx.stub.putState(
      empleadorKey,
      Buffer.from(JSON.stringify(empleador))
    );

    return `Empleador ${nombreEmpleador} registrado con éxito con ID ${empleadorKey}.`;
  }

  async verificarEmpleadorPorNombre(ctx, nombreEmpleador) {
    // Usa una consulta para buscar empleadores que coincidan con el nombre dado
    const iterator = await ctx.stub.getStateByRange("EMP-", "EMP-~");

    let autorizado = false;
    let result = await iterator.next();

    while (!result.done) {
      const empleador = JSON.parse(result.value.value.toString());
      if (empleador.nombre === nombreEmpleador && empleador.autorizado) {
        autorizado = true;
        break;
      }
      result = await iterator.next(); // Avanza al siguiente valor
    }

    // Cerrar el iterador
    await iterator.close();

    if (!autorizado) {
      throw new Error(`El empleador ${nombreEmpleador} no esta registrado.`);
    }
    return true;
  }
}

function validarRolUsuario(ctx, rolEsperado) {
  const userRole = ctx.clientIdentity.attrs["hf.EnrollmentID"];
  if (userRole !== rolEsperado) {
    throw new Error(
      `No tienes permisos para realizar esta acción. Rol requerido: ${rolEsperado}`
    );
  }
}

function validarCamposCompletos(...campos) {
  for (const campo of campos) {
    if (!campo || campo.trim() === "") {
      throw new Error("Todos los campos deben estar completos.");
    }
  }
}

function generarCertificadoId(
  nombreEstudiante,
  dni,
  programa,
  fechaEmision,
  grado,
  tituloOtorgado,
  institucion
) {
  const data = `${nombreEstudiante}|${dni}|${programa}|${fechaEmision}|${grado}|${tituloOtorgado}|${institucion}|${Date.now()}`;
  return crypto.createHash("sha256").update(data).digest("hex");
}

function generarSolicitudId(certificadoId, nombreEmpleador, fechaSolicitud) {
  const data = `${certificadoId}|${nombreEmpleador}|${fechaSolicitud}|${Date.now()}`;
  return crypto.createHash("sha256").update(data).digest("hex");
}

function validarFormatoFecha(fecha) {
  // Expresión regular para formato YYYY-MM-DD
  const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  if (!regex.test(fecha)) {
    throw new Error("La fecha debe estar en formato YYYY-MM-DD.");
  }

  // Verifica que la fecha no sea futura
  const fechaIngresada = new Date(fecha);
  const fechaActual = new Date();
  if (fechaIngresada > fechaActual) {
    throw new Error("La fecha de la solicitud no puede ser futura.");
  }
}

module.exports = EduChain;
