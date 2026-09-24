-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."DisasterIncident" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DisasterIncident_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."Zone" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT,
    "name" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "floodStatus" TEXT,
    "peopleAtRisk" INTEGER NOT NULL DEFAULT 0,
    "waterLevel" TEXT,
    "rainfallIntensity" DOUBLE PRECISION,
    "waterSpreadPercentage" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."Resource" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalQuantity" INTEGER NOT NULL DEFAULT 0,
    "availableQuantity" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."ResourceAllocation" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "zoneId" TEXT,
    "incidentId" TEXT,
    "allocatedQuantity" INTEGER NOT NULL,
    "allocatedBy" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResourceAllocation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."AgentMessage" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "incidentId" TEXT,
    "messageType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."Conflict" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT,
    "resourceId" TEXT,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "resolution" TEXT,
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "Conflict_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."ResponsePlan" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "decision" TEXT NOT NULL,
    "evidence" TEXT,
    "constraint" TEXT,
    "tradeoff" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ResponsePlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."PublicAlert" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT,
    "zoneId" TEXT,
    "alertType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PublicAlert_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."SatelliteObservation" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "waterSpreadPercentage" DOUBLE PRECISION,
    "waterLevel" TEXT,
    "rainfallIntensity" DOUBLE PRECISION,
    "peopleAtRisk" INTEGER NOT NULL DEFAULT 0,
    "dataSource" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SatelliteObservation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."SimulationHistory" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SimulationHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."Report" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT,
    "reportType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reportData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."SimulationSnapshot" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT,
    "state" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SimulationSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");
CREATE INDEX "User_email_idx" ON "public"."User"("email");
CREATE INDEX "Session_userId_idx" ON "public"."Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "public"."Session"("expiresAt");
CREATE INDEX "DisasterIncident_status_idx" ON "public"."DisasterIncident"("status");
CREATE INDEX "DisasterIncident_createdAt_idx" ON "public"."DisasterIncident"("createdAt");
CREATE INDEX "Zone_incidentId_idx" ON "public"."Zone"("incidentId");
CREATE INDEX "Zone_riskLevel_idx" ON "public"."Zone"("riskLevel");
CREATE INDEX "Resource_type_idx" ON "public"."Resource"("type");
CREATE INDEX "Resource_status_idx" ON "public"."Resource"("status");
CREATE INDEX "ResourceAllocation_resourceId_idx" ON "public"."ResourceAllocation"("resourceId");
CREATE INDEX "ResourceAllocation_zoneId_idx" ON "public"."ResourceAllocation"("zoneId");
CREATE INDEX "ResourceAllocation_incidentId_idx" ON "public"."ResourceAllocation"("incidentId");
CREATE INDEX "Agent_type_idx" ON "public"."Agent"("type");
CREATE INDEX "AgentMessage_agentId_idx" ON "public"."AgentMessage"("agentId");
CREATE INDEX "AgentMessage_incidentId_idx" ON "public"."AgentMessage"("incidentId");
CREATE INDEX "AgentMessage_createdAt_idx" ON "public"."AgentMessage"("createdAt");
CREATE INDEX "Conflict_incidentId_idx" ON "public"."Conflict"("incidentId");
CREATE INDEX "Conflict_status_idx" ON "public"."Conflict"("status");
CREATE INDEX "ResponsePlan_incidentId_idx" ON "public"."ResponsePlan"("incidentId");
CREATE INDEX "ResponsePlan_status_idx" ON "public"."ResponsePlan"("status");
CREATE INDEX "PublicAlert_incidentId_idx" ON "public"."PublicAlert"("incidentId");
CREATE INDEX "PublicAlert_zoneId_idx" ON "public"."PublicAlert"("zoneId");
CREATE INDEX "PublicAlert_createdAt_idx" ON "public"."PublicAlert"("createdAt");
CREATE INDEX "SatelliteObservation_zoneId_idx" ON "public"."SatelliteObservation"("zoneId");
CREATE INDEX "SatelliteObservation_observedAt_idx" ON "public"."SatelliteObservation"("observedAt");
CREATE INDEX "SimulationHistory_incidentId_idx" ON "public"."SimulationHistory"("incidentId");
CREATE INDEX "SimulationHistory_createdAt_idx" ON "public"."SimulationHistory"("createdAt");
CREATE INDEX "Report_incidentId_idx" ON "public"."Report"("incidentId");
CREATE INDEX "Report_createdAt_idx" ON "public"."Report"("createdAt");
CREATE INDEX "SimulationSnapshot_incidentId_idx" ON "public"."SimulationSnapshot"("incidentId");

ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Zone" ADD CONSTRAINT "Zone_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "public"."DisasterIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."ResourceAllocation" ADD CONSTRAINT "ResourceAllocation_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "public"."Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."ResourceAllocation" ADD CONSTRAINT "ResourceAllocation_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "public"."Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."ResourceAllocation" ADD CONSTRAINT "ResourceAllocation_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "public"."DisasterIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."ResourceAllocation" ADD CONSTRAINT "ResourceAllocation_allocatedBy_fkey" FOREIGN KEY ("allocatedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."AgentMessage" ADD CONSTRAINT "AgentMessage_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."AgentMessage" ADD CONSTRAINT "AgentMessage_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "public"."DisasterIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."Conflict" ADD CONSTRAINT "Conflict_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "public"."DisasterIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."Conflict" ADD CONSTRAINT "Conflict_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "public"."Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."Conflict" ADD CONSTRAINT "Conflict_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."ResponsePlan" ADD CONSTRAINT "ResponsePlan_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "public"."DisasterIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."PublicAlert" ADD CONSTRAINT "PublicAlert_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "public"."DisasterIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."PublicAlert" ADD CONSTRAINT "PublicAlert_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "public"."Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."SatelliteObservation" ADD CONSTRAINT "SatelliteObservation_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "public"."Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."SimulationHistory" ADD CONSTRAINT "SimulationHistory_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "public"."DisasterIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "public"."DisasterIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."SimulationSnapshot" ADD CONSTRAINT "SimulationSnapshot_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "public"."DisasterIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;
