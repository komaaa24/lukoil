import { AppDataSource } from '../db/data-source';
import { Complaint, ComplaintReason, ComplaintStatus } from '../db/entities/Complaint';
import { User } from '../db/entities/User';
import { Admin } from '../db/entities/Admin';

export const createComplaint = async (
  user: User,
  tokenRaw: string,
  reason: ComplaintReason,
  text?: string,
): Promise<Complaint> => {
  const repo = AppDataSource.getRepository(Complaint);
  const complaint = repo.create({
    user,
    tokenRaw,
    reason,
    text: text ?? null,
    status: ComplaintStatus.OPEN,
  });
  return repo.save(complaint);
};

export const resolveComplaint = async (
  complaintId: string,
  admin: Admin,
): Promise<Complaint | null> => {
  const repo = AppDataSource.getRepository(Complaint);
  const complaint = await repo.findOne({ where: { id: complaintId } });
  if (!complaint) return null;
  complaint.status = ComplaintStatus.RESOLVED;
  complaint.resolvedAt = new Date();
  complaint.resolvedByAdmin = admin;
  return repo.save(complaint);
};

export const listRecentComplaints = async (limit = 10): Promise<Complaint[]> => {
  const repo = AppDataSource.getRepository(Complaint);
  return repo.find({
    order: { createdAt: 'DESC' },
    take: limit,
    relations: ['user', 'resolvedByAdmin'],
  });
};
