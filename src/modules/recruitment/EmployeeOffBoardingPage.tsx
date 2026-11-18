import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  UserMinus,
  Sparkles,
  FileText,
  Laptop,
  User,
  Award,
  Globe,
  ShieldCheck,
  BarChart3,
  Send,
  CheckCircle2,
  Clock,
  Download,
  Lock,
  FileCheck,
  Car,
  Plane,
  DollarSign,
  Briefcase,
  History,
  AlertCircle,
  CheckSquare,
  RotateCcw,
  TrendingUp,
  Activity,
  Layers,
  Heart,
  Plus,
  RefreshCw,
  Search,
  Check,
  X,
  CreditCard,
  Building,
  UserCheck,
  Phone,
  Mail,
  Edit3,
  Trash2
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import Modal from '../../components/common/Modal';
import {
  offboardingService,
  SimpleEmployeePickerItem
} from '../../services/offboardingService';
import {
  IOffboardingRecord,
  OffboardingReportsSummary,
  OffboardingStatus,
  SeparationType,
  IOffboardingCareerHistory,
  IOffboardingAppraisal,
  IOffboardingReference,
  IOffboardingCustomField
} from '../../types/offboarding';

export const EmployeeOffBoardingPage: React.FC = () => {
  const toast = useToast();
  const location = useLocation();
  const path = location.pathname;

  // Data state
  const [records, setRecords] = useState<(IOffboardingRecord & { id: string })[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
  const [reportsSummary, setReportsSummary] = useState<OffboardingReportsSummary | null>(null);
  const [availableEmployees, setAvailableEmployees] = useState<SimpleEmployeePickerItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // New Record Modal State
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [selectedPickerEmpId, setSelectedPickerEmpId] = useState<string>('');
  const [newEmpName, setNewEmpName] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('');
  const [newDepartment, setNewDepartment] = useState<string>('Engineering');
  const [newEmployeeId, setNewEmployeeId] = useState<string>('');
  const [newSeparationType, setNewSeparationType] = useState<SeparationType>('Resignation');
  const [newResignationDate, setNewResignationDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newLastWorkingDate, setNewLastWorkingDate] = useState<string>(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  const [newNoticeDuration, setNewNoticeDuration] = useState<string>('30 Days');
  const [newHrPersonnel, setNewHrPersonnel] = useState<string>('Marcus Vance (HRBP Lead)');
  const [newReason, setNewReason] = useState<string>('');

  // Active page-level green pill tab states
  const [docTab, setDocTab] = useState<'resignation-ai' | 'termination-ai'>('resignation-ai');
  const [perfTab, setPerfTab] = useState<'history' | 'appraisal' | 'reference'>('history');
  const [settlementTab, setSettlementTab] = useState<'compensation' | 'gratuity' | 'notice-salary' | 'pending-salary' | 'other-benefits'>('compensation');
  const [legalTab, setLegalTab] = useState<'cheque' | 'visa-cancel' | 'insurance' | 'pcc'>('cheque');
  const [assetTab, setAssetTab] = useState<'possessed' | 'return' | 'dependencies' | 'missing' | 'cost-calc' | 'asset-settlement'>('possessed');
  const [travelTab, setTravelTab] = useState<'tickets' | 'misc-custom'>('tickets');
  const [reportTab, setReportTab] = useState<'reports-ai' | 'analytics-ai'>('reports-ai');

  // Document Studio form states
  const [isDraftingDoc, setIsDraftingDoc] = useState(false);
  const [docNoticeDuration, setDocNoticeDuration] = useState('30 Days (Standard)');
  const [docReasonText, setDocReasonText] = useState('Pursuing higher studies & career transition');
  const [resignationDateInput, setResignationDateInput] = useState('');
  const [lastWorkingDateInput, setLastWorkingDateInput] = useState('');
  const [resignationLetterBody, setResignationLetterBody] = useState('');
  const [termType, setTermType] = useState('Mutual Separation Agreement');
  const [termReasonText, setTermReasonText] = useState('Organizational restructuring agreement');
  const [termEffectiveDate, setTermEffectiveDate] = useState('');
  const [severanceText, setSeveranceText] = useState('Includes 2 months severance pay, COBRA health continuation, and standard release.');
  const [terminationLetterBody, setTerminationLetterBody] = useState('');

  // Sub-modal states for adding items
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [newMilestonePosition, setNewMilestonePosition] = useState('');
  const [newMilestoneDept, setNewMilestoneDept] = useState('Engineering');
  const [newMilestonePeriod, setNewMilestonePeriod] = useState('2024 - 2025');
  const [newMilestoneType, setNewMilestoneType] = useState<'Joining' | 'Promotion' | 'Transfer' | 'Milestone'>('Promotion');
  const [newMilestoneDetail, setNewMilestoneDetail] = useState('');

  const [showAddAppraisalModal, setShowAddAppraisalModal] = useState(false);
  const [newAppraisalCycle, setNewAppraisalCycle] = useState('FY2025 Annual Review');
  const [newAppraisalRating, setNewAppraisalRating] = useState('4.8');
  const [newAppraisalFeedback, setNewAppraisalFeedback] = useState('');
  const [newAppraisalAchievements, setNewAppraisalAchievements] = useState('');

  const [showAddReferenceModal, setShowAddReferenceModal] = useState(false);
  const [newRefName, setNewRefName] = useState('');
  const [newRefDesignation, setNewRefDesignation] = useState('');
  const [newRefCompany, setNewRefCompany] = useState('');
  const [newRefContact, setNewRefContact] = useState('');
  const [newRefRelationship, setNewRefRelationship] = useState('');

  const [showAddCustomFieldModal, setShowAddCustomFieldModal] = useState(false);
  const [newCustomKey, setNewCustomKey] = useState('');
  const [newCustomLabel, setNewCustomLabel] = useState('');
  const [newCustomType, setNewCustomType] = useState<'text' | 'date' | 'number' | 'dropdown' | 'checkbox'>('text');
  const [newCustomValue, setNewCustomValue] = useState<string>('');

  const [showAddMissingAssetModal, setShowAddMissingAssetModal] = useState(false);
  const [newMissingName, setNewMissingName] = useState('');
  const [newMissingTag, setNewMissingTag] = useState('');
  const [newMissingCost, setNewMissingCost] = useState('250');
  const [newMissingInvestigator, setNewMissingInvestigator] = useState('IT Security Lead');
  const [newMissingExplanation, setNewMissingExplanation] = useState('');

  const fetchOffboardingData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [recData, repData, empList] = await Promise.all([
        offboardingService.getRecords(),
        offboardingService.getReportsSummary().catch(() => null),
        offboardingService.getEmployees().catch(() => []),
      ]);
      setRecords(recData.items);
      setAvailableEmployees(empList);
      if (recData.items.length > 0 && !selectedRecordId) {
        setSelectedRecordId(recData.items[0].id);
      }
      if (repData) {
        setReportsSummary(repData);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load offboarding records';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRecordId, toast]);

  useEffect(() => {
    fetchOffboardingData();
  }, []);

  const selectedRecord = records.find((r) => r.id === selectedRecordId || r._id === selectedRecordId) || records[0];

  // Sync active record with document studio inputs
  useEffect(() => {
    if (selectedRecord) {
      setDocNoticeDuration(selectedRecord.documents?.resignationLetter?.noticeDuration || '30 Days (Standard)');
      setDocReasonText(selectedRecord.documents?.resignationLetter?.reason || 'Pursuing higher studies & career transition');
      setResignationDateInput(selectedRecord.documents?.resignationLetter?.resignationDate || selectedRecord.resignationDate || new Date().toISOString().split('T')[0]);
      setLastWorkingDateInput(selectedRecord.documents?.resignationLetter?.lastWorkingDate || selectedRecord.lastWorkingDate || selectedRecord.exitDate || '');
      setResignationLetterBody(selectedRecord.documents?.resignationLetter?.letterContent ||
        `Dear Management,\n\nPlease accept this letter as formal notification of my resignation from the position of ${selectedRecord.role} at Huremaso Global, effective ${selectedRecord.exitDate}.\n\nNotice Period: ${selectedRecord.documents?.resignationLetter?.noticeDuration || '30 Days'}\nReason: ${selectedRecord.documents?.resignationLetter?.reason || 'Career transition'}\n\nThank you for the guidance and opportunities during my tenure.\n\nSincerely,\n${selectedRecord.employeeName}`);

      setTermType(selectedRecord.documents?.terminationLetter?.terminationType || selectedRecord.separationType || 'Mutual Separation Agreement');
      setTermReasonText(selectedRecord.documents?.terminationLetter?.terminationReason || 'Organizational restructuring agreement');
      setTermEffectiveDate(selectedRecord.documents?.terminationLetter?.effectiveDate || selectedRecord.exitDate || '');
      setSeveranceText(selectedRecord.documents?.terminationLetter?.severanceDetails || 'Includes 2 months severance pay, COBRA health continuation, and standard release.');
      setTerminationLetterBody(selectedRecord.documents?.terminationLetter?.letterContent ||
        `Dear ${selectedRecord.employeeName},\n\nThis letter confirms your separation from Huremaso Global from the position of ${selectedRecord.role}, effective ${selectedRecord.exitDate}.\n\nSeparation Type: ${selectedRecord.separationType}\nSeverance Details: 2 Months Severance Pay & COBRA Health Continuation.\n\nSincerely,\nHuremaso HR Operations`);
    }
  }, [selectedRecordId, selectedRecord]);

  // Handle employee picker selection in modal
  const handleSelectEmployeePicker = (empId: string) => {
    setSelectedPickerEmpId(empId);
    const emp = availableEmployees.find((e) => e.id === empId || e.employeeId === empId);
    if (emp) {
      setNewEmpName(emp.name);
      setNewRole(emp.role);
      setNewDepartment(emp.department);
      setNewEmployeeId(emp.employeeId || emp.id);
    }
  };

  // Status updates
  const handleUpdateRecordStatus = async (newStatus: OffboardingStatus) => {
    if (!selectedRecord) return;
    try {
      const updated = await offboardingService.updateRecord(selectedRecord.id, { status: newStatus });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(`Offboarding case status updated to '${newStatus}'`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update case status';
      toast.error(msg);
    }
  };

  // Document Handlers
  const handleDraftResignation = async (autoSubmit: boolean = false) => {
    if (!selectedRecord) return;
    setIsDraftingDoc(true);
    try {
      const generatedContent = resignationLetterBody ||
        `Dear Management,\n\nPlease accept this letter as formal notification of my resignation from the position of ${selectedRecord.role} at Huremaso Global, effective ${lastWorkingDateInput || selectedRecord.exitDate}.\n\nNotice Period: ${docNoticeDuration}\nReason: ${docReasonText}\n\nThank you for the guidance and professional opportunities provided during my tenure.\n\nSincerely,\n${selectedRecord.employeeName}`;

      const updated = await offboardingService.updateDocument(selectedRecord.id, {
        type: 'resignation',
        status: autoSubmit ? 'Approved' : 'Submitted',
        noticeDuration: docNoticeDuration,
        reason: docReasonText,
        resignationDate: resignationDateInput,
        lastWorkingDate: lastWorkingDateInput,
        letterContent: generatedContent,
      });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setResignationLetterBody(generatedContent);
      toast.success(autoSubmit ? `Resignation letter approved for ${selectedRecord.employeeName}!` : `Resignation letter drafted & saved!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to draft resignation letter';
      toast.error(msg);
    } finally {
      setIsDraftingDoc(false);
    }
  };

  const handleDraftTermination = async (autoIssue: boolean = false) => {
    if (!selectedRecord) return;
    setIsDraftingDoc(true);
    try {
      const generatedContent = terminationLetterBody ||
        `Dear ${selectedRecord.employeeName},\n\nThis letter confirms your formal separation from Huremaso Global from the position of ${selectedRecord.role}, effective ${termEffectiveDate || selectedRecord.exitDate}.\n\nSeparation Type: ${termType}\nReason: ${termReasonText}\nSeverance Details: ${severanceText}\n\nSincerely,\nHuremaso HR Operations`;

      const updated = await offboardingService.updateDocument(selectedRecord.id, {
        type: 'termination',
        status: autoIssue ? 'Issued' : 'Drafted',
        terminationType: termType,
        terminationReason: termReasonText,
        effectiveDate: termEffectiveDate,
        severanceDetails: severanceText,
        letterContent: generatedContent,
      });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setTerminationLetterBody(generatedContent);
      toast.success(autoIssue ? `Termination letter issued for ${selectedRecord.employeeName}!` : `Termination letter drafted & saved!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to draft termination letter';
      toast.error(msg);
    } finally {
      setIsDraftingDoc(false);
    }
  };

  // Performance Retrospective Handlers
  const handleAddCareerMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !newMilestonePosition.trim()) return;
    const historyItem: IOffboardingCareerHistory = {
      period: newMilestonePeriod,
      position: newMilestonePosition.trim(),
      department: newMilestoneDept,
      type: newMilestoneType,
      details: newMilestoneDetail.trim() || 'Career milestone logged',
    };
    const currentHistory = selectedRecord.performance?.history || [];
    try {
      const updated = await offboardingService.updatePerformance(selectedRecord.id, {
        history: [...currentHistory, historyItem],
      });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success('Career milestone added to timeline!');
      setShowAddMilestoneModal(false);
      setNewMilestonePosition('');
      setNewMilestoneDetail('');
    } catch {
      toast.error('Failed to add career milestone');
    }
  };

  const handleAddAppraisal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !newAppraisalFeedback.trim()) return;
    const appraisalItem: IOffboardingAppraisal = {
      cycle: newAppraisalCycle,
      rating: parseFloat(newAppraisalRating) || 4.5,
      managerFeedback: newAppraisalFeedback.trim(),
      achievements: newAppraisalAchievements.trim() || 'Key goals met',
      date: new Date().toISOString().split('T')[0],
    };
    const currentAppraisals = selectedRecord.performance?.appraisals || [];
    try {
      const updated = await offboardingService.updatePerformance(selectedRecord.id, {
        appraisals: [...currentAppraisals, appraisalItem],
      });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success('Retrospective appraisal feedback recorded!');
      setShowAddAppraisalModal(false);
      setNewAppraisalFeedback('');
      setNewAppraisalAchievements('');
    } catch {
      toast.error('Failed to record appraisal feedback');
    }
  };

  const handleAddReference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !newRefName.trim()) return;
    const refItem: IOffboardingReference = {
      name: newRefName.trim(),
      designation: newRefDesignation.trim() || 'Lead',
      company: newRefCompany.trim() || 'Huremaso',
      contactInfo: newRefContact.trim(),
      relationship: newRefRelationship.trim() || 'Direct Supervisor',
      status: 'Verified',
      notes: 'Verified via HR check',
    };
    const currentRefs = selectedRecord.performance?.references || [];
    try {
      const updated = await offboardingService.updatePerformance(selectedRecord.id, {
        references: [...currentRefs, refItem],
      });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success('Professional reference contact recorded!');
      setShowAddReferenceModal(false);
      setNewRefName('');
      setNewRefContact('');
    } catch {
      toast.error('Failed to add reference contact');
    }
  };

  // Settlement Handlers
  const handleUpdateSettlementStatus = async (newStatus: 'Pending Audit' | 'Approved' | 'Disbursed') => {
    if (!selectedRecord) return;
    setIsSaving(true);
    try {
      const updated = await offboardingService.updateSettlement(selectedRecord.id, {
        status: newStatus,
        disbursedDate: newStatus === 'Disbursed' ? new Date().toISOString().split('T')[0] : selectedRecord.settlement?.disbursedDate,
        paymentReference: newStatus === 'Disbursed' ? `TXN-REF-${Math.floor(100000 + Math.random() * 900000)}` : undefined,
        auditAction: `Settlement marked as ${newStatus} by HR Finance`,
      });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(`Settlement status updated to ${newStatus}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update settlement';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Legal Field Handlers
  const handleUpdateLegalField = async (payload: Partial<IOffboardingRecord['legal']>) => {
    if (!selectedRecord) return;
    setIsSaving(true);
    try {
      const updated = await offboardingService.updateLegal(selectedRecord.id, payload);
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success('Legal clearance status updated successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update legal status';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Asset Handlers
  const handleToggleAssetItem = async (itemTag: string, newStatus: 'Possessed' | 'Pending Return' | 'Returned' | 'Missing' | 'Damaged') => {
    if (!selectedRecord) return;
    const currentItems = selectedRecord.assets?.items || [];
    const updatedItems = currentItems.map((item) =>
      item.tag === itemTag
        ? {
            ...item,
            status: newStatus,
            returnDate: newStatus === 'Returned' ? new Date().toISOString().split('T')[0] : undefined,
            returnCondition: newStatus === 'Returned' ? 'Good Condition' : undefined,
            verifiedBy: 'IT Asset Admin'
          }
        : item
    );
    setIsSaving(true);
    try {
      const updated = await offboardingService.updateAssets(selectedRecord.id, {
        items: updatedItems,
      });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(`Asset ${itemTag} marked as ${newStatus}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update asset';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDependency = async (taskName: string, newStatus: 'Pending' | 'In Progress' | 'Completed' | 'Signed Off') => {
    if (!selectedRecord) return;
    const currentDeps = selectedRecord.assets?.dependencies || [];
    const updatedDeps = currentDeps.map((dep) =>
      dep.task === taskName ? { ...dep, status: newStatus } : dep
    );
    setIsSaving(true);
    try {
      const updated = await offboardingService.updateAssets(selectedRecord.id, {
        dependencies: updatedDeps,
      });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(`Access item "${taskName}" updated to ${newStatus}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update dependency';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMissingAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !newMissingName.trim()) return;
    const cost = parseFloat(newMissingCost) || 0;
    const missingItem = {
      name: newMissingName.trim(),
      tag: newMissingTag.trim() || `MISS-${Math.floor(100 + Math.random() * 900)}`,
      reportedDate: new Date().toISOString().split('T')[0],
      investigator: newMissingInvestigator.trim() || 'IT Security Lead',
      explanation: newMissingExplanation.trim() || 'Missing during final handover inspection',
      deductionApproved: true,
      deductionAmount: cost,
    };
    const currentMissing = selectedRecord.assets?.missingItems || [];
    try {
      const updated = await offboardingService.updateAssets(selectedRecord.id, {
        missingItems: [...currentMissing, missingItem],
        totalDeductions: (selectedRecord.assets?.totalDeductions || 0) + cost,
      });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(`Missing asset logged & $${cost} deduction applied to F&F!`);
      setShowAddMissingAssetModal(false);
      setNewMissingName('');
      setNewMissingExplanation('');
    } catch {
      toast.error('Failed to log missing asset');
    }
  };

  const handleSignOffITClearance = async () => {
    if (!selectedRecord) return;
    setIsSaving(true);
    try {
      const updated = await offboardingService.updateAssets(selectedRecord.id, {
        isFullyCleared: true,
        clearedBy: 'Marcus Vance (Head of IT Infrastructure)',
        inspectionPassed: true,
      });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success('IT & Asset Clearance signed off successfully!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sign off IT clearance';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Travel Handlers
  const handleUpdateTravel = async (payload: Partial<IOffboardingRecord['travel']>) => {
    if (!selectedRecord) return;
    setIsSaving(true);
    try {
      const updated = await offboardingService.updateTravel(selectedRecord.id, payload);
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success('Travel & Repatriation details updated successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update travel info';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Custom Field Handlers
  const handleAddCustomField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !newCustomLabel.trim()) return;
    const key = newCustomKey.trim() || newCustomLabel.trim().toLowerCase().replace(/\s+/g, '_');
    const newField: IOffboardingCustomField = {
      key,
      label: newCustomLabel.trim(),
      type: newCustomType,
      value: newCustomType === 'checkbox' ? true : newCustomValue,
    };
    const currentFields = selectedRecord.customFields || [];
    try {
      const updated = await offboardingService.updateCustomFields(selectedRecord.id, [...currentFields, newField]);
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(`Custom field "${newField.label}" saved!`);
      setShowAddCustomFieldModal(false);
      setNewCustomKey('');
      setNewCustomLabel('');
      setNewCustomValue('');
    } catch {
      toast.error('Failed to add custom field');
    }
  };

  // Create New Record Handler
  const handleCreateNewRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim() || !newRole.trim()) {
      toast.error('Please enter employee name and role');
      return;
    }
    setIsSaving(true);
    try {
      const created = await offboardingService.createRecord({
        employeeName: newEmpName.trim(),
        employeeId: newEmployeeId.trim() || undefined,
        role: newRole.trim(),
        department: newDepartment,
        separationType: newSeparationType,
        resignationDate: newResignationDate,
        lastWorkingDate: newLastWorkingDate,
        exitDate: newLastWorkingDate,
        noticeDuration: newNoticeDuration,
        hrPersonnel: newHrPersonnel.trim(),
        reason: newReason.trim() || 'Voluntary resignation',
        status: 'Initiated',
      });
      setRecords((prev) => [created, ...prev]);
      setSelectedRecordId(created.id);
      setShowNewModal(false);
      setNewEmpName('');
      setNewRole('');
      setNewEmployeeId('');
      setNewReason('');
      toast.success(`Offboarding case initiated for ${created.employeeName}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to initiate offboarding';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const isDocument = path.includes('/offboarding/document');
  const isPerformance = path.includes('/offboarding/performance');
  const isSettlement = path.includes('/offboarding/settlement');
  const isLegal = path.includes('/offboarding/legal');
  const isAssets = path.includes('/offboarding/assets');
  const isTravel = path.includes('/offboarding/travel');
  const isReport = path.includes('/offboarding/report');

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-xs font-bold uppercase tracking-wider mb-2">
            <UserMinus className="h-3.5 w-3.5 text-teal-300" />
            <span>Off-Boarding & Separation Hub</span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">
            {isDocument && 'Off-Boarding Document Studio'}
            {isPerformance && 'Performance Retrospective'}
            {isSettlement && 'Final Financial Settlement (F&F)'}
            {isLegal && 'Legal Clearance & Revocation'}
            {isAssets && 'Asset Return & IT Clearance'}
            {isTravel && 'Repatriation & Travel'}
            {(isReport || (!isDocument && !isPerformance && !isSettlement && !isLegal && !isAssets && !isTravel)) && 'Off-Boarding Reports & AI Analytics'}
          </h1>
          <p className="text-xs text-teal-100/80 mt-1">
            Seamless employee exit lifecycle management, automated documentation, asset handover, and final settlements.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Initiate Offboarding</span>
          </button>
          <button
            onClick={fetchOffboardingData}
            title="Refresh Data"
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Active Case Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#004848]">
            <User className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Offboarding Case</div>
            <div className="flex items-center gap-2">
              <select
                value={selectedRecordId}
                onChange={(e) => setSelectedRecordId(e.target.value)}
                className="font-extrabold text-slate-900 bg-transparent text-sm outline-none cursor-pointer border-b border-dashed border-slate-300 pb-0.5 focus:border-[#004848]"
              >
                {records.map((rec) => (
                  <option key={rec.id || rec._id} value={rec.id || rec._id}>
                    {rec.employeeName} ({rec.role} • {rec.department})
                  </option>
                ))}
              </select>

              {/* Status Selector */}
              {selectedRecord && (
                <select
                  value={selectedRecord.status}
                  onChange={(e) => handleUpdateRecordStatus(e.target.value as OffboardingStatus)}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border outline-none cursor-pointer ${
                    selectedRecord.status === 'Completed' || selectedRecord.status === 'Settled'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : selectedRecord.status === 'Cancelled'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  <option value="Initiated">Initiated</option>
                  <option value="Notice Period">Notice Period</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Pending Clearance">Pending Clearance</option>
                  <option value="Clearance In Progress">Clearance In Progress</option>
                  <option value="Pending Settlement">Pending Settlement</option>
                  <option value="Settlement Pending">Settlement Pending</option>
                  <option value="Settled">Settled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {selectedRecord && (
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400">Record ID: </span>
              <strong className="text-slate-800 font-mono">{selectedRecord.recordId}</strong>
            </div>
            <div className="h-4 w-px bg-slate-300" />
            <div>
              <span className="text-slate-400">Exit Date: </span>
              <strong className="text-slate-800">{selectedRecord.exitDate}</strong>
            </div>
            <div className="h-4 w-px bg-slate-300" />
            <div>
              <span className="text-slate-400">Separation Type: </span>
              <strong className="text-teal-800">{selectedRecord.separationType}</strong>
            </div>
            <div className="h-4 w-px bg-slate-300" />
            <div>
              <span className="text-slate-400">HRBP: </span>
              <strong className="text-slate-800">{selectedRecord.hrPersonnel || 'HR Lead'}</strong>
            </div>
          </div>
        )}
      </div>

      {/* VIEW 1: DOCUMENT STUDIO */}
      {isDocument && (
        <div className="space-y-6 animate-fade-in">
          {/* Pill Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 select-none">
            {[
              { id: 'resignation-ai' as const, label: 'Resignation Letter Drafting with AI' },
              { id: 'termination-ai' as const, label: 'Termination Letter Drafting with AI' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setDocTab(t.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                  docTab === t.id
                    ? 'bg-[#004848] text-white font-extrabold border-transparent shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Resignation Letter */}
          {docTab === 'resignation-ai' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                  <div className="flex items-center gap-2 text-purple-700 font-bold text-xs">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-extrabold text-slate-900">AI Resignation Letter Studio</span>
                  </div>
                  <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-[11px] font-extrabold">Legal AI Studio</span>
                </div>

                <div className="space-y-3.5 text-xs font-semibold text-slate-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 font-bold text-slate-800">Employee Name</label>
                      <input
                        type="text"
                        disabled
                        value={selectedRecord?.employeeName || ''}
                        className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-bold text-slate-800">Role / Position</label>
                      <input
                        type="text"
                        disabled
                        value={selectedRecord?.role || ''}
                        className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block mb-1 font-bold text-slate-800">Notice Period</label>
                      <select
                        value={docNoticeDuration}
                        onChange={(e) => setDocNoticeDuration(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                      >
                        <option>30 Days (Standard)</option>
                        <option>60 Days (Executive)</option>
                        <option>90 Days (Key Personnel)</option>
                        <option>Immediate / Waived</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 font-bold text-slate-800">Resignation Date</label>
                      <input
                        type="text"
                        value={resignationDateInput}
                        onChange={(e) => setResignationDateInput(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-bold text-slate-800">Last Working Date</label>
                      <input
                        type="text"
                        value={lastWorkingDateInput}
                        onChange={(e) => setLastWorkingDateInput(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 font-bold text-slate-800">Resignation Reason</label>
                    <input
                      type="text"
                      value={docReasonText}
                      onChange={(e) => setDocReasonText(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-slate-800">Editable Resignation Letter Body</label>
                      <span className="text-[11px] text-purple-600 font-semibold">Editable Draft</span>
                    </div>
                    <textarea
                      rows={7}
                      value={resignationLetterBody}
                      onChange={(e) => setResignationLetterBody(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-medium font-mono outline-none focus:border-[#004848] leading-relaxed"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={() => handleDraftResignation(false)}
                      disabled={isDraftingDoc}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>{isDraftingDoc ? 'Drafting...' : 'Save Draft Content'}</span>
                    </button>
                    <button
                      onClick={() => handleDraftResignation(true)}
                      disabled={isDraftingDoc}
                      className="px-4 py-2 bg-[#004848] hover:bg-[#003333] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      <span>Submit & Approve Resignation</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">Document Status & Export</h3>
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-slate-400 font-semibold">Resignation Status</div>
                    <div className="text-sm font-extrabold text-purple-700">
                      {selectedRecord?.documents?.resignationLetter?.status || 'Drafted'}
                    </div>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-slate-400 font-semibold">Effective Last Day</div>
                    <div className="font-bold text-slate-800">
                      {selectedRecord?.documents?.resignationLetter?.lastWorkingDate || selectedRecord?.exitDate || '30 Days Notice'}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const blob = new Blob([resignationLetterBody], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${selectedRecord?.employeeName.replace(/\s+/g, '_')}_Resignation_Letter.txt`;
                      a.click();
                      toast.success(`Resignation document downloaded for ${selectedRecord?.employeeName}`);
                    }}
                    className="w-full py-2.5 bg-[#004848] hover:bg-[#006666] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Resignation Letter</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Termination Letter */}
          {docTab === 'termination-ai' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                  <div className="flex items-center gap-2 text-purple-700 font-bold text-xs">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-extrabold text-slate-900">AI Termination Letter Generator</span>
                  </div>
                  <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[11px] font-extrabold">Executive Separation</span>
                </div>

                <div className="space-y-3.5 text-xs font-semibold text-slate-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 font-bold text-slate-800">Target Employee</label>
                      <input
                        type="text"
                        disabled
                        value={`${selectedRecord?.employeeName || ''} (${selectedRecord?.role || ''})`}
                        className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-bold text-slate-800">Termination Type</label>
                      <select
                        value={termType}
                        onChange={(e) => setTermType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                      >
                        <option>Mutual Separation Agreement</option>
                        <option>Redundancy / Structural Restructure</option>
                        <option>End of Fixed-Term Contract</option>
                        <option>For Cause Separation</option>
                        <option>Retirement</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 font-bold text-slate-800">Termination Reason</label>
                      <input
                        type="text"
                        value={termReasonText}
                        onChange={(e) => setTermReasonText(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-bold text-slate-800">Effective Termination Date</label>
                      <input
                        type="text"
                        value={termEffectiveDate}
                        onChange={(e) => setTermEffectiveDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 font-bold text-slate-800">Severance & Separation Clauses</label>
                    <textarea
                      rows={2}
                      value={severanceText}
                      onChange={(e) => setSeveranceText(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-[#004848]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-slate-800">Editable Termination Letter Body</label>
                      <span className="text-[11px] text-purple-600 font-semibold">Editable Draft</span>
                    </div>
                    <textarea
                      rows={6}
                      value={terminationLetterBody}
                      onChange={(e) => setTerminationLetterBody(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-medium font-mono outline-none focus:border-[#004848] leading-relaxed"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={() => handleDraftTermination(false)}
                      disabled={isDraftingDoc}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>{isDraftingDoc ? 'Drafting...' : 'Save Draft Content'}</span>
                    </button>
                    <button
                      onClick={() => handleDraftTermination(true)}
                      disabled={isDraftingDoc}
                      className="px-4 py-2 bg-[#004848] hover:bg-[#003333] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                      <span>Issue Official Termination Letter</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">Termination Status & Export</h3>
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-slate-400 font-semibold">Separation Status</div>
                    <div className="text-sm font-extrabold text-red-700">
                      {selectedRecord?.documents?.terminationLetter?.status || 'Drafted'}
                    </div>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-slate-400 font-semibold">Effective Date</div>
                    <div className="font-bold text-slate-800">
                      {selectedRecord?.documents?.terminationLetter?.effectiveDate || selectedRecord?.exitDate || 'Pending'}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const blob = new Blob([terminationLetterBody], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${selectedRecord?.employeeName.replace(/\s+/g, '_')}_Termination_Letter.txt`;
                      a.click();
                      toast.success(`Termination document downloaded for ${selectedRecord?.employeeName}`);
                    }}
                    className="w-full py-2.5 bg-[#004848] hover:bg-[#006666] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Termination Document</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: PERFORMANCE RETROSPECTIVE */}
      {isPerformance && (
        <div className="space-y-6 animate-fade-in">
          {/* Pill Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 select-none">
            {[
              { id: 'history' as const, label: "Career Timeline & History" },
              { id: 'appraisal' as const, label: 'Historical Appraisals' },
              { id: 'reference' as const, label: 'Professional References' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setPerfTab(t.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                  perfTab === t.id
                    ? 'bg-[#004848] text-white font-extrabold border-transparent shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* History Tab */}
          {perfTab === 'history' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                <h3 className="text-sm font-bold text-slate-900 m-0">
                  Career Progression & Promotions Timeline for {selectedRecord?.employeeName}
                </h3>
                <button
                  onClick={() => setShowAddMilestoneModal(true)}
                  className="px-3 py-1.5 bg-[#004848] hover:bg-[#006666] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Career Milestone</span>
                </button>
              </div>

              <div className="space-y-3">
                {((selectedRecord?.performance?.history && selectedRecord.performance.history.length > 0)
                  ? selectedRecord.performance.history
                  : [
                      { period: 'March 2023 - Jan 2024', position: 'Senior Software Engineer', department: 'Engineering', type: 'Joining' as const, details: 'Full-stack platform scaling' },
                      { period: 'Jan 2024 - June 2025', position: 'Lead Software Engineer', department: 'Engineering', type: 'Promotion' as const, details: 'Led UI Micro-frontend Redesign' },
                      { period: 'June 2025 - Present', position: 'Principal Software Engineer', department: 'Engineering', type: 'Promotion' as const, details: 'Delivered High-Availability Architecture' },
                    ]
                ).map((m, idx) => (
                  <div key={m.position + idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <History className="h-4 w-4 text-[#004848]" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 m-0">{m.position} • {m.department} ({m.period})</h4>
                        <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{m.details}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-xs font-extrabold">{m.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appraisal Tab */}
          {perfTab === 'appraisal' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                <h3 className="text-sm font-bold text-slate-900 m-0">
                  Appraisal Scorecard & Retrospective Feedback ({selectedRecord?.employeeName})
                </h3>
                <button
                  onClick={() => setShowAddAppraisalModal(true)}
                  className="px-3 py-1.5 bg-[#004848] hover:bg-[#006666] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Retrospective Feedback</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                  <span className="text-xs font-bold text-slate-500">Overall Rating</span>
                  <div className="text-2xl font-extrabold text-[#004848]">
                    {selectedRecord?.performance?.overallRating ? `${selectedRecord.performance.overallRating} / 5.0` : '4.85 / 5.0'}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-bold">Consistently Exceeded Expectations</span>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                  <span className="text-xs font-bold text-slate-500">Exit Assessment Score</span>
                  <div className="text-2xl font-extrabold text-slate-900">
                    {selectedRecord?.performance?.exitScore || 'Highly Recommended'}
                  </div>
                  <span className="text-[11px] text-teal-600 font-bold">
                    {selectedRecord?.performance?.rehireEligible ? 'Eligible for Re-hire' : 'Standard Exit'}
                  </span>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                  <span className="text-xs font-bold text-slate-500">Project Handover</span>
                  <div className="text-2xl font-extrabold text-slate-900">
                    {selectedRecord?.performance?.projectHandoverComplete ? '100% Cleared' : 'In Progress'}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-bold">Handover Complete</span>
                </div>
              </div>

              <div className="space-y-3">
                {((selectedRecord?.performance?.appraisals && selectedRecord.performance.appraisals.length > 0)
                  ? selectedRecord.performance.appraisals
                  : [
                      { cycle: 'FY2024 Annual Appraisal', rating: 4.85, managerFeedback: 'Exemplary delivery on platform scaling and architecture', achievements: 'Delivered 99.99% system availability', date: '2024-12-15' },
                    ]
                ).map((app, idx) => (
                  <div key={app.cycle + idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-900">{app.cycle} • Rating: {app.rating} / 5.0</span>
                      <span className="text-[11px] text-slate-400 font-mono">{app.date}</span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium">Feedback: {app.managerFeedback}</p>
                    <p className="text-[11px] text-teal-800 font-semibold">Achievements: {app.achievements}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reference Tab */}
          {perfTab === 'reference' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 m-0">Professional References & Verification Contacts</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Reference contacts for prospective background checks</p>
                </div>
                <button
                  onClick={() => setShowAddReferenceModal(true)}
                  className="px-3.5 py-1.5 bg-[#004848] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-[#006666] flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Reference</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {((selectedRecord?.performance?.references && selectedRecord.performance.references.length > 0)
                  ? selectedRecord.performance.references
                  : [
                      { name: 'Dr. Robert Ross', designation: 'VP of Engineering', company: 'Huremaso Global', contactInfo: 'robert.ross@huremaso.internal', relationship: 'Direct Supervisor', status: 'Verified' as const, notes: 'Highly recommended' },
                      { name: 'Elena Rostova', designation: 'Principal Architect', company: 'Huremaso Global', contactInfo: 'elena.rostova@huremaso.internal', relationship: 'Technical Peer', status: 'Verified' as const, notes: 'Collaborative co-lead' },
                    ]
                ).map((ref, idx) => (
                  <div key={ref.name + idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-slate-900 m-0">{ref.name}</h4>
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-extrabold">{ref.status}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-semibold">{ref.designation} at {ref.company}</p>
                    <p className="text-[11px] text-slate-500 font-mono">Contact: {ref.contactInfo} • Relation: {ref.relationship}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: SETTLEMENT */}
      {isSettlement && (
        <div className="space-y-6 animate-fade-in">
          {/* Pill Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 select-none">
            {[
              { id: 'compensation' as const, label: 'Full Settlement & Compensation' },
              { id: 'gratuity' as const, label: 'Gratuity Calculation' },
              { id: 'notice-salary' as const, label: 'Notice Period Salary' },
              { id: 'pending-salary' as const, label: 'Pending Salary & Expenses' },
              { id: 'other-benefits' as const, label: 'Other Benefits (Custom)' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSettlementTab(t.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                  settlementTab === t.id
                    ? 'bg-[#004848] text-white font-extrabold border-transparent shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Settlement Compensation Summary */}
          {settlementTab === 'compensation' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 m-0">Full & Final (F&F) Payout Summary</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Calculated final settlement ledger for {selectedRecord?.employeeName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                    selectedRecord?.settlement?.status === 'Disbursed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : selectedRecord?.settlement?.status === 'Approved'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {selectedRecord?.settlement?.status || 'Pending Audit'}
                  </span>
                  {selectedRecord?.settlement?.status !== 'Disbursed' && (
                    <button
                      onClick={() => handleUpdateSettlementStatus('Disbursed')}
                      disabled={isSaving}
                      className="px-3.5 py-1.5 bg-[#004848] hover:bg-[#006666] text-white text-xs font-bold rounded-xl shadow cursor-pointer transition disabled:opacity-50"
                    >
                      Mark Disbursed
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                  <span className="text-xs font-bold text-slate-500">Gross Exit Payout</span>
                  <div className="text-2xl font-extrabold text-[#004848]">
                    ${(selectedRecord?.settlement?.grossPayout || 28450).toLocaleString()} USD
                  </div>
                  <span className="text-[11px] text-emerald-600 font-bold">Audited Exit Sum</span>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                  <span className="text-xs font-bold text-slate-500">Encashable Leave Days</span>
                  <div className="text-2xl font-extrabold text-slate-900">
                    {selectedRecord?.settlement?.encashableLeaveDays || 14} Days (${(selectedRecord?.settlement?.leaveEncashmentAmount || 7600).toLocaleString()})
                  </div>
                  <span className="text-[11px] text-teal-600 font-bold">PTO Balance Encashed</span>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                  <span className="text-xs font-bold text-slate-500">Deductions (Asset/Tax)</span>
                  <div className="text-2xl font-extrabold text-slate-900">
                    ${(selectedRecord?.settlement?.deductions || 0).toLocaleString()}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-bold">Total Approved Deductions</span>
                </div>
                <div className="p-4 border border-teal-200 rounded-xl bg-teal-50/60 space-y-1">
                  <span className="text-xs font-bold text-teal-900">Net Payable Amount</span>
                  <div className="text-2xl font-extrabold text-teal-950">
                    ${(selectedRecord?.settlement?.netPayout || 28450).toLocaleString()} USD
                  </div>
                  <span className="text-[11px] text-teal-700 font-bold">Final Release Sum</span>
                </div>
              </div>

              {selectedRecord?.settlement?.paymentReference && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex justify-between items-center">
                  <span>Disbursed Payment Reference:</span>
                  <strong className="font-mono text-emerald-700">{selectedRecord.settlement.paymentReference} ({selectedRecord.settlement.disbursedDate})</strong>
                </div>
              )}
            </div>
          )}

          {/* Gratuity */}
          {settlementTab === 'gratuity' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">
                End of Service Gratuity Calculation for {selectedRecord?.employeeName}
              </h3>
              <div className="space-y-3 text-xs font-semibold text-slate-700">
                <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 flex justify-between items-center">
                  <span>Total Tenure Served:</span>
                  <strong className="text-slate-900">{selectedRecord?.settlement?.tenureServed || '3 Years 6 Months'}</strong>
                </div>
                <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 flex justify-between items-center">
                  <span>Statutory Entitlement Formula:</span>
                  <strong className="text-slate-900">{selectedRecord?.settlement?.gratuityFormula || '21 Days per Year'}</strong>
                </div>
                <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 flex justify-between items-center">
                  <span>Net Approved Gratuity Payout:</span>
                  <strong className="text-emerald-700 text-sm font-extrabold">
                    ${(selectedRecord?.settlement?.gratuityAmount || 14850).toLocaleString()} USD
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Notice Salary */}
          {settlementTab === 'notice-salary' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">Notice Period Salary Particulars</h3>
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-900">
                    Served Notice Period Salary ({selectedRecord?.settlement?.noticeDays || 30} Days)
                  </span>
                  <span className="text-sm font-extrabold text-[#004848]">
                    ${(selectedRecord?.settlement?.noticePeriodSalary || 13750).toLocaleString()} USD
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">Fully included in final exit payout calculation.</p>
              </div>
            </div>
          )}

          {/* Pending Salary */}
          {settlementTab === 'pending-salary' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">Unprocessed Pending Salary & Expenses</h3>
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 m-0">Pending Expenses Reimbursement</h4>
                  <p className="text-[11px] text-slate-500 font-semibold">Travel & Client Receipts Cleared</p>
                </div>
                <span className="text-sm font-extrabold text-emerald-700">
                  ${(selectedRecord?.settlement?.pendingExpenseAmount || 1250).toLocaleString()} USD
                </span>
              </div>
            </div>
          )}

          {/* Other Benefits */}
          {settlementTab === 'other-benefits' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">Other Custom Exit Allowances & Stock Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 m-0">Vested Stock Options Acceleration</h4>
                  <p className="text-[11px] text-slate-500 font-semibold">2,500 Vested Options exercisable within 90 days</p>
                  <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-extrabold">Active Window</span>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 m-0">COBRA Health Plan Subsidy</h4>
                  <p className="text-[11px] text-slate-500 font-semibold">3 Months company subsidized medical continuation</p>
                  <span className="inline-block px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-[10px] font-extrabold">Approved</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: LEGAL CLEARANCE */}
      {isLegal && (
        <div className="space-y-6 animate-fade-in">
          {/* Pill Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 select-none">
            {[
              { id: 'cheque' as const, label: 'Legal Cheque Voucher' },
              { id: 'visa-cancel' as const, label: 'Visa Cancellation' },
              { id: 'insurance' as const, label: 'Insurance Delisting' },
              { id: 'pcc' as const, label: 'PCC & Employer NOC' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setLegalTab(t.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                  legalTab === t.id
                    ? 'bg-[#004848] text-white font-extrabold border-transparent shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {legalTab === 'cheque' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
              <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                <h3 className="text-sm font-bold text-slate-900 m-0">Legal Cheque & Payment Release Voucher</h3>
                <span className="px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-xs font-extrabold">
                  {selectedRecord?.legal?.chequeStatus || 'Prepared'}
                </span>
              </div>
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-900">Legal Cheque Voucher #</span>
                  <span className="text-xs font-mono font-bold text-[#004848]">
                    {selectedRecord?.legal?.chequeVoucherNo || 'CHQ-2026-OFF-8841'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-600">Cheque Release Amount:</span>
                  <strong className="text-slate-900">${(selectedRecord?.legal?.chequeAmount || 28450).toLocaleString()} USD</strong>
                </div>
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => handleUpdateLegalField({ chequeStatus: 'Issued', chequeIssueDate: new Date().toISOString().split('T')[0] })}
                    className="px-3.5 py-1.5 bg-[#004848] hover:bg-[#003333] text-white font-bold text-xs rounded-xl shadow cursor-pointer transition"
                  >
                    Release Cheque Voucher
                  </button>
                  <button
                    onClick={() => handleUpdateLegalField({ chequeStatus: 'Cleared', chequeClearedDate: new Date().toISOString().split('T')[0] })}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition"
                  >
                    Mark Cleared ✓
                  </button>
                </div>
              </div>
            </div>
          )}

          {legalTab === 'visa-cancel' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">Labor & Residency Visa Cancellation</h3>
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 m-0">Work Permit Revocation Notice</h4>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                    Grace Period Active ({selectedRecord?.legal?.visaGracePeriodDays || 30} Days Remaining)
                  </p>
                </div>
                <button
                  onClick={() => handleUpdateLegalField({ visaCancellationStatus: 'Cancelled' })}
                  className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold hover:bg-emerald-100 transition cursor-pointer"
                >
                  {selectedRecord?.legal?.visaCancellationStatus === 'Cancelled' ? 'Cancelled ✓' : 'Mark Cancelled'}
                </button>
              </div>
            </div>
          )}

          {legalTab === 'insurance' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">Group Insurance Delisting</h3>
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 m-0">Health & Life Policy Cancellation Notice</h4>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Transitioned to COBRA Individual Continuation</p>
                </div>
                <button
                  onClick={() => handleUpdateLegalField({ insuranceDelisted: true })}
                  className="px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-xs font-extrabold hover:bg-teal-100 transition cursor-pointer"
                >
                  {selectedRecord?.legal?.insuranceDelisted ? 'Delisted ✓' : 'Confirm Delist'}
                </button>
              </div>
            </div>
          )}

          {legalTab === 'pcc' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">Police Clearance Certificate & NOC</h3>
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 m-0">Police Conduct Clearance (PCC) & Employer NOC</h4>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                    {selectedRecord?.legal?.nocIssued ? 'No Objection Certificate Issued' : 'Pending Verification'}
                  </p>
                </div>
                <button
                  onClick={() => handleUpdateLegalField({ pccStatus: 'Clear', nocIssued: true })}
                  className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold hover:bg-emerald-100 transition cursor-pointer"
                >
                  {selectedRecord?.legal?.pccStatus === 'Clear' ? 'Clear ✓' : 'Verify & Clear'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 5: ASSET RETURN & IT CLEARANCE */}
      {isAssets && (
        <div className="space-y-6 animate-fade-in">
          {/* Pill Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 select-none">
            {[
              { id: 'possessed' as const, label: 'Assets List - Possessed' },
              { id: 'return' as const, label: 'Assets Return' },
              { id: 'dependencies' as const, label: 'Dependencies' },
              { id: 'missing' as const, label: 'Missing Assets' },
              { id: 'cost-calc' as const, label: 'Cost Calculation' },
              { id: 'asset-settlement' as const, label: 'IT Settlement' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setAssetTab(t.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                  assetTab === t.id
                    ? 'bg-[#004848] text-white font-extrabold border-transparent shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Possessed Assets */}
          {assetTab === 'possessed' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">
                Currently Possessed Company Hardware & Tokens ({selectedRecord?.employeeName})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(selectedRecord?.assets?.items || []).map((a) => (
                  <div key={a.tag} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 m-0">{a.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{a.tag} • Assigned: {a.assignedDate || 'Standard'}</p>
                    </div>
                    <button
                      onClick={() => handleToggleAssetItem(a.tag, a.status === 'Returned' ? 'Possessed' : 'Returned')}
                      className={`px-3 py-1 rounded-full text-xs font-extrabold cursor-pointer transition ${
                        a.status === 'Returned'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      {a.status === 'Returned' ? 'Returned ✓' : 'Mark Returned'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Return Log */}
          {assetTab === 'return' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">Physical Asset Return Inspection Log</h3>
              <div className="space-y-3">
                {(selectedRecord?.assets?.items || []).filter((a) => a.status === 'Returned').map((a) => (
                  <div key={a.tag} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 m-0">{a.name} ({a.tag})</h4>
                      <p className="text-[11px] text-slate-500 font-semibold">Returned Date: {a.returnDate || 'Recent'} • Inspected: {a.returnCondition || 'Good'}</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold">Passed Inspection</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dependencies / Access Revocation */}
          {assetTab === 'dependencies' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">Project Handovers & Access Revocation Checklist</h3>
              <div className="space-y-3">
                {(selectedRecord?.assets?.dependencies || []).map((d) => (
                  <div key={d.task} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900">{d.task}</span>
                      <p className="text-[11px] text-slate-400 font-semibold">{d.category} Service • {d.serviceName || 'Internal'}</p>
                    </div>
                    <button
                      onClick={() => handleToggleDependency(d.task, d.status === 'Completed' || d.status === 'Signed Off' ? 'Pending' : 'Completed')}
                      className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold hover:bg-emerald-100 transition cursor-pointer"
                    >
                      {d.status} ✓
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing Assets */}
          {assetTab === 'missing' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                <h3 className="text-sm font-bold text-slate-900 m-0">Missing or Damaged Assets Audit</h3>
                <button
                  onClick={() => setShowAddMissingAssetModal(true)}
                  className="px-3 py-1.5 bg-[#004848] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Log Missing Asset</span>
                </button>
              </div>

              {(!selectedRecord?.assets?.missingItems || selectedRecord.assets.missingItems.length === 0) ? (
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 text-xs font-medium text-slate-600">
                  Zero missing or damaged company equipment logged.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedRecord.assets.missingItems.map((m, idx) => (
                    <div key={m.tag + idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 m-0">{m.name} ({m.tag})</h4>
                        <p className="text-[11px] text-slate-500 font-semibold">Investigator: {m.investigator} • Notes: {m.explanation}</p>
                      </div>
                      <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-extrabold">-${m.deductionAmount} Deducted</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Cost Calc */}
          {assetTab === 'cost-calc' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">Asset Depreciation & Deduction Cost Calculation</h3>
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-900">Total Asset Liability Deduction</span>
                  <span className="text-sm font-extrabold text-[#004848]">
                    ${(selectedRecord?.assets?.totalDeductions || 0).toLocaleString()} USD
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">Approved deductions are automatically factored into the Final Financial Settlement (F&F).</p>
              </div>
            </div>
          )}

          {/* IT Settlement Sign-off */}
          {assetTab === 'asset-settlement' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">IT & Asset Clearance Sign-Off</h3>
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 m-0">Head of IT Infrastructure Clearance</h4>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    {selectedRecord?.assets?.clearedBy || 'Marcus Vance'}
                  </p>
                </div>
                <button
                  onClick={handleSignOffITClearance}
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-extrabold shadow cursor-pointer transition disabled:opacity-50"
                >
                  {selectedRecord?.assets?.isFullyCleared ? 'Fully Cleared ✓' : 'Sign Off Clearance'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 6: REPATRIATION & TRAVEL */}
      {isTravel && (
        <div className="space-y-6 animate-fade-in">
          {/* Pill Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 select-none">
            {[
              { id: 'tickets' as const, label: 'Repatriation Tickets' },
              { id: 'misc-custom' as const, label: 'MISC (Custom Fields)' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTravelTab(t.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                  travelTab === t.id
                    ? 'bg-[#004848] text-white font-extrabold border-transparent shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {travelTab === 'tickets' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">Repatriation Flight Ticket Booking</h3>
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 m-0">
                    {selectedRecord?.travel?.airline || 'Emirates Business Class'} Return Ticket
                  </h4>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                    Destination: {selectedRecord?.travel?.destination || 'London Heathrow (LHR)'} • {selectedRecord?.travel?.flightDate || 'Oct 15, 2026'}
                  </p>
                </div>
                <button
                  onClick={() => handleUpdateTravel({ ticketStatus: 'Issued' })}
                  className="px-3.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold hover:bg-emerald-100 transition cursor-pointer"
                >
                  {selectedRecord?.travel?.ticketStatus === 'Issued' ? 'Issued ✓' : 'Issue Ticket'}
                </button>
              </div>
            </div>
          )}

          {travelTab === 'misc-custom' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                <h3 className="text-sm font-bold text-slate-900 m-0">Custom Offboarding Fields & Stipends</h3>
                <button
                  onClick={() => setShowAddCustomFieldModal(true)}
                  className="px-3 py-1.5 bg-[#004848] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Custom Field</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(selectedRecord?.customFields || []).map((f) => (
                  <div key={f.key} className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                    <span className="text-xs font-bold text-slate-500">{f.label} ({f.type})</span>
                    <div className="text-sm font-extrabold text-[#004848]">
                      {typeof f.value === 'boolean' ? (f.value ? 'Active / Yes' : 'No') : String(f.value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 7: REPORTS & ANALYTICS */}
      {(isReport || (!isDocument && !isPerformance && !isSettlement && !isLegal && !isAssets && !isTravel)) && (
        <div className="space-y-6 animate-fade-in">
          {/* Pill Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 select-none">
            {[
              { id: 'reports-ai' as const, label: 'Reports + AI' },
              { id: 'analytics-ai' as const, label: 'Analytics + AI' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setReportTab(t.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                  reportTab === t.id
                    ? 'bg-[#004848] text-white font-extrabold border-transparent shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {reportTab === 'reports-ai' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">AI Exit Sentiment & Attrition Reports</h3>
              <div className="space-y-3">
                {[
                  { title: 'Exit Interview AI Sentiment Audit.pdf', status: 'Generated by AI' },
                  { title: 'Engineering Attrition & Key Risk Drivers Report.pdf', status: 'Ready for Review' },
                  { title: 'Executive Asset & Non-Disclosure Clearance Log.pdf', status: 'Audited & Signed' },
                  { title: 'Full & Final Financial Settlement Audit Certificate.pdf', status: 'Certified PDF' },
                ].map((r) => (
                  <div key={r.title} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      <span className="text-xs font-bold text-slate-900">{r.title}</span>
                    </div>
                    <button
                      onClick={() => toast.success(`Downloaded ${r.title}`)}
                      className="px-3 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-full text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Download className="h-3 w-3" />
                      <span>{r.status}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reportTab === 'analytics-ai' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-slate-500">Total Offboarding Cases</span>
                  <div className="text-2xl font-extrabold text-[#004848]">
                    {reportsSummary?.totalOffboarding ?? records.length}
                  </div>
                  <span className="text-[11px] text-teal-600 font-bold">Active Database Records</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-slate-500">Average Clearance Velocity</span>
                  <div className="text-2xl font-extrabold text-slate-900">
                    {reportsSummary ? `${reportsSummary.averageClearanceDays} Days` : '2.1 Days'}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-bold">Real-time Calculation</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-slate-500">Asset Recovery Rate</span>
                  <div className="text-2xl font-extrabold text-slate-900">
                    {reportsSummary?.assetRecoveryRate ?? 85}%
                  </div>
                  <span className="text-[11px] text-teal-600 font-bold">Returned Equipment Ratio</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-slate-500">Re-hire Eligibility Score</span>
                  <div className="text-2xl font-extrabold text-slate-900">
                    {reportsSummary ? `${reportsSummary.rehireEligibilityRate}%` : '92%'}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-bold">High Employer Branding</span>
                </div>
              </div>

              {/* Department breakdown */}
              {reportsSummary?.departmentAttrition && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Department Attrition Distribution</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(reportsSummary.departmentAttrition).map(([dept, count]) => (
                      <div key={dept} className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                        <span className="text-xs text-slate-500 font-semibold">{dept}</span>
                        <div className="text-lg font-bold text-slate-900">{count} Cases</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Initiate Offboarding Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div className="flex items-center gap-2">
                <UserMinus className="h-5 w-5 text-[#004848]" />
                <h3 className="text-base font-extrabold text-slate-900 m-0">Initiate Employee Offboarding</h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewRecord} className="space-y-4 text-xs font-semibold text-slate-700">
              {/* Select Existing Employee */}
              <div>
                <label className="block mb-1 font-bold text-slate-800">Select Existing Employee *</label>
                <select
                  value={selectedPickerEmpId}
                  onChange={(e) => handleSelectEmployeePicker(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848] cursor-pointer"
                >
                  <option value="">-- Choose an employee from database --</option>
                  {availableEmployees.map((emp) => (
                    <option key={emp.id || emp.employeeId} value={emp.id || emp.employeeId}>
                      {emp.name} ({emp.role} • {emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-800">Employee Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Role / Position *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Staff Architect"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Department</label>
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Separation Type</label>
                  <select
                    value={newSeparationType}
                    onChange={(e) => setNewSeparationType(e.target.value as SeparationType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                  >
                    <option value="Resignation">Resignation</option>
                    <option value="Termination">Termination</option>
                    <option value="Mutual Separation">Mutual Separation</option>
                    <option value="Retirement">Retirement</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Notice Duration</label>
                  <select
                    value={newNoticeDuration}
                    onChange={(e) => setNewNoticeDuration(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                  >
                    <option>30 Days</option>
                    <option>60 Days</option>
                    <option>90 Days</option>
                    <option>Immediate / Waived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Resignation Date</label>
                  <input
                    type="date"
                    value={newResignationDate}
                    onChange={(e) => setNewResignationDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Last Working Date</label>
                  <input
                    type="date"
                    value={newLastWorkingDate}
                    onChange={(e) => setNewLastWorkingDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-800">Assigned HRBP Personnel</label>
                <input
                  type="text"
                  value={newHrPersonnel}
                  onChange={(e) => setNewHrPersonnel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-800">Separation Reason / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Higher studies transition"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-[#004848]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#004848] hover:bg-[#006666] text-white font-bold text-xs rounded-xl shadow cursor-pointer transition disabled:opacity-50"
                >
                  {isSaving ? 'Initiating...' : 'Create Offboarding Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Career Milestone Modal */}
      {showAddMilestoneModal && (
        <Modal isOpen={showAddMilestoneModal} onClose={() => setShowAddMilestoneModal(false)} title="Add Career Milestone to Timeline">
          <form onSubmit={handleAddCareerMilestone} className="space-y-4 text-xs font-semibold text-slate-700">
            <div>
              <label className="block mb-1 font-bold text-slate-800">Position / Title *</label>
              <input
                type="text"
                required
                value={newMilestonePosition}
                onChange={(e) => setNewMilestonePosition(e.target.value)}
                placeholder="e.g. Lead Frontend Engineer"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-bold text-slate-800">Department</label>
                <input
                  type="text"
                  value={newMilestoneDept}
                  onChange={(e) => setNewMilestoneDept(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                />
              </div>
              <div>
                <label className="block mb-1 font-bold text-slate-800">Period / Year</label>
                <input
                  type="text"
                  value={newMilestonePeriod}
                  onChange={(e) => setNewMilestonePeriod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                />
              </div>
            </div>
            <div>
              <label className="block mb-1 font-bold text-slate-800">Milestone Type</label>
              <select
                value={newMilestoneType}
                onChange={(e) => setNewMilestoneType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
              >
                <option value="Promotion">Promotion</option>
                <option value="Transfer">Transfer</option>
                <option value="Milestone">Milestone</option>
                <option value="Joining">Joining</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 font-bold text-slate-800">Details</label>
              <input
                type="text"
                value={newMilestoneDetail}
                onChange={(e) => setNewMilestoneDetail(e.target.value)}
                placeholder="e.g. Led core platform micro-frontend migration"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-[#004848]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddMilestoneModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#004848] text-white font-bold text-xs rounded-xl shadow"
              >
                Save Milestone
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Retrospective Feedback Modal */}
      {showAddAppraisalModal && (
        <Modal isOpen={showAddAppraisalModal} onClose={() => setShowAddAppraisalModal(false)} title="Record Retrospective Appraisal Feedback">
          <form onSubmit={handleAddAppraisal} className="space-y-4 text-xs font-semibold text-slate-700">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-bold text-slate-800">Cycle / Review Name</label>
                <input
                  type="text"
                  value={newAppraisalCycle}
                  onChange={(e) => setNewAppraisalCycle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                />
              </div>
              <div>
                <label className="block mb-1 font-bold text-slate-800">Performance Rating (1.0 - 5.0)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={newAppraisalRating}
                  onChange={(e) => setNewAppraisalRating(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                />
              </div>
            </div>
            <div>
              <label className="block mb-1 font-bold text-slate-800">Manager Retrospective Feedback *</label>
              <textarea
                rows={3}
                required
                value={newAppraisalFeedback}
                onChange={(e) => setNewAppraisalFeedback(e.target.value)}
                placeholder="Provide appraisal summary feedback..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-medium outline-none focus:border-[#004848]"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold text-slate-800">Key Achievements</label>
              <input
                type="text"
                value={newAppraisalAchievements}
                onChange={(e) => setNewAppraisalAchievements(e.target.value)}
                placeholder="e.g. Delivered 99.99% system availability"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddAppraisalModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#004848] text-white font-bold text-xs rounded-xl shadow"
              >
                Save Feedback
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Reference Modal */}
      {showAddReferenceModal && (
        <Modal isOpen={showAddReferenceModal} onClose={() => setShowAddReferenceModal(false)} title="Add Professional Reference Check">
          <form onSubmit={handleAddReference} className="space-y-4 text-xs font-semibold text-slate-700">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-bold text-slate-800">Reference Name *</label>
                <input
                  type="text"
                  required
                  value={newRefName}
                  onChange={(e) => setNewRefName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                />
              </div>
              <div>
                <label className="block mb-1 font-bold text-slate-800">Designation</label>
                <input
                  type="text"
                  value={newRefDesignation}
                  onChange={(e) => setNewRefDesignation(e.target.value)}
                  placeholder="e.g. VP of Engineering"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-bold text-slate-800">Company</label>
                <input
                  type="text"
                  value={newRefCompany}
                  onChange={(e) => setNewRefCompany(e.target.value)}
                  placeholder="e.g. Huremaso"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                />
              </div>
              <div>
                <label className="block mb-1 font-bold text-slate-800">Contact Email / Phone</label>
                <input
                  type="text"
                  value={newRefContact}
                  onChange={(e) => setNewRefContact(e.target.value)}
                  placeholder="e.g. supervisor@company.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                />
              </div>
            </div>
            <div>
              <label className="block mb-1 font-bold text-slate-800">Relationship</label>
              <input
                type="text"
                value={newRefRelationship}
                onChange={(e) => setNewRefRelationship(e.target.value)}
                placeholder="e.g. Direct Supervisor for 3 Years"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddReferenceModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#004848] text-white font-bold text-xs rounded-xl shadow"
              >
                Save Reference
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Missing Asset Modal */}
      {showAddMissingAssetModal && (
        <Modal isOpen={showAddMissingAssetModal} onClose={() => setShowAddMissingAssetModal(false)} title="Log Missing Asset & Damage Deduction">
          <form onSubmit={handleAddMissingAsset} className="space-y-4 text-xs font-semibold text-slate-700">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-bold text-slate-800">Asset Name *</label>
                <input
                  type="text"
                  required
                  value={newMissingName}
                  onChange={(e) => setNewMissingName(e.target.value)}
                  placeholder="e.g. 4K Monitor Stand"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                />
              </div>
              <div>
                <label className="block mb-1 font-bold text-slate-800">Asset Tag</label>
                <input
                  type="text"
                  value={newMissingTag}
                  onChange={(e) => setNewMissingTag(e.target.value)}
                  placeholder="e.g. ASSET-2026-IT-990"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-bold text-slate-800">Approved Deduction Amount ($ USD)</label>
                <input
                  type="number"
                  value={newMissingCost}
                  onChange={(e) => setNewMissingCost(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                />
              </div>
              <div>
                <label className="block mb-1 font-bold text-slate-800">Investigator</label>
                <input
                  type="text"
                  value={newMissingInvestigator}
                  onChange={(e) => setNewMissingInvestigator(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                />
              </div>
            </div>
            <div>
              <label className="block mb-1 font-bold text-slate-800">Explanation / Reason</label>
              <textarea
                rows={2}
                value={newMissingExplanation}
                onChange={(e) => setNewMissingExplanation(e.target.value)}
                placeholder="Details regarding missing or damaged item..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-medium outline-none focus:border-[#004848]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddMissingAssetModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow"
              >
                Apply Deduction
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Custom Field Modal */}
      {showAddCustomFieldModal && (
        <Modal isOpen={showAddCustomFieldModal} onClose={() => setShowAddCustomFieldModal(false)} title="Add Custom Offboarding Field">
          <form onSubmit={handleAddCustomField} className="space-y-4 text-xs font-semibold text-slate-700">
            <div>
              <label className="block mb-1 font-bold text-slate-800">Field Label *</label>
              <input
                type="text"
                required
                value={newCustomLabel}
                onChange={(e) => setNewCustomLabel(e.target.value)}
                placeholder="e.g. Alumni Network Membership"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-bold text-slate-800">Field Type</label>
                <select
                  value={newCustomType}
                  onChange={(e) => setNewCustomType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                >
                  <option value="text">Text</option>
                  <option value="date">Date</option>
                  <option value="number">Number</option>
                  <option value="dropdown">Dropdown</option>
                  <option value="checkbox">Checkbox (Yes/No)</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 font-bold text-slate-800">Initial Value</label>
                <input
                  type="text"
                  value={newCustomValue}
                  onChange={(e) => setNewCustomValue(e.target.value)}
                  placeholder="Value..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCustomFieldModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#004848] text-white font-bold text-xs rounded-xl shadow"
              >
                Add Field
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default EmployeeOffBoardingPage;
