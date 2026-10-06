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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
let EventsGateway = class EventsGateway {
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
    }
    handleConnection(client) {
        try {
            const token = client.handshake.auth?.token ??
                client.handshake.headers?.authorization?.replace('Bearer ', '');
            if (!token)
                throw new websockets_1.WsException('No token provided');
            const secret = this.configService.get('JWT_SECRET') ?? '';
            const payload = this.jwtService.verify(token, { secret });
            client.data.userId = payload.sub;
            console.log(`WS authenticated: ${client.id} userId=${payload.sub}`);
        }
        catch {
            console.warn(`WS rejected unauthenticated client: ${client.id}`);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        console.log(`WS client disconnected: ${client.id}`);
    }
    handleJoinSession(sessionId, client) {
        if (!sessionId || typeof sessionId !== 'string')
            return;
        void client.join(sessionId);
        client.emit('joinedSession', { sessionId });
    }
    handleLeaveSession(sessionId, client) {
        void client.leave(sessionId);
    }
    handleJoinUserRoom(userId, client) {
        const authenticatedUserId = client.data.userId;
        if (!userId || typeof userId !== 'string')
            return;
        if (authenticatedUserId && authenticatedUserId !== userId) {
            client.emit("error", { message: "Forbidden: cannot join another user's room" });
            return;
        }
        void client.join(`user:${userId}`);
        client.emit('joinedUserRoom', { userId });
    }
    handleLeaveUserRoom(userId, client) {
        void client.leave(`user:${userId}`);
    }
    handleJoinLiveRange(rangeId, client) {
        if (!rangeId || typeof rangeId !== 'string')
            return;
        void client.join(`live_range:${rangeId}`);
        client.emit('joinedLiveRange', { rangeId });
    }
    handleLeaveLiveRange(rangeId, client) {
        void client.leave(`live_range:${rangeId}`);
    }
    emitShotDetected(rangeId, payload) {
        this.server.to(`live_range:${rangeId}`).emit('shot_detected', payload);
    }
    handleJoinRangeMonitor(rangeId, client) {
        if (!rangeId || typeof rangeId !== 'string')
            return;
        void client.join(`range_monitor:${rangeId}`);
        client.emit('joinedRangeMonitor', { rangeId });
    }
    handleLeaveRangeMonitor(rangeId, client) {
        void client.leave(`range_monitor:${rangeId}`);
    }
    emitLaneStatusUpdated(rangeId, laneId, payload) {
        this.server.to(`range_monitor:${rangeId}`).emit('lane_status_updated', { laneId, ...payload });
    }
    emitSessionUpdated(sessionId, newShotCount) {
        const event = { sessionId, newShotCount };
        this.server.to(sessionId).emit('session.updated', event);
    }
    emitFeedbackAdded(sessionId, feedback) {
        const event = { sessionId, feedback };
        this.server.to(sessionId).emit('feedback.added', event);
    }
    emitConnectionInvite(targetUserId, connectionId) {
        const event = { connectionId };
        this.server.to(`user:${targetUserId}`).emit('connection.invite', event);
    }
    emitConnectionAccepted(targetUserId, connectionId) {
        const event = { connectionId };
        this.server.to(`user:${targetUserId}`).emit('connection.accepted', event);
    }
    emitConnectionDeclined(targetUserId, connectionId) {
        const event = { connectionId };
        this.server.to(`user:${targetUserId}`).emit('connection.declined', event);
    }
    emitScheduleRequestCreated(coachId, requestId) {
        this.server.to(`user:${coachId}`).emit('schedule.request.created', { requestId });
    }
    emitScheduleRequestResolved(shooterId, requestId, status) {
        this.server.to(`user:${shooterId}`).emit('schedule.request.resolved', { requestId, status });
    }
    emitBiometricUpdate(userId, sessionId, reading) {
        const event = { userId, sessionId, reading };
        this.server.to(`user:${userId}`).emit('biometric.update', event);
        if (sessionId) {
            this.server.to(sessionId).emit('biometric.update', event);
        }
    }
    emitNewNotification(userId, payload) {
        this.server.to(`user:${userId}`).emit('notification:new', payload);
    }
    emitPbUpdated(userId, pbData) {
        this.server.to(`user:${userId}`).emit('pb:updated', pbData);
    }
    emitAchievementEarned(userId, achievementData) {
        this.server.to(`user:${userId}`).emit('achievement:earned', achievementData);
    }
    handleJoinCompetitionScoreboard(competitionId, client) {
        if (!competitionId || typeof competitionId !== 'string')
            return;
        void client.join(`competition:${competitionId}:scoreboard`);
        client.emit('joinedCompetitionScoreboard', { competitionId });
    }
    handleLeaveCompetitionScoreboard(competitionId, client) {
        void client.leave(`competition:${competitionId}:scoreboard`);
    }
    emitCompetitionScoreboard(competitionId, scoreboardData) {
        this.server.to(`competition:${competitionId}:scoreboard`).emit('scoreboard:update', scoreboardData);
    }
    emitNationalRecordBroken(competitionId, data) {
        this.server.to(`competition:${competitionId}:scoreboard`).emit('nationalRecordBroken', data);
    }
    handlePauseAndCorrect(payload, client) {
        this.server.to(`user:${payload.targetShooterId}`).emit('coach:pauseAndCorrect', {
            message: payload.message,
            timestamp: Date.now(),
        });
    }
};
exports.EventsGateway = EventsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], EventsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinSession'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleJoinSession", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveSession'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleLeaveSession", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinUserRoom'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleJoinUserRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveUserRoom'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleLeaveUserRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinLiveRange'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleJoinLiveRange", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveLiveRange'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleLeaveLiveRange", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinRangeMonitor'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleJoinRangeMonitor", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveRangeMonitor'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleLeaveRangeMonitor", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinCompetitionScoreboard'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleJoinCompetitionScoreboard", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveCompetitionScoreboard'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleLeaveCompetitionScoreboard", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('pauseAndCorrect'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handlePauseAndCorrect", null);
exports.EventsGateway = EventsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()) ?? [
                'http://localhost:3000',
                'http://127.0.0.1:3000',
            ],
            credentials: true,
        },
        namespace: '/',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService])
], EventsGateway);
//# sourceMappingURL=events.gateway.js.map