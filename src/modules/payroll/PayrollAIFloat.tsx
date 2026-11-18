import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Minimize2,
  Maximize2,
  Copy,
  Trash2,
  RefreshCw,
  TrendingUp,
  Brain,
  ShieldCheck,
  Heart,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { payrollAIService } from '../../services/payrollService';
import {
  WorkforceAnalyticsResponse,
  PerformanceSkillsResponse,
  EmployeeExperienceResponse,
  ComplianceCheckResponse,
} from '../../types/payroll';
import { useToast } from '../../hooks/useToast';
import Loader from '../../components/common/Loader';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedAction?: string;
}

const SUGGESTED_QUESTIONS = [
  'Draft a Leave Approval email',
  'Analyze department turnover',
  'Check Bonus eligibility rules',
  'Explain employee benefits',
  'Generate payroll reports',
  'Explain salary deductions',
  'Check employee salary status',
];

type AITab = 'chat' | 'workforce' | 'skills' | 'experience' | 'compliance';

export const PayrollAIFloat: React.FC = () => {
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<AITab>('chat');

  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I am your Payroll & HR AI Assistant. I have live access to verified payroll records, pay grades, benefit schemes, and statutory compliance rules. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Tab Data States
  const [workforce, setWorkforce] = useState<WorkforceAnalyticsResponse | null>(null);
  const [skills, setSkills] = useState<PerformanceSkillsResponse | null>(null);
  const [experience, setExperience] = useState<EmployeeExperienceResponse | null>(null);
  const [compliance, setCompliance] = useState<ComplianceCheckResponse | null>(null);
  const [isLoadingTab, setIsLoadingTab] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized && activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, activeTab]);

  useEffect(() => {
    if (isOpen && !isMinimized && activeTab === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized, activeTab]);

  // Load Tab Data
  const loadTabData = useCallback(async (tab: AITab) => {
    setIsLoadingTab(true);
    try {
      if (tab === 'workforce' && !workforce) {
        const data = await payrollAIService.getWorkforceAnalytics();
        setWorkforce(data);
      } else if (tab === 'skills' && !skills) {
        const data = await payrollAIService.getPerformanceSkills();
        setSkills(data);
      } else if (tab === 'experience' && !experience) {
        const data = await payrollAIService.getEmployeeExperience();
        setExperience(data);
      } else if (tab === 'compliance' && !compliance) {
        const data = await payrollAIService.getComplianceCheck();
        setCompliance(data);
      }
    } catch {
      toast.error('Failed to load AI analytics for this section');
    } finally {
      setIsLoadingTab(false);
    }
  }, [workforce, skills, experience, compliance, toast]);

  const handleTabChange = (tab: AITab) => {
    setActiveTab(tab);
    if (tab !== 'chat') {
      loadTabData(tab);
    }
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await payrollAIService.chat(messageText);
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: response.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedAction: response.suggestedAction,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'I encountered an error querying the payroll database. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: 'Conversation history cleared. Ask me any HR or payroll question!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    toast.info('Conversation history cleared.');
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Response copied to clipboard!');
  };

  const handleSyncKnowledge = async () => {
    setIsSyncing(true);
    try {
      const result = await payrollAIService.syncKnowledge();
      toast.success(result.details || 'Knowledge base successfully synced!');
    } catch {
      toast.error('Failed to sync AI knowledge base');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          id="payroll-ai-float-btn"
          className="fixed bottom-6 right-6 z-50 h-14 w-14 bg-gradient-to-br from-[#002222] via-[#004848] to-[#007878] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer group border border-teal-300/30"
          title="Payroll & HR AI Assistant"
        >
          <Bot className="h-7 w-7 text-teal-200 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-teal-400"></span>
          </span>
        </button>
      )}

      {/* Floating Assistant Modal Window */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-200 shadow-2xl border border-slate-200/90 rounded-2xl bg-white flex flex-col overflow-hidden ${
            isMinimized
              ? 'bottom-6 right-6 w-80 h-14'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[95vw] sm:w-[480px] md:w-[540px] h-[640px] max-h-[90vh]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] text-white px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-teal-400/20 border border-teal-300/30 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-teal-300" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white leading-tight m-0">Payroll & HR AI Copilot</h2>
                <span className="text-[10px] text-teal-200/80 block">Authorized Corporate Knowledge Base</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleSyncKnowledge}
                disabled={isSyncing}
                title="Sync Knowledge Base"
                className="p-1.5 text-teal-200 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Expand' : 'Minimize'}
                className="p-1.5 text-teal-200 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
              >
                {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1.5 text-teal-200 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body when not minimized */}
          {!isMinimized && (
            <div className="flex flex-col flex-1 min-h-0 bg-slate-50/50">
              {/* Internal Tabs Bar */}
              <div className="flex items-center gap-1 px-3 py-2 bg-white border-b border-slate-200 shrink-0 overflow-x-auto select-none">
                <button
                  onClick={() => handleTabChange('chat')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'chat'
                      ? 'bg-[#004848] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Bot className="h-3 w-3" />
                  <span>Assistant</span>
                </button>
                <button
                  onClick={() => handleTabChange('workforce')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'workforce'
                      ? 'bg-[#004848] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <TrendingUp className="h-3 w-3" />
                  <span>Workforce</span>
                </button>
                <button
                  onClick={() => handleTabChange('skills')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'skills'
                      ? 'bg-[#004848] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Brain className="h-3 w-3" />
                  <span>Skills</span>
                </button>
                <button
                  onClick={() => handleTabChange('experience')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'experience'
                      ? 'bg-[#004848] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Heart className="h-3 w-3" />
                  <span>EX</span>
                </button>
                <button
                  onClick={() => handleTabChange('compliance')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'compliance'
                      ? 'bg-[#004848] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="h-3 w-3" />
                  <span>Compliance</span>
                </button>
              </div>

              {/* TAB 1: Conversational Chat */}
              {activeTab === 'chat' && (
                <div className="flex flex-col flex-1 min-h-0">
                  {/* Messages Scroll Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm relative group ${
                            msg.role === 'user'
                              ? 'bg-[#004848] text-white rounded-br-none'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{msg.content}</div>

                          <div className="flex items-center justify-between gap-3 mt-1.5 pt-1 border-t border-slate-100/30 text-[10px]">
                            <span className={msg.role === 'user' ? 'text-teal-200' : 'text-slate-400'}>
                              {msg.timestamp}
                            </span>
                            {msg.role === 'assistant' && (
                              <button
                                onClick={() => handleCopyMessage(msg.content)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                                title="Copy response"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                        <Loader size="sm" />
                        <span className="italic text-[11px]">Querying payroll database & policies...</span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Suggested Questions Pills */}
                  <div className="px-3 py-2 bg-white border-t border-slate-200 shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Suggested Actions & Inquiries:
                    </span>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {SUGGESTED_QUESTIONS.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => sendMessage(q)}
                          className="px-2.5 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-teal-50 hover:text-[#004848] text-slate-700 rounded-full border border-slate-200 whitespace-nowrap transition-colors cursor-pointer shrink-0"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input Footer */}
                  <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleClearHistory}
                      title="Clear Conversation History"
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Ask about payroll, salaries, benefits, taxes..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-[#004848] focus:bg-white transition-all"
                    />
                    <button
                      onClick={() => sendMessage()}
                      disabled={!input.trim() || isTyping}
                      className="px-4 py-2 bg-[#004848] hover:bg-[#003333] text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Send</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: Workforce Analytics */}
              {activeTab === 'workforce' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {isLoadingTab ? (
                    <div className="py-12 flex justify-center"><Loader text="Analyzing workforce trends..." /></div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Turnover Rate</span>
                          <span className="text-xl font-extrabold text-[#004848] block mt-1">
                            {workforce?.annualizedTurnoverRate ?? 4.2}%
                          </span>
                          <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">1.6% below benchmark</span>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Retention Indicator</span>
                          <span className="text-xl font-extrabold text-teal-700 block mt-1">
                            {workforce?.retentionIndicatorPercent ?? 92.4}%
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">High Stability Index</span>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2.5">
                        <h3 className="text-xs font-bold text-slate-900 m-0">Department Turnover Risk</h3>
                        <div className="space-y-2">
                          {(workforce?.departmentTurnover || [
                            { department: 'Engineering', turnoverRate: 3.2, riskLevel: 'Low' as const },
                            { department: 'Marketing', turnoverRate: 4.1, riskLevel: 'Low' as const },
                            { department: 'Sales', turnoverRate: 5.8, riskLevel: 'Medium' as const },
                          ]).map((dept, i) => (
                            <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-slate-50">
                              <span className="font-semibold text-slate-700">{dept.department}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-slate-600">{dept.turnoverRate}%</span>
                                <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                                  dept.riskLevel === 'Low' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {dept.riskLevel} Risk
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-teal-50/60 border border-teal-100 rounded-xl p-4 space-y-2">
                        <span className="text-xs font-bold text-[#004848] block">AI Retention Recommendations</span>
                        <ul className="text-xs text-slate-700 space-y-1.5 pl-4 list-disc">
                          {(workforce?.retentionDrivers || []).map((driver, idx) => (
                            <li key={idx}>{driver}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 3: Autonomous Performance & Skills */}
              {activeTab === 'skills' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {isLoadingTab ? (
                    <div className="py-12 flex justify-center"><Loader text="Evaluating skill metrics..." /></div>
                  ) : (
                    <>
                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                        <h3 className="text-xs font-bold text-slate-900 m-0">Identified Skill Gaps Across Teams</h3>
                        <div className="space-y-2.5">
                          {(skills?.skillGaps || []).map((gap, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="font-semibold text-slate-800">{gap.skill}</span>
                                <span className="font-bold text-[#004848]">{gap.gapPercent}% Gap</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-teal-500 to-[#004848] h-full rounded-full"
                                  style={{ width: `${100 - gap.gapPercent}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-[10px] text-slate-400">
                                <span>{gap.qualifiedCount} Qualified</span>
                                <span>{gap.requiredCount} Target</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2.5">
                        <h3 className="text-xs font-bold text-slate-900 m-0">Recommended Development Programs</h3>
                        <div className="space-y-2">
                          {(skills?.recommendations || []).map((rec, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-800">{rec.role}</span>
                                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                                  {rec.targetEmployees} Staff
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 m-0">{rec.developmentFocus}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 4: Employee Experience (EX) */}
              {activeTab === 'experience' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {isLoadingTab ? (
                    <div className="py-12 flex justify-center"><Loader text="Aggregating employee feedback..." /></div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Satisfaction Score</span>
                          <span className="text-xl font-extrabold text-emerald-600 block mt-1">
                            {experience?.satisfactionScore ?? 88.6} / 100
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Top 10% Industry Tier</span>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Benefits Utilization</span>
                          <span className="text-xl font-extrabold text-[#004848] block mt-1">
                            {experience?.benefitsUtilizationRate ?? 79.4}%
                          </span>
                          <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">Active Engagement</span>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2.5">
                        <h3 className="text-xs font-bold text-slate-900 m-0">Top Utilized Benefits</h3>
                        <div className="space-y-2">
                          {(experience?.topUtilizedBenefits || []).map((ben, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-100 last:border-none">
                              <span className="font-semibold text-slate-800">{ben.benefit}</span>
                              <span className="font-mono text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded text-[11px]">
                                {ben.utilizationCount} claims
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 5: Automated Compliance */}
              {activeTab === 'compliance' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {isLoadingTab ? (
                    <div className="py-12 flex justify-center"><Loader text="Running statutory audit checks..." /></div>
                  ) : (
                    <>
                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Compliance Health Score</span>
                          <span className="text-2xl font-extrabold text-emerald-600 block mt-0.5">
                            {compliance?.healthScorePercent ?? 96.5}%
                          </span>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2.5">
                        <h3 className="text-xs font-bold text-slate-900 m-0">Statutory Checks & Safeguards</h3>
                        <div className="space-y-2">
                          {(compliance?.statutoryChecks || []).map((check, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-800">{check.rule}</span>
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                  {check.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 m-0">{check.details}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default PayrollAIFloat;
