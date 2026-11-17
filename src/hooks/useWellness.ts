import { useState, useCallback, useEffect } from 'react';
import {
  wellnessFinancialService,
  wellnessDevelopmentService,
  wellnessHealthService,
  wellnessWorkplaceService,
  wellnessStatsService,
  DEFAULT_EMPLOYEE_ID,
} from '../services/wellnessService';
import {
  FinancialIncentive,
  EmployeeDevelopment,
  HealthWellness,
  WorkplaceLifeBalance,
  WellnessStatsSummary,
  BonusStatus,
  ClaimStatus,
  FringeClaimStatus,
  MentorshipStatus,
  CareerGoalStatus,
  CertificationStatus,
} from '../types/wellness.types';
import { useToast } from './useToast';

export function useWellness(employeeId = DEFAULT_EMPLOYEE_ID) {
  const { showToast } = useToast();

  // ---- Summary Stats ----
  const [stats, setStats] = useState<WellnessStatsSummary | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // ---- Financial Incentives ----
  const [financialIncentive, setFinancialIncentive] = useState<FinancialIncentive | null>(null);
  const [financialLoading, setFinancialLoading] = useState(false);

  // ---- Employee Development ----
  const [development, setDevelopment] = useState<EmployeeDevelopment | null>(null);
  const [developmentLoading, setDevelopmentLoading] = useState(false);

  // ---- Health & Wellness ----
  const [health, setHealth] = useState<HealthWellness | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // ---- Workplace Life Balance ----
  const [workplace, setWorkplace] = useState<WorkplaceLifeBalance | null>(null);
  const [workplaceLoading, setWorkplaceLoading] = useState(false);

  // ========================= STATS SUMMARY =========================

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await wellnessStatsService.getSummaryStats();
      setStats(data);
    } catch (err: any) {
      console.warn('Failed to load wellness stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ========================= FINANCIAL INCENTIVES =========================

  const fetchFinancialIncentive = useCallback(async () => {
    try {
      setFinancialLoading(true);
      const data = await wellnessFinancialService.getMyIncentives(employeeId);
      setFinancialIncentive(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load financial incentives', 'error');
    } finally {
      setFinancialLoading(false);
    }
  }, [employeeId, showToast]);

  const createEsopGrant = useCallback(async (grantData: { shares: number; grantPrice: number; currentFMV?: number; grantDate?: string }) => {
    try {
      setFinancialLoading(true);
      const data = await wellnessFinancialService.createEsopGrant(employeeId, grantData);
      setFinancialIncentive(data);
      showToast('ESOP grant created & 4-year vesting schedule generated!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to create ESOP grant', 'error');
      return false;
    } finally {
      setFinancialLoading(false);
    }
  }, [employeeId, showToast]);

  const exerciseEsop = useCallback(async (trancheNumber: number) => {
    try {
      setFinancialLoading(true);
      const data = await wellnessFinancialService.exerciseEsop(employeeId, trancheNumber);
      setFinancialIncentive(data);
      showToast('ESOP options exercised successfully! Transaction recorded.', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to exercise ESOP options', 'error');
      return false;
    } finally {
      setFinancialLoading(false);
    }
  }, [employeeId, showToast]);

  const updateBonusStatus = useCallback(async (bonusStatus: BonusStatus) => {
    try {
      setFinancialLoading(true);
      const data = await wellnessFinancialService.updateBonusStatus(employeeId, bonusStatus);
      setFinancialIncentive(data);
      showToast(`Bonus status updated to ${bonusStatus}`, 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to update bonus status', 'error');
      return false;
    } finally {
      setFinancialLoading(false);
    }
  }, [employeeId, showToast]);

  const addBonusPlan = useCallback(async (planData: object) => {
    try {
      setFinancialLoading(true);
      const data = await wellnessFinancialService.addBonusPlan(employeeId, planData);
      setFinancialIncentive(data);
      showToast('Performance bonus plan created successfully!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to add bonus plan', 'error');
      return false;
    } finally {
      setFinancialLoading(false);
    }
  }, [employeeId, showToast]);

  const updateBonusPlanStatus = useCallback(async (planId: string, status: BonusStatus) => {
    try {
      setFinancialLoading(true);
      const data = await wellnessFinancialService.updateBonusPlanStatus(employeeId, planId, status);
      setFinancialIncentive(data);
      showToast(`Bonus plan status updated to ${status}`, 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to update bonus plan status', 'error');
      return false;
    } finally {
      setFinancialLoading(false);
    }
  }, [employeeId, showToast]);

  const addIncentive = useCallback(async (incentiveData: object) => {
    try {
      setFinancialLoading(true);
      const data = await wellnessFinancialService.addIncentive(employeeId, incentiveData);
      setFinancialIncentive(data);
      showToast('Quarterly incentive program added!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to add incentive program', 'error');
      return false;
    } finally {
      setFinancialLoading(false);
    }
  }, [employeeId, showToast]);

  const updateIncentiveStatus = useCallback(async (incentiveId: string, status: string) => {
    try {
      setFinancialLoading(true);
      const data = await wellnessFinancialService.updateIncentiveStatus(employeeId, incentiveId, status);
      setFinancialIncentive(data);
      showToast(`Incentive marked as ${status}`, 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to update incentive', 'error');
      return false;
    } finally {
      setFinancialLoading(false);
    }
  }, [employeeId, showToast]);

  const addLiteracyProgram = useCallback(async (programData: object) => {
    try {
      setFinancialLoading(true);
      const data = await wellnessFinancialService.addLiteracyProgram(employeeId, programData);
      setFinancialIncentive(data);
      showToast('Financial literacy workshop created!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to create workshop', 'error');
      return false;
    } finally {
      setFinancialLoading(false);
    }
  }, [employeeId, showToast]);

  const enrollLiteracyProgram = useCallback(async (programId: string, registered = true) => {
    try {
      setFinancialLoading(true);
      const data = await wellnessFinancialService.enrollLiteracyProgram(employeeId, programId, registered);
      setFinancialIncentive(data);
      showToast(registered ? 'Enrolled in financial literacy session!' : 'Registration cancelled', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to update enrollment', 'error');
      return false;
    } finally {
      setFinancialLoading(false);
    }
  }, [employeeId, showToast]);

  // ========================= EMPLOYEE DEVELOPMENT =========================

  const fetchDevelopment = useCallback(async () => {
    try {
      setDevelopmentLoading(true);
      const data = await wellnessDevelopmentService.getMyDevelopment(employeeId);
      setDevelopment(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load development data', 'error');
    } finally {
      setDevelopmentLoading(false);
    }
  }, [employeeId, showToast]);

  const addLearningProgram = useCallback(async (programData: object) => {
    try {
      setDevelopmentLoading(true);
      const data = await wellnessDevelopmentService.addProgram(employeeId, programData);
      setDevelopment(data);
      showToast('Learning program enrolled successfully!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to add learning program', 'error');
      return false;
    } finally {
      setDevelopmentLoading(false);
    }
  }, [employeeId, showToast]);

  const updateLearningProgram = useCallback(async (programId: string, programData: object) => {
    try {
      setDevelopmentLoading(true);
      const data = await wellnessDevelopmentService.updateProgram(employeeId, programId, programData);
      setDevelopment(data);
      showToast('Learning program updated successfully!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to update learning program', 'error');
      return false;
    } finally {
      setDevelopmentLoading(false);
    }
  }, [employeeId, showToast]);

  const deleteLearningProgram = useCallback(async (programId: string) => {
    try {
      setDevelopmentLoading(true);
      const data = await wellnessDevelopmentService.deleteProgram(employeeId, programId);
      setDevelopment(data);
      showToast('Learning program removed', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to remove program', 'error');
      return false;
    } finally {
      setDevelopmentLoading(false);
    }
  }, [employeeId, showToast]);

  const addCertification = useCallback(async (certData: object) => {
    try {
      setDevelopmentLoading(true);
      const data = await wellnessDevelopmentService.addCertification(employeeId, certData);
      setDevelopment(data);
      showToast('Certification added to your profile!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to add certification', 'error');
      return false;
    } finally {
      setDevelopmentLoading(false);
    }
  }, [employeeId, showToast]);

  const updateCertification = useCallback(async (certId: string, updateData: { status?: CertificationStatus; verifiedBy?: string; expiryDate?: string }) => {
    try {
      setDevelopmentLoading(true);
      const data = await wellnessDevelopmentService.updateCertification(employeeId, certId, updateData);
      setDevelopment(data);
      showToast('Certification record updated!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to update certification', 'error');
      return false;
    } finally {
      setDevelopmentLoading(false);
    }
  }, [employeeId, showToast]);

  const deleteCertification = useCallback(async (certId: string) => {
    try {
      setDevelopmentLoading(true);
      const data = await wellnessDevelopmentService.deleteCertification(employeeId, certId);
      setDevelopment(data);
      showToast('Certification removed', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to remove certification', 'error');
      return false;
    } finally {
      setDevelopmentLoading(false);
    }
  }, [employeeId, showToast]);

  const requestMentorship = useCallback(async (mentorshipData: object) => {
    try {
      setDevelopmentLoading(true);
      const data = await wellnessDevelopmentService.requestMentorship(employeeId, mentorshipData);
      setDevelopment(data);
      showToast('Mentorship program requested successfully!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to request mentorship', 'error');
      return false;
    } finally {
      setDevelopmentLoading(false);
    }
  }, [employeeId, showToast]);

  const addMentorshipSession = useCallback(async (sessionData: object) => {
    try {
      setDevelopmentLoading(true);
      const data = await wellnessDevelopmentService.addMentorshipSession(employeeId, sessionData);
      setDevelopment(data);
      showToast('Mentorship session logged with notes & feedback!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to log mentorship session', 'error');
      return false;
    } finally {
      setDevelopmentLoading(false);
    }
  }, [employeeId, showToast]);

  const updateMentorshipStatus = useCallback(async (status: MentorshipStatus, feedback?: string) => {
    try {
      setDevelopmentLoading(true);
      const data = await wellnessDevelopmentService.updateMentorshipStatus(employeeId, status, feedback);
      setDevelopment(data);
      showToast(`Mentorship program status updated to ${status}`, 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to update mentorship status', 'error');
      return false;
    } finally {
      setDevelopmentLoading(false);
    }
  }, [employeeId, showToast]);

  const addCareerGoal = useCallback(async (goalData: object) => {
    try {
      setDevelopmentLoading(true);
      const data = await wellnessDevelopmentService.addCareerGoal(employeeId, goalData);
      setDevelopment(data);
      showToast('Career goal set with target milestones!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to set career goal', 'error');
      return false;
    } finally {
      setDevelopmentLoading(false);
    }
  }, [employeeId, showToast]);

  const updateCareerGoal = useCallback(async (goalId: string, goalData: object) => {
    try {
      setDevelopmentLoading(true);
      const data = await wellnessDevelopmentService.updateCareerGoal(employeeId, goalId, goalData);
      setDevelopment(data);
      showToast('Career goal updated!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to update career goal', 'error');
      return false;
    } finally {
      setDevelopmentLoading(false);
    }
  }, [employeeId, showToast]);

  const deleteCareerGoal = useCallback(async (goalId: string) => {
    try {
      setDevelopmentLoading(true);
      const data = await wellnessDevelopmentService.deleteCareerGoal(employeeId, goalId);
      setDevelopment(data);
      showToast('Career goal deleted', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to delete career goal', 'error');
      return false;
    } finally {
      setDevelopmentLoading(false);
    }
  }, [employeeId, showToast]);

  // ========================= HEALTH & WELLNESS =========================

  const fetchHealth = useCallback(async () => {
    try {
      setHealthLoading(true);
      const data = await wellnessHealthService.getMyHealth(employeeId);
      setHealth(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load health data', 'error');
    } finally {
      setHealthLoading(false);
    }
  }, [employeeId, showToast]);

  const submitHealthClaim = useCallback(async (claimData: object) => {
    try {
      setHealthLoading(true);
      const data = await wellnessHealthService.submitClaim(employeeId, claimData);
      setHealth(data);
      showToast('Medical claim submitted successfully!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to submit claim', 'error');
      return false;
    } finally {
      setHealthLoading(false);
    }
  }, [employeeId, showToast]);

  const updateHealthClaimStatus = useCallback(async (claimId: string, status: ClaimStatus, rejectionReason?: string) => {
    try {
      const data = await wellnessHealthService.updateClaimStatus(employeeId, claimId, status, rejectionReason);
      setHealth(data);
      showToast(`Claim status updated to ${status}`, 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to update claim', 'error');
      return false;
    }
  }, [employeeId, showToast]);

  const addInsuranceDependent = useCallback(async (dependent: object) => {
    try {
      setHealthLoading(true);
      const data = await wellnessHealthService.addDependent(employeeId, dependent);
      setHealth(data);
      showToast('Dependent added to insurance policy', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to add dependent', 'error');
      return false;
    } finally {
      setHealthLoading(false);
    }
  }, [employeeId, showToast]);

  const updateInsuranceDependent = useCallback(async (dependentId: string, data: object) => {
    try {
      setHealthLoading(true);
      const res = await wellnessHealthService.updateDependent(employeeId, dependentId, data);
      setHealth(res);
      showToast('Dependent information updated', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to update dependent', 'error');
      return false;
    } finally {
      setHealthLoading(false);
    }
  }, [employeeId, showToast]);

  const removeInsuranceDependent = useCallback(async (dependentId: string) => {
    try {
      setHealthLoading(true);
      const res = await wellnessHealthService.removeDependent(employeeId, dependentId);
      setHealth(res);
      showToast('Dependent removed from coverage', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to remove dependent', 'error');
      return false;
    } finally {
      setHealthLoading(false);
    }
  }, [employeeId, showToast]);

  const bookCounselling = useCallback(async (appointmentData: object) => {
    try {
      setHealthLoading(true);
      const data = await wellnessHealthService.bookCounselling(employeeId, appointmentData);
      setHealth(data);
      showToast('Confidential counselling session booked!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to book session', 'error');
      return false;
    } finally {
      setHealthLoading(false);
    }
  }, [employeeId, showToast]);

  const cancelCounselling = useCallback(async (appointmentId: string) => {
    try {
      setHealthLoading(true);
      const data = await wellnessHealthService.cancelCounselling(employeeId, appointmentId);
      setHealth(data);
      showToast('Counselling session cancelled', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel session', 'error');
      return false;
    } finally {
      setHealthLoading(false);
    }
  }, [employeeId, showToast]);

  const logFitnessActivity = useCallback(async (activityData: object) => {
    try {
      setHealthLoading(true);
      const data = await wellnessHealthService.logFitnessActivity(employeeId, activityData);
      setHealth(data);
      showToast('Fitness activity logged & points credited!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to log fitness activity', 'error');
      return false;
    } finally {
      setHealthLoading(false);
    }
  }, [employeeId, showToast]);

  const enrollFitnessChallenge = useCallback(async (challengeName: string, stepsGoal: number) => {
    try {
      setHealthLoading(true);
      const data = await wellnessHealthService.enrollFitnessChallenge(employeeId, challengeName, stepsGoal);
      setHealth(data);
      showToast('Enrolled in wellness fitness challenge!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to enroll in challenge', 'error');
      return false;
    } finally {
      setHealthLoading(false);
    }
  }, [employeeId, showToast]);

  // ========================= WORKPLACE LIFE BALANCE =========================

  const fetchWorkplace = useCallback(async () => {
    try {
      setWorkplaceLoading(true);
      const data = await wellnessWorkplaceService.getMyWorkplace(employeeId);
      setWorkplace(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load workplace data', 'error');
    } finally {
      setWorkplaceLoading(false);
    }
  }, [employeeId, showToast]);

  const requestScheduleChange = useCallback(async (requestData: object) => {
    try {
      setWorkplaceLoading(true);
      const data = await wellnessWorkplaceService.requestScheduleChange(employeeId, requestData);
      setWorkplace(data);
      showToast('Schedule change request submitted for review!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to request schedule change', 'error');
      return false;
    } finally {
      setWorkplaceLoading(false);
    }
  }, [employeeId, showToast]);

  const reviewScheduleChange = useCallback(async (requestId: string, status: 'Approved' | 'Rejected') => {
    try {
      setWorkplaceLoading(true);
      const data = await wellnessWorkplaceService.reviewScheduleChange(employeeId, requestId, status);
      setWorkplace(data);
      showToast(`Schedule request ${status.toLowerCase()}!`, 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to review schedule request', 'error');
      return false;
    } finally {
      setWorkplaceLoading(false);
    }
  }, [employeeId, showToast]);

  const requestPaidLeave = useCallback(async (leaveData: object) => {
    try {
      setWorkplaceLoading(true);
      const data = await wellnessWorkplaceService.requestPaidLeave(employeeId, leaveData);
      setWorkplace(data);
      showToast('Paid leave request submitted!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to request leave', 'error');
      return false;
    } finally {
      setWorkplaceLoading(false);
    }
  }, [employeeId, showToast]);

  const reviewPaidLeave = useCallback(async (leaveId: string, status: 'Approved' | 'Rejected', rejectionReason?: string) => {
    try {
      setWorkplaceLoading(true);
      const data = await wellnessWorkplaceService.reviewPaidLeave(employeeId, leaveId, status, rejectionReason);
      setWorkplace(data);
      showToast(`Leave request ${status.toLowerCase()}!`, 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to review leave request', 'error');
      return false;
    } finally {
      setWorkplaceLoading(false);
    }
  }, [employeeId, showToast]);

  const requestAccommodation = useCallback(async (data: object) => {
    try {
      setWorkplaceLoading(true);
      const res = await wellnessWorkplaceService.requestAccommodation(employeeId, data);
      setWorkplace(res);
      showToast('Dormitory accommodation request submitted!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to submit accommodation request', 'error');
      return false;
    } finally {
      setWorkplaceLoading(false);
    }
  }, [employeeId, showToast]);

  const reviewAccommodation = useCallback(async (requestId: string, status: 'Approved' | 'Rejected' | 'Allocated', allocatedRoomNumber?: string) => {
    try {
      setWorkplaceLoading(true);
      const res = await wellnessWorkplaceService.reviewAccommodation(employeeId, requestId, status, allocatedRoomNumber);
      setWorkplace(res);
      showToast(`Accommodation request marked as ${status}!`, 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to review accommodation request', 'error');
      return false;
    } finally {
      setWorkplaceLoading(false);
    }
  }, [employeeId, showToast]);

  const requestChildCare = useCallback(async (data: object) => {
    try {
      setWorkplaceLoading(true);
      const res = await wellnessWorkplaceService.requestChildCare(employeeId, data);
      setWorkplace(res);
      showToast('Childcare assistance request submitted!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to submit childcare request', 'error');
      return false;
    } finally {
      setWorkplaceLoading(false);
    }
  }, [employeeId, showToast]);

  const reviewChildCare = useCallback(async (requestId: string, status: 'Approved' | 'Rejected' | 'Enrolled') => {
    try {
      setWorkplaceLoading(true);
      const res = await wellnessWorkplaceService.reviewChildCare(employeeId, requestId, status);
      setWorkplace(res);
      showToast(`Childcare request marked as ${status}!`, 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to review childcare request', 'error');
      return false;
    } finally {
      setWorkplaceLoading(false);
    }
  }, [employeeId, showToast]);

  const createFamilyEvent = useCallback(async (data: object) => {
    try {
      setWorkplaceLoading(true);
      const res = await wellnessWorkplaceService.createFamilyEvent(employeeId, data);
      setWorkplace(res);
      showToast('Family wellbeing event created!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to create family event', 'error');
      return false;
    } finally {
      setWorkplaceLoading(false);
    }
  }, [employeeId, showToast]);

  const registerFamilyEvent = useCallback(async (eventName: string) => {
    try {
      const data = await wellnessWorkplaceService.registerFamilyEvent(employeeId, eventName);
      setWorkplace(data);
      showToast('Event registration updated!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to register for event', 'error');
      return false;
    }
  }, [employeeId, showToast]);

  const requestFamilySupport = useCallback(async (data: object) => {
    try {
      setWorkplaceLoading(true);
      const res = await wellnessWorkplaceService.requestFamilySupport(employeeId, data);
      setWorkplace(res);
      showToast('Family support request logged with wellbeing desk!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to submit family support request', 'error');
      return false;
    } finally {
      setWorkplaceLoading(false);
    }
  }, [employeeId, showToast]);

  const submitFringeClaim = useCallback(async (claimData: object) => {
    try {
      setWorkplaceLoading(true);
      const data = await wellnessWorkplaceService.submitFringeClaim(employeeId, claimData);
      setWorkplace(data);
      showToast('Fringe benefit claim submitted!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to submit fringe claim', 'error');
      return false;
    } finally {
      setWorkplaceLoading(false);
    }
  }, [employeeId, showToast]);

  const updateFringeClaimStatus = useCallback(async (claimId: string, status: FringeClaimStatus, rejectionReason?: string) => {
    try {
      const data = await wellnessWorkplaceService.updateFringeClaimStatus(employeeId, claimId, status, rejectionReason);
      setWorkplace(data);
      showToast(`Fringe claim status updated to ${status}`, 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to update claim', 'error');
      return false;
    }
  }, [employeeId, showToast]);

  const applyChildCareStipend = useCallback(async () => {
    try {
      setWorkplaceLoading(true);
      const data = await wellnessWorkplaceService.applyChildCareStipend(employeeId);
      setWorkplace(data);
      showToast('Childcare stipend application active!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to apply for childcare stipend', 'error');
      return false;
    } finally {
      setWorkplaceLoading(false);
    }
  }, [employeeId, showToast]);

  return {
    // Stats Summary
    stats,
    statsLoading,
    fetchStats,

    // Financial Incentives
    financialIncentive,
    financialLoading,
    fetchFinancialIncentive,
    createEsopGrant,
    exerciseEsop,
    updateBonusStatus,
    addBonusPlan,
    updateBonusPlanStatus,
    addIncentive,
    updateIncentiveStatus,
    addLiteracyProgram,
    enrollLiteracyProgram,

    // Employee Development
    development,
    developmentLoading,
    fetchDevelopment,
    addLearningProgram,
    updateLearningProgram,
    deleteLearningProgram,
    addCertification,
    updateCertification,
    deleteCertification,
    requestMentorship,
    addMentorshipSession,
    updateMentorshipStatus,
    addCareerGoal,
    updateCareerGoal,
    deleteCareerGoal,

    // Health & Wellness
    health,
    healthLoading,
    fetchHealth,
    submitHealthClaim,
    updateHealthClaimStatus,
    addInsuranceDependent,
    updateInsuranceDependent,
    removeInsuranceDependent,
    bookCounselling,
    cancelCounselling,
    logFitnessActivity,
    enrollFitnessChallenge,

    // Workplace Life Balance
    workplace,
    workplaceLoading,
    fetchWorkplace,
    requestScheduleChange,
    reviewScheduleChange,
    requestPaidLeave,
    reviewPaidLeave,
    requestAccommodation,
    reviewAccommodation,
    requestChildCare,
    reviewChildCare,
    createFamilyEvent,
    registerFamilyEvent,
    requestFamilySupport,
    submitFringeClaim,
    updateFringeClaimStatus,
    applyChildCareStipend,
  };
}
