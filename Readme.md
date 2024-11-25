# EduChain

> **EduChain** es un contrato inteligente desarrollado en Node.js para la gestión de certificados académicos en una blockchain Hyperledger Fabric. EduChain permite emitir, verificar, revocar y consultar certificados académicos de manera descentralizada y segura.

## Tabla de Contenidos

- [Descripción](#descripción)
- [Instalación y Configuración](#instalación-y-configuración)
- [Funciones del Contrato](#funciones-del-contrato)
- [Ejemplos de Uso](#ejemplos-de-uso)
- [Contribuciones](#contribuciones)
- [Licencia](#licencia)

---

## Descripción

EduChain es un contrato inteligente diseñado para gestionar certificados académicos, permitiendo la emisión de certificados con ID único para cada estudiante. Las funciones del contrato incluyen la emisión, verificación, revocación, y consulta de certificados en la blockchain. EduChain también permite a terceros verificar la validez de los certificados mediante solicitudes de verificación.

## Instalación y Configuración

1. **Clonar el Repositorio**

   ```bash
   git clone https://github.com/DanielVDrums/educhancontract
   cd educhain
   ```

2. **Instalar Dependencias**
   Asegúrate de instalar las dependencias necesarias, incluyendo Hyperledger Fabric y Node.js. Dentro del proyecto, instala las dependencias de Node.js:

   ```bash
   npm install
   ```

3. **Configurar Hyperledger Fabric**
   Configura e inicia tu red de Hyperledger Fabric para desplegar y probar este contrato inteligente.

4. **Desplegar EduChain**
   Una vez configurada la red de Hyperledger Fabric, puedes desplegar el contrato en la red siguiendo las instrucciones de Hyperledger para cargar contratos inteligentes.

## Funciones del Contrato

El contrato `EduChain` cuenta con varias funciones clave para gestionar certificados académicos:

### 1. `emitirCertificado`

- **Descripción**: Emite un nuevo certificado para un estudiante con un ID único.
- **Parámetros**: `nombreEstudiante`, `dni`, `programa`, `fechaEmision`, `grado`, `tituloOtorgado`, `institucion`.
- **Retorno**: Objeto JSON con los detalles del certificado emitido.
- **Ejemplo**:
  ```javascript
  await emitirCertificado(
    ctx,
    "Juan Pérez",
    "12345678",
    "Ingeniería",
    "2024-01-01",
    "Licenciatura",
    "Ingeniero",
    "Universidad XYZ"
  );
  ```

### 2. `verificarCertificado`

- **Descripción**: Verifica el estado de un certificado específico usando su ID único.
- **Parámetros**: `certificadoId`.
- **Retorno**: Detalles del certificado si es válido, error si ha sido revocado o no existe.
- **Ejemplo**:
  ```javascript
  await verificarCertificado(ctx, "certificado-id-unico");
  ```

### 3. `obtenerCertificadosPorEstudiante`

- **Descripción**: Obtiene todos los certificados asociados a un estudiante usando su DNI.
- **Parámetros**: `dni`.
- **Retorno**: Lista de certificados del estudiante.
- **Ejemplo**:
  ```javascript
  await obtenerCertificadosPorEstudiante(ctx, "12345678");
  ```

### 4. `revocarCertificado`

- **Descripción**: Revoca un certificado específico utilizando su ID único y proporciona el motivo de revocación.
- **Parámetros**: `certificadoId`, `motivo`.
- **Retorno**: Certificado actualizado con estado "revocado".
- **Ejemplo**:
  ```javascript
  await revocarCertificado(
    ctx,
    "certificado-id-unico",
    "Motivo de la revocación"
  );
  ```

### 5. `crearSolicitudVerificacion`

- **Descripción**: Crea una solicitud de verificación para comprobar si un estudiante tiene un certificado válido.
- **Parámetros**: `dni`, `nombreEmpleador`, `fechaSolicitud`.
- **Retorno**: Detalles de la solicitud de verificación.
- **Ejemplo**:
  ```javascript
  await crearSolicitudVerificacion(
    ctx,
    "12345678",
    "Empresa XYZ",
    "2024-01-01"
  );
  ```

## Ejemplos de Uso

Aquí tienes ejemplos de cómo utilizar cada una de las funciones principales. Asegúrate de que el contexto (`ctx`) esté correctamente configurado al ejecutar las funciones en Hyperledger Fabric.

```javascript
// Ejemplo de emisión de un certificado
await emitirCertificado(
  ctx,
  "Juan Pérez",
  "12345678",
  "Ingeniería",
  "2024-01-01",
  "Licenciatura",
  "Ingeniero",
  "Universidad XYZ"
);

// Ejemplo de verificación de un certificado
const certificado = await verificarCertificado(ctx, "certificado-id-unico");

// Ejemplo de revocación de un certificado
await revocarCertificado(ctx, "certificado-id-unico", "Duplicado");

// Ejemplo de creación de solicitud de verificación
const solicitud = await crearSolicitudVerificacion(
  ctx,
  "12345678",
  "Empresa XYZ",
  "2024-01-01"
);
```
