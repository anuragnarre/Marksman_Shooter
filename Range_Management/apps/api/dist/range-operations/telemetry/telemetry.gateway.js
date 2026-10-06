"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TelemetryGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetryGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let TelemetryGateway = TelemetryGateway_1 = class TelemetryGateway {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(TelemetryGateway_1.name);
    }
    handleConnection(client) {
        this.logger.log(`Client connected to telemetry: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected from telemetry: ${client.id}`);
    }
    async handleTargetHit(data, client) {
        this.logger.debug(`Received shot from hardware: ${JSON.stringify(data)}`);
        const lane = await this.prisma.rangeLane.findFirst({
            where: { deviceId: data.deviceId },
            include: { activeSession: true }
        });
        if (lane && lane.activeSession) {
            const shot = await this.prisma.shot.create({
                data: {
                    sessionId: lane.activeSession.id,
                    shotNumber: (await this.prisma.shot.count({ where: { sessionId: lane.activeSession.id } })) + 1,
                    score: data.score,
                    x: data.x,
                    y: data.y,
                }
            });
            this.server.to(`range_${lane.rangeId}`).emit('command_center_shot_update', {
                laneId: lane.id,
                laneNumber: lane.laneNumber,
                shot
            });
            return { event: 'hit_registered', data: shot };
        }
    }
    handleSubscribeRange(data, client) {
        client.join(`range_${data.rangeId}`);
        this.logger.log(`Client ${client.id} subscribed to range_${data.rangeId}`);
    }
    async handleCeaseFire(data, client) {
        this.logger.warn(`CEASE FIRE TRIGGERED for Range ${data.rangeId} - Reason: ${data.reason}`);
        if (data.laneId) {
            await this.prisma.rangeLane.update({
                where: { id: data.laneId },
                data: { status: 'MAINTENANCE', notes: `CEASE FIRE: ${data.reason}` }
            });
        }
        else {
        }
        this.server.to(`range_${data.rangeId}`).emit('cease_fire_alert', data);
        this.server.emit('lock_target_frames', { rangeId: data.rangeId });
    }
};
exports.TelemetryGateway = TelemetryGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], TelemetryGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('hardware_target_hit'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], TelemetryGateway.prototype, "handleTargetHit", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe_range_telemetry'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], TelemetryGateway.prototype, "handleSubscribeRange", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('trigger_cease_fire'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], TelemetryGateway.prototype, "handleCeaseFire", null);
exports.TelemetryGateway = TelemetryGateway = TelemetryGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
        namespace: '/telemetry',
    }),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TelemetryGateway);
//# sourceMappingURL=telemetry.gateway.js.map