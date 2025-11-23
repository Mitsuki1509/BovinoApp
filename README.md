
## Clonar el repositorio

```bash
git clone https://github.com/Mitsuki1509/BovinoApp.git
```

## Instalar las dependencias 

```bash
npm install
Npm install socket.io
```
Instala las dependencias al backend y frontend

## Crear la base de datos

Ejecuta el archivo BovinoDB.slq que se encuentra en la raiz del proyecto en
tu gestor PostgreSQL

## Reemplaza el archivo .env
Dentro de la carpeta /backend reemplaza cada una de las variables de entorno por tus credenciales.

## Conectar la base de datos con el backend
```bash 
npx prisma db pull
npx prisma generate
```

## Correr el programa

En la raiz del programa ejecuta el siguiente comando: 
```bash 
npm run dev
```
