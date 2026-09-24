import { Zone } from '../../frontend/src/types/disaster';

export type FloodStatus = 'low' | 'medium' | 'high';
export type SatelliteIntegrationStatus = 'CONNECTED' | 'UNAVAILABLE' | 'SIMULATED_FALLBACK';
export type SatelliteDataSource = 'satellite' | 'simulation';

export interface SatelliteObservation {
  zoneId: string;
  floodStatus: FloodStatus;
  waterSpread: number;
  confidence: number;
  timestamp: string;
  evidence?: string;
}

export interface SatelliteProviderStatus {
  status: SatelliteIntegrationStatus;
  provider: string;
  message: string;
  configured: boolean;
  lastObservationAt?: string;
}

export interface SatelliteObservationResult {
  status: SatelliteIntegrationStatus;
  source: SatelliteDataSource;
  dataLabel: 'REAL SATELLITE DATA' | 'SIMULATED DATA';
  provider: string;
  message: string;
  timestamp: string;
  observations: SatelliteObservation[];
}

export interface SatelliteDataProvider {
  getSatelliteObservations(): Promise<SatelliteObservation[]>;
  getFloodObservations(): Promise<SatelliteObservation[]>;
  getAffectedArea(): Promise<SatelliteObservation[]>;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isFloodStatus(value: unknown): value is FloodStatus {
  return value === 'low' || value === 'medium' || value === 'high';
}

function normalizeObservations(payload: any): SatelliteObservation[] {
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.observations)
    ? payload.observations
    : Array.isArray(payload?.data?.observations)
    ? payload.data.observations
    : [];

  return items.flatMap((item: any) => {
    const zoneId = typeof item?.zoneId === 'string' ? item.zoneId : typeof item?.zone === 'string' ? item.zone : '';
    const waterSpread = Number(item?.waterSpread);
    const confidence = Number(item?.confidence);
    const floodStatus = item?.floodStatus;
    if (!zoneId || !Number.isFinite(waterSpread) || !Number.isFinite(confidence) || !isFloodStatus(floodStatus)) {
      return [];
    }

    return [{
      zoneId,
      floodStatus,
      waterSpread: clamp(waterSpread, 0, 100),
      confidence: clamp(confidence, 0, 1),
      timestamp: typeof item.timestamp === 'string' ? item.timestamp : new Date().toISOString(),
      evidence: typeof item.evidence === 'string' ? item.evidence : undefined,
    }];
  });
}

export class HttpSatelliteDataProvider implements SatelliteDataProvider {
  private readonly apiUrl: string;
  private readonly apiKey: string;

  public constructor(
    apiUrl = process.env.SATELLITE_API_URL?.trim() || '',
    apiKey = process.env.SATELLITE_API_KEY?.trim() || ''
  ) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  public isConfigured(): boolean {
    return Boolean(this.apiUrl && this.apiKey);
  }

  public async getSatelliteObservations(): Promise<SatelliteObservation[]> {
    if (!this.isConfigured()) {
      throw new Error('Satellite provider credentials are not configured.');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(this.apiUrl, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Satellite provider returned HTTP ${response.status}.`);
      }
      return normalizeObservations(await response.json());
    } finally {
      clearTimeout(timeout);
    }
  }

  public getFloodObservations(): Promise<SatelliteObservation[]> {
    return this.getSatelliteObservations();
  }

  public getAffectedArea(): Promise<SatelliteObservation[]> {
    return this.getFloodObservations();
  }
}

export class SatelliteService {
  private readonly provider: HttpSatelliteDataProvider;

  public constructor(provider = new HttpSatelliteDataProvider()) {
    this.provider = provider;
  }

  public async getStatus(): Promise<SatelliteProviderStatus> {
    if (!this.provider.isConfigured()) {
      return {
        status: 'SIMULATED_FALLBACK',
        provider: 'Configured satellite provider',
        message: 'Satellite credentials are not configured. Synthetic disaster simulation remains active.',
        configured: false,
      };
    }

    try {
      const observations = await this.provider.getFloodObservations();
      return {
        status: observations.length > 0 ? 'CONNECTED' : 'UNAVAILABLE',
        provider: 'Configured satellite provider',
        message: observations.length > 0
          ? 'Satellite-derived flood observations are available.'
          : 'Satellite provider responded without usable flood observations.',
        configured: true,
        lastObservationAt: observations[0]?.timestamp,
      };
    } catch (error: any) {
      return {
        status: 'UNAVAILABLE',
        provider: 'Configured satellite provider',
        message: error?.message || 'Satellite provider is unavailable.',
        configured: true,
      };
    }
  }

  public getSimulatedObservations(zones: Zone[]): SatelliteObservation[] {
    const timestamp = new Date().toISOString();
    return zones.map((zone) => {
      const emergency = `${zone.emergencyType} ${zone.notes}`.toLowerCase();
      const isActiveFlood = emergency.includes('dam') || emergency.includes('flash flood') || emergency.includes('inundation');
      const isWaterConcern = zone.id === 'Zone C' || emergency.includes('water') || emergency.includes('drainage');
      const waterSpread = isActiveFlood ? 92 : isWaterConcern ? 38 : 0;
      return {
        zoneId: zone.id,
        floodStatus: waterSpread >= 70 ? 'high' : waterSpread >= 30 ? 'medium' : 'low',
        waterSpread,
        confidence: 0,
        timestamp,
        evidence: 'Synthetic disaster simulation input; not satellite-derived.',
      };
    });
  }

  public getSimulatedResult(zones: Zone[], message = 'Synthetic disaster simulation is active because satellite data is unavailable.'): SatelliteObservationResult {
    const timestamp = new Date().toISOString();
    return {
      status: 'SIMULATED_FALLBACK',
      source: 'simulation',
      dataLabel: 'SIMULATED DATA',
      provider: 'Disaster Simulator',
      message,
      timestamp,
      observations: this.getSimulatedObservations(zones),
    };
  }

  public async getFloodObservations(zones: Zone[]): Promise<SatelliteObservationResult> {
    try {
      const observations = await this.provider.getFloodObservations();
      if (observations.length === 0) {
        throw new Error('Satellite provider returned no usable observations.');
      }
      return {
        status: 'CONNECTED',
        source: 'satellite',
        dataLabel: 'REAL SATELLITE DATA',
        provider: 'Configured satellite provider',
        message: 'Satellite-derived flood observations received from the configured provider.',
        timestamp: new Date().toISOString(),
        observations,
      };
    } catch (error: any) {
      return this.getSimulatedResult(
        zones,
        this.provider.isConfigured()
          ? `Satellite provider unavailable: ${error?.message || 'request failed'}. Synthetic disaster simulation is shown instead.`
          : 'Satellite credentials are not configured. Synthetic disaster simulation is shown instead.'
      );
    }
  }
}