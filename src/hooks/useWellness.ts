import { useState, useCallback } from 'react';
import {
  wellnessFinancialService,
  wellnessDevelopmentService,
  wellnessHealthService,
  wellnessWorkplaceService,
} from '../services/wellnessService';
import {
  FinancialIncentive,
  EmployeeDevelopment,
  HealthWellness,
  WorkplaceLifeBalance,
  BonusStatus,
  ClaimStatus,
  FringeClaimStatus,
} from '../types/wellness.types';
import { useToast } from './useToast';

const EMPLOYEE_ID = 'EMP-001'; // Demo employee ID

export function useWellness() {
  const { showToast } = useToast();

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

  // ========================= FINANCIAL INCENTIVES =========================

  const fetchFinancialIncentive = useCallback(async () => {
    try {
      setFinancialLoading(true);
      const data = await wellnessFinancialService.getMyIncentives(EMPLOYEE_ID);
      setFinancialIncentive(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load financial incentives', 'error');
    } finally {
      setFinancialLoading(false);
    }
  }, [showToast]);

  const exerciseEsop = useCallback(async (trancheNumber: number) => {
    try {
      setFinancialLoading(true);
      const data = await wellnessFinancialService.exerciseEsop(EMPLOYEE_ID, trancheNumber);
      setFinancialIncentive(data);
      showToast('ESOP options exercised successfully! Finance team notified.', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to exercise ESOP options', 'error');
      return false;
    } finally {
      setFinancialLoading(false);
    }
  }, [showToast]);

  const updateBonusStatus = useCallback(async (bonusStatus: BonusStatus) => {
    try {
      setFinancialLoading(true);
      const data = await wellnessFinancialService.updateBonusStatus(EMPLOYEE_ID, bonusStatus);
      setFinancialIncentive(data);
      showToast('Bonus status updated', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to update bonus status', 'error');
      return false;
    } finally {
      setFinancialLoading(false);
    }
  }, [showToast]);

  // ========================= EMPLOYEE DEVELOPMENT =========================

  const fetchDevelopment = useCallback(async () => {
    try {
      setDevelopmentLoading(true);
      const data = await wellnessDevelopmentService.getMyDevelopment(EMPLOYEE_ID);
      setDevelopment(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load development data', 'error');
    } finally {
      setDevelopmentLoading(false);
    }
  }, [showToast]);

  const addLearningProgram = useCallback(async (programData: object) => {
    try {
      setDevelopmentLoading(true);
      const data = await wellnessDevelopmentService.addProgram(EMPLOYEE_ID, programData);
      setDevelopment(data);
      showToast('Learning program enrolled successfully!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to add learning program', 'error');
      return false;
    } finally {
      setDevelopmentLoading(false);
    }
  }, [showToast]);

  const deleteLearningProgram = useCallback(async (programId: string) => {
    try {
      setDevelopmentLoading(true);
      const data = await wellnessDevelopmentService.deleteProgram(EMPLOYEE_ID, programId);
      setDevelopment(data);
      showToast('Learning program removed', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to remove program', 'error');
      return false;
    } finally {
      setDevelopmentLoading(false);
    }
  }, [showToast]);

  const addCertification = useCallback(async (certData: object) => {
    try {
      setDevelopmentLoading(true);
      const data = await wellnessDevelopmentService.addCertification(EMPLOYEE_ID, certData);
      setDevelopment(data);
      showToast('Certification added to your profile!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to add certification', 'error');
      return false;
    } finally {
      setDevelopmentLoading(false);
    }
  }, [showToast]);

  const deleteCertification = useCallback(async (certId: string) => {
    try {
      setDevelopmentLoading(true);
      const data = await wellnessDevelopmentService.deleteCertification(EMPLOYEE_ID, certId);
      setDevelopment(data);
      showToast('Certification removed', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to remove certification', 'error');
      return false;
    } finally {
      setDevelopmentLoading(false);
    }
  }, [showToast]);

  const updateDevelopment = useCallback(async (data: Partial<EmployeeDevelopment>) => {
    try {
      setDevelopmentLoading(true);
      const updated = await wellnessDevelopmentService.update(EMPLOYEE_ID, data);
      setDevelopment(updated);
      showToast('Development profile updated', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to update development profile', 'error');
      return false;
    } finally {
      setDevelopmentLoading(false);
    }
  }, [showToast]);

  // ========================= HEALTH & WELLNESS =========================

  const fetchHealth = useCallback(async () => {
    try {
      setHealthLoading(true);
      const data = await wellnessHealthService.getMyHealth(EMPLOYEE_ID);
      setHealth(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load health data', 'error');
    } finally {
      setHealthLoading(false);
    }
  }, [showToast]);

  const submitHealthClaim = useCallback(async (claimData: object) => {
    try {
      setHealthLoading(true);
      const data = await wellnessHealthService.submitClaim(EMPLOYEE_ID, claimData);
      setHealth(data);
      showToast('Medical claim submitted successfully!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to submit claim', 'error');
      return false;
    } finally {
      setHealthLoading(false);
    }
  }, [showToast]);

  const updateHealthClaimStatus = useCallback(async (claimId: string, status: ClaimStatus, notes?: string) => {
    try {
      const data = await wellnessHealthService.updateClaimStatus(EMPLOYEE_ID, claimId, status, notes);
      setHealth(data);
      showToast(`Claim status updated to ${status}`, 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to update claim', 'error');
      return false;
    }
  }, [showToast]);

  const addInsuranceDependent = useCallback(async (dependent: object) => {
    try {
      setHealthLoading(true);
      const data = await wellnessHealthService.addDependent(EMPLOYEE_ID, dependent);
      setHealth(data);
      showToast('Dependent added to insurance policy', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to add dependent', 'error');
      return false;
    } finally {
      setHealthLoading(false);
    }
  }, [showToast]);

  // ========================= WORKPLACE LIFE BALANCE =========================

  const fetchWorkplace = useCallback(async () => {
    try {
      setWorkplaceLoading(true);
      const data = await wellnessWorkplaceService.getMyWorkplace(EMPLOYEE_ID);
      setWorkplace(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load workplace data', 'error');
    } finally {
      setWorkplaceLoading(false);
    }
  }, [showToast]);

  const submitFringeClaim = useCallback(async (claimData: object) => {
    try {
      setWorkplaceLoading(true);
      const data = await wellnessWorkplaceService.submitFringeClaim(EMPLOYEE_ID, claimData);
      setWorkplace(data);
      showToast('Fringe benefit claim submitted!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to submit fringe claim', 'error');
      return false;
    } finally {
      setWorkplaceLoading(false);
    }
  }, [showToast]);

  const updateFringeClaimStatus = useCallback(async (claimId: string, status: FringeClaimStatus) => {
    try {
      const data = await wellnessWorkplaceService.updateFringeClaimStatus(EMPLOYEE_ID, claimId, status);
      setWorkplace(data);
      showToast(`Fringe claim status updated to ${status}`, 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to update claim', 'error');
      return false;
    }
  }, [showToast]);

  const registerFamilyEvent = useCallback(async (eventName: string) => {
    try {
      const data = await wellnessWorkplaceService.registerFamilyEvent(EMPLOYEE_ID, eventName);
      setWorkplace(data);
      showToast('Family event passes sent to your email!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to register for event', 'error');
      return false;
    }
  }, [showToast]);

  const applyChildCareStipend = useCallback(async () => {
    try {
      setWorkplaceLoading(true);
      const data = await wellnessWorkplaceService.applyChildCareStipend(EMPLOYEE_ID);
      setWorkplace(data);
      showToast('Childcare stipend application submitted!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to apply for childcare stipend', 'error');
      return false;
    } finally {
      setWorkplaceLoading(false);
    }
  }, [showToast]);

  const updateWorkplace = useCallback(async (data: Partial<WorkplaceLifeBalance>) => {
    try {
      setWorkplaceLoading(true);
      const updated = await wellnessWorkplaceService.update(EMPLOYEE_ID, data);
      setWorkplace(updated);
      showToast('Workplace preferences updated', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to update workplace settings', 'error');
      return false;
    } finally {
      setWorkplaceLoading(false);
    }
  }, [showToast]);

  return {
    // Financial Incentives
    financialIncentive,
    financialLoading,
    fetchFinancialIncentive,
    exerciseEsop,
    updateBonusStatus,

    // Employee Development
    development,
    developmentLoading,
    fetchDevelopment,
    addLearningProgram,
    deleteLearningProgram,
    addCertification,
    deleteCertification,
    updateDevelopment,

    // Health & Wellness
    health,
    healthLoading,
    fetchHealth,
    submitHealthClaim,
    updateHealthClaimStatus,
    addInsuranceDependent,

    // Workplace Life Balance
    workplace,
    workplaceLoading,
    fetchWorkplace,
    submitFringeClaim,
    updateFringeClaimStatus,
    registerFamilyEvent,
    applyChildCareStipend,
    updateWorkplace,
  };
}
