"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const logger = new common_1.Logger('DataPulse-AI-Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    app.enableCors({
        origin: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    const port = process.env.PORT || 4000;
    await app.listen(port);
    logger.log(`=======================================================`);
    logger.log(` DataPulse AI Analytics Engine online on port ${port}`);
    logger.log(` Query Endpoint:  POST http://localhost:${port}/api/analytics/query`);
    logger.log(` Schema Endpoint: GET  http://localhost:${port}/api/analytics/schema`);
    logger.log(` Health Endpoint: GET  http://localhost:${port}/api/health`);
    logger.log(`=======================================================`);
}
bootstrap();
//# sourceMappingURL=main.js.map