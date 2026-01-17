import { AppDataSource } from '../db/data-source';
import { ServiceCenter } from '../db/entities/ServiceCenter';

const toRad = (value: number) => (value * Math.PI) / 180;

const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const findNearestServiceCenters = async (
  lat: number,
  lon: number,
  limit = 5,
): Promise<Array<ServiceCenter & { distance: number }>> => {
  const repo = AppDataSource.getRepository(ServiceCenter);
  const all = await repo.find({ where: { isActive: true } });
  const enriched = all.map((s) => ({
    ...s,
    distance: haversine(lat, lon, s.lat, s.lon),
  }));
  return enriched.sort((a, b) => a.distance - b.distance).slice(0, limit);
};
