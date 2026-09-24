import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const username = (process.env.AUTH_USERNAME || 'admin').trim().toLowerCase();
  const password = process.env.AUTH_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error('AUTH_PASSWORD must be set and contain at least 12 characters before seeding.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { username },
    create: {
      username,
      email: process.env.AUTH_EMAIL?.trim().toLowerCase() || null,
      passwordHash,
      role: 'ADMIN',
    },
    update: { passwordHash, email: process.env.AUTH_EMAIL?.trim().toLowerCase() || null, role: 'ADMIN' },
  });

  const incident = await prisma.disasterIncident.upsert({
    where: { id: 'INITIAL_HAZARD' },
    create: { id: 'INITIAL_HAZARD', eventType: 'Regional Seismic Hazard & Hazardous Leak', status: 'ACTIVE', severity: 'CRITICAL' },
    update: {},
  });

  const zones = [
    { id: 'Zone A', name: 'Industrial Corridor & North Residential', riskLevel: 'HIGH', floodStatus: 'LOW', peopleAtRisk: 340, waterLevel: 'Stable', rainfallIntensity: 0, waterSpreadPercentage: 4 },
    { id: 'Zone B', name: 'Downtown Commercial / Transit Hub', riskLevel: 'CRITICAL', floodStatus: 'LOW', peopleAtRisk: 580, waterLevel: 'Stable', rainfallIntensity: 0, waterSpreadPercentage: 2 },
    { id: 'Zone C', name: 'River Valley & Waterfront Basin', riskLevel: 'MODERATE', floodStatus: 'MEDIUM', peopleAtRisk: 140, waterLevel: 'Rising', rainfallIntensity: 38, waterSpreadPercentage: 38 },
    { id: 'Zone D', name: 'West Hills Suburbs & Forest Margin', riskLevel: 'LOW', floodStatus: 'LOW', peopleAtRisk: 80, waterLevel: 'Stable', rainfallIntensity: 0, waterSpreadPercentage: 1 },
  ];
  for (const zone of zones) {
    await prisma.zone.upsert({ where: { id: zone.id }, create: { ...zone, incidentId: incident.id }, update: { ...zone, incidentId: incident.id } });
  }

  const resources = [
    { id: 'AMB-01', type: 'Ambulance', name: 'Paramedic Rapid Response Ambulance 01', totalQuantity: 1, availableQuantity: 1 },
    { id: 'AMB-02', type: 'Ambulance', name: 'Advanced Life Support Ambulance 02', totalQuantity: 1, availableQuantity: 1 },
    { id: 'RV-01', type: 'Rescue Vehicle', name: 'Heavy Structural Extrication Truck 01', totalQuantity: 1, availableQuantity: 1 },
    { id: 'RV-02', type: 'Rescue Vehicle', name: 'Hazmat Decontamination Rig 02', totalQuantity: 1, availableQuantity: 1 },
    { id: 'RV-03', type: 'Rescue Vehicle', name: 'All-Terrain Rough-Access Tender 03', totalQuantity: 1, availableQuantity: 1 },
    { id: 'MED-T1', type: 'Medical Team', name: 'Disaster Surgical Triage Team Alpha', totalQuantity: 1, availableQuantity: 1 },
    { id: 'MED-T2', type: 'Medical Team', name: 'Critical Care Trauma Unit Bravo', totalQuantity: 1, availableQuantity: 1 },
    { id: 'MED-T3', type: 'Medical Team', name: 'Field Resuscitation Team Charlie', totalQuantity: 1, availableQuantity: 1 },
    { id: 'MED-T4', type: 'Medical Team', name: 'Emergency Medical Service Squad Delta', totalQuantity: 1, availableQuantity: 1 },
    { id: 'MED-T5', type: 'Medical Team', name: 'Pediatric & Geriatric Care Unit Echo', totalQuantity: 1, availableQuantity: 1 },
    { id: 'MED-KITS', type: 'Medical Kit', name: 'Trauma & Airway Burn First-Aid Kits', totalQuantity: 20, availableQuantity: 20 },
    { id: 'RB-01', type: 'Rescue Boat', name: 'Swift-Water Inflatable Jet Boat 01', totalQuantity: 1, availableQuantity: 1 },
    { id: 'RB-02', type: 'Rescue Boat', name: 'Rigid-Hull Flood Evacuation Craft 02', totalQuantity: 1, availableQuantity: 1 },
    { id: 'SH-North', type: 'Shelter', name: 'North Community Arena Shelter', totalQuantity: 500, availableQuantity: 500 },
    { id: 'SH-Central', type: 'Shelter', name: 'Central High School Gymnasium', totalQuantity: 650, availableQuantity: 650 },
    { id: 'SH-South', type: 'Shelter', name: 'South Fairgrounds Pavilion', totalQuantity: 400, availableQuantity: 400 },
    { id: 'FOOD-100', type: 'Food Pack', name: 'Ready-to-Eat Emergency Ration Crates', totalQuantity: 100, availableQuantity: 100 },
    { id: 'WATER-200', type: 'Water Pack', name: 'Purified Emergency Drinking Water Units', totalQuantity: 200, availableQuantity: 200 },
  ];
  for (const resource of resources) {
    await prisma.resource.upsert({ where: { id: resource.id }, create: { ...resource, status: 'AVAILABLE' }, update: { ...resource, status: 'AVAILABLE' } });
  }

  const agents = [
    { id: 'medical', name: 'Medical Agent', type: 'AI_AGENT' },
    { id: 'logistics', name: 'Logistics Agent', type: 'AI_AGENT' },
    { id: 'communication', name: 'Communication Agent', type: 'AI_AGENT' },
    { id: 'coordinator', name: 'Coordinator Agent', type: 'AI_AGENT' },
  ];
  for (const agent of agents) {
    await prisma.agent.upsert({ where: { id: agent.id }, create: { ...agent, status: 'IDLE' }, update: agent });
  }

  console.log(`[Database] Seeded admin user: ${username}`);
}

main()
  .catch((error) => {
    console.error('[Database] Seed failed:', error instanceof Error ? error.message : 'unknown error');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
