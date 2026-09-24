import { Zone } from '../../frontend/src/types/disaster';
import {
  FloodStatus,
  SatelliteDataSource,
  SatelliteObservation,
  SatelliteObservationResult,
} from './satelliteService';

export interface AffectedZoneData {
  zoneId: string;
  floodStatus: FloodStatus;
  floodRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  floodRiskScore: number;
  waterSpread: number;
  confidence: number;
  source: SatelliteDataSource;
  observationTimestamp: string;
  evidence: string;
}

export interface FloodAssessment {
  monitoring: SatelliteObservationResult & { affectedZones: AffectedZoneData[] };
  affectedZones: AffectedZoneData[];
  zones: Zone[];
}

function getRisk(status: FloodStatus, waterSpread: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (status === 'high' || waterSpread >= 70) return 'HIGH';
  if (status === 'medium' || waterSpread >= 30) return 'MEDIUM';
  return 'LOW';
}

export class FloodAnalysisService {
  public analyze(result: SatelliteObservationResult, zones: Zone[]): FloodAssessment {
    const affectedZones = result.observations.map((observation) => this.toAffectedZone(observation, result.source));
    const affectedByZone = new Map(affectedZones.map((zone) => [zone.zoneId, zone]));
    const enrichedZones = zones.map((zone) => {
      const flood = affectedByZone.get(zone.id);
      if (!flood) return zone;
      return {
        ...zone,
        floodStatus: flood.floodStatus,
        floodRisk: flood.floodRisk,
        floodRiskScore: flood.floodRiskScore,
        floodWaterSpread: flood.waterSpread,
        floodConfidence: flood.confidence,
        floodDataSource: flood.source,
        floodObservationTimestamp: flood.observationTimestamp,
        floodEvidence: flood.evidence,
      };
    });

    return {
      monitoring: { ...result, affectedZones },
      affectedZones,
      zones: enrichedZones,
    };
  }

  private toAffectedZone(observation: SatelliteObservation, source: SatelliteDataSource): AffectedZoneData {
    return {
      zoneId: observation.zoneId,
      floodStatus: observation.floodStatus,
      floodRisk: getRisk(observation.floodStatus, observation.waterSpread),
      floodRiskScore: Math.round(observation.waterSpread),
      waterSpread: observation.waterSpread,
      confidence: observation.confidence,
      source,
      observationTimestamp: observation.timestamp,
      evidence: observation.evidence || `${source === 'satellite' ? 'Satellite-derived flood observation' : 'Synthetic flood indication'} for ${observation.zoneId}.`,
    };
  }
}