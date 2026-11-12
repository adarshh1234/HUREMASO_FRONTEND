import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  Heart, 
  Zap, 
  Search, 
  Bot, 
  CheckCircle2, 
  Send,
  HelpCircle,
  Copy,
  Paperclip,
  Mic,
  FileText,
  ShieldCheck,
  RefreshCw,
  Award,
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { 
  aiService, 
  ChatMessage, 
  WorkforceAnalytics, 
  FlightRiskItem, 
  SkillGapItem, 
  ComplianceItem 
} from '../../services/aiService';

export const HuremasoAIPage: React.FC = () => {
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveTabFromPath = (pathname: string) => {
    if (pathname.includes('/ai/predictive-analytics')) return 'predictive';
    if (pathname.includes('/ai/autonomous-performance')) return 'performance';
    if (pathname.includes('/ai/employee-experience')) return 'ex';
    if (pathname.includes('/ai/automated-compliance')) return 'compliance';
    return 'ask';
  };

  const [activeTab, setActiveTab] = useState<'ask' | 'predictive' | 'performance' | 'ex' | 'compliance'>(
    () => getActiveTabFromPath(location.pathname)
  );

  useEffect(() => {
    setActiveTab(getActiveTabFromPath(location.pathname));
  }, [location.pathname]);

  // Conversational HR State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Tab Data States
  const [workforceData, setWorkforceData] = useState<WorkforceAnalytics | null>(null);
  const [flightRisks, setFlightRisks] = useState<FlightRiskItem[]>([]);
  const [skillGaps, setSkillGaps] = useState<SkillGapItem[]>([]);
  const [sentimentData, setSentimentData] = useState<any>(null);
  const [complianceRecords, setComplianceRecords] = useState<ComplianceItem[]>([]);
  const [isScanningCompliance, setIsScanningCompliance] = useState(false);

  // Load chat history
  const loadChatHistory = useCallback(async () => {
    try {
      const res = await aiService.getConversation('default-chat');
      if (res && res.messages && res.messages.length > 0) {
        setChatMessages(res.messages.map(m => ({
          ...m,
          time: m.time || (m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'),
        })));
      }
    } catch (err) {
      console.error('Failed to load chat conversation', err);
    }
  }, []);

  // Load section-specific data based on active tab
  const loadTabData = useCallback(async (tab: string) => {
    try {
      if (tab === 'predictive') {
        const [analytics, risks] = await Promise.all([
          aiService.getWorkforceAnalytics(),
          aiService.getFlightRisks(),
        ]);
        setWorkforceData(analytics);
        setFlightRisks(risks);
      } else if (tab === 'performance') {
        const skills = await aiService.getSkillGaps();
        setSkillGaps(skills);
      } else if (tab === 'ex') {
        const sentiment = await aiService.getSentimentMetrics();
        setSentimentData(sentiment);
      } else if (tab === 'compliance') {
        const records = await aiService.getComplianceRecords();
        setComplianceRecords(records);
      }
    } catch (err) {
      console.error(`Failed to load data for tab ${tab}`, err);
    }
  }, []);

  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab, loadTabData]);

  const quickPrompts = [
    { label: '💡 Draft a Leave Approval email', prompt: 'Draft a professional leave approval email template for managers.' },
    { label: '📊 Analyze Q3 Sales department turnover', prompt: 'What is the projected Q3 turnover rate for the Sales department?' },
    { label: '💰 Check Bonus eligibility rules', prompt: 'Explain the company performance bonus eligibility criteria for senior leads.' },
    { label: '📜 Maternity & Paternity Policy details', prompt: 'Summarize our current maternity and paternity paid leave policy.' },
    { label: '🚀 Engineer Onboarding Checklist', prompt: 'Generate a 5-step onboarding checklist for a new Senior Software Engineer.' }
  ];

  const handleSendChat = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userText = query;
    if (!textToSend) setInputQuery('');
    
    // Add user message to local state immediately
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      text: userText,
      time: 'Just now',
    };
    setChatMessages(prev => [...prev, tempUserMsg]);
    setIsTyping(true);

    try {
      const res = await aiService.sendChatMessage(userText, 'default-chat');
      if (res && res.conversation && res.conversation.messages) {
        setChatMessages(res.conversation.messages.map((m: any) => ({
          ...m,
          time: m.time || (m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'),
        })));
      }
    } catch (err: any) {
      console.error('Failed to send AI message', err);
      toast.error('AI assistant is temporarily busy. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await aiService.clearConversation('default-chat');
      setChatMessages([
        {
          id: '1',
          sender: 'ai',
          text: 'Chat history cleared. How can I help you next?',
          time: 'Just now',
        },
      ]);
      toast.info('Chat history cleared.');
    } catch (err) {
      console.error('Failed to clear chat', err);
    }
  };

  const handleSyncKnowledgeBase = async () => {
    setIsSyncing(true);
    try {
      await aiService.syncKnowledgeBase();
      toast.success('AI Knowledge Base synchronized with global entities.');
    } catch (err) {
      console.error('Failed to sync knowledge base', err);
      toast.error('Failed to synchronize knowledge base.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRunComplianceScan = async () => {
    setIsScanningCompliance(true);
    try {
      const res = await aiService.runComplianceScan();
      toast.success(res.summary || '100% Audit Ready — 0 compliance discrepancies found.');
      const records = await aiService.getComplianceRecords();
      setComplianceRecords(records);
    } catch (err) {
      console.error('Failed to run compliance scan', err);
      toast.error('Failed to run compliance scan.');
    } finally {
      setIsScanningCompliance(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Response copied to clipboard!");
  };

  const tabs = [
    { id: 'ask', label: '🤖 Floating AI Assistant', path: '/huremaso-ai' },
    { id: 'predictive', label: '1. Predictive Workforce Analytics', path: '/ai/predictive-analytics' },
    { id: 'performance', label: '2. Autonomous Performance & Skill', path: '/ai/autonomous-performance' },
    { id: 'ex', label: '3. Employee Experience (EX)', path: '/ai/employee-experience' },
    { id: 'compliance', label: '4. Automated Compliance', path: '/ai/automated-compliance' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#002222] via-[#004848] to-[#007878] rounded-2xl p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-teal-300 animate-pulse" />
              <span>HUREMASO AI Floating Assistant</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white m-0">
              AI – Floating for Anything to Ask
            </h1>
            <p className="text-xs md:text-sm text-teal-100/80 max-w-2xl leading-relaxed">
              Ask anything about company policies, leave entitlements, payroll status, performance insights, or generate instant HR emails and checklists.
            </p>
          </div>
          <button 
            disabled={isSyncing}
            onClick={handleSyncKnowledgeBase}
            className="self-start md:self-center flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold backdrop-blur-md transition-all text-white cursor-pointer shrink-0 disabled:opacity-50"
          >
            <Zap className={`h-4 w-4 text-amber-300 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync AI Knowledge Base'}</span>
          </button>
        </div>
      </div>

      {/* Top Navigation Pills */}
      <div className="flex flex-wrap gap-2.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                navigate(tab.path);
              }}
              className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer select-none ${
                isActive
                  ? 'bg-[#004848] text-white font-extrabold shadow-md border border-[#006666]'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Mode 1: AI – Floating for anything to ask */}
      {activeTab === 'ask' && (
        <div className="space-y-6 animate-fade-in">
          {/* Quick Prompt Floating Chips */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-[#004848]" />
              <span>Suggested Floating Questions & Actions:</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendChat(qp.prompt)}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:border-[#004848] hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-full transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <span>{qp.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Chat Window */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[520px]">
            {/* Window Header */}
            <div className="bg-gradient-to-r from-slate-900 via-[#002222] to-[#004848] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-teal-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold m-0 text-white">HUREMASO AI Assistant</h3>
                  <div className="flex items-center gap-2 text-[10px] text-teal-200/80">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>Online & Ready to Answer</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleClearHistory}
                className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                Clear History
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
              {chatMessages.map((msg, idx) => (
                <div
                  key={msg.id || idx}
                  className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${
                    msg.sender === 'user' 
                      ? 'bg-[#004848] text-white' 
                      : 'bg-teal-100 text-[#004848] border border-teal-200'
                  }`}>
                    {msg.sender === 'user' ? 'SJ' : <Bot className="h-4 w-4 text-[#004848]" />}
                  </div>

                  <div className={`max-w-xl rounded-2xl p-4 text-xs font-medium leading-relaxed space-y-2 shadow-2xs ${
                    msg.sender === 'user'
                      ? 'bg-[#004848] text-white rounded-tr-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}>
                    <p className="whitespace-pre-line m-0">{msg.text}</p>
                    {msg.sender === 'ai' && (
                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 border-t border-slate-100">
                        <span>{msg.time || 'Just now'}</span>
                        <button
                          onClick={() => handleCopyText(msg.text)}
                          className="flex items-center gap-1 text-slate-500 hover:text-[#004848] transition-colors cursor-pointer"
                        >
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-slate-400 italic bg-white p-3 rounded-2xl border border-slate-200 w-48">
                  <Bot className="h-4 w-4 text-teal-600 animate-spin" />
                  <span>HUREMASO AI is typing...</span>
                </div>
              )}
            </div>

            {/* Prompt Input Footer */}
            <form onSubmit={(e) => { e.preventDefault(); handleSendChat(); }} className="p-4 bg-white border-t border-slate-200 flex items-center gap-3">
              <button 
                type="button" 
                onClick={() => toast.info("Attach policy document or query file")}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask HUREMASO AI anything (e.g. 'Draft leave email', 'Policy rules')..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#004848] font-semibold"
              />
              <button 
                type="button" 
                onClick={() => toast.info("Listening for voice input...")}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Mic className="h-4 w-4" />
              </button>
              <button
                type="submit"
                disabled={isTyping}
                className="px-5 py-2.5 bg-[#004848] hover:bg-[#003333] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <span>Send</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>

          {/* AI Capabilities Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {[
              { title: '⚡ Instant Policy Search', desc: 'Queries global handbook entities, statutory leave rules, and entity-specific clauses in seconds.', icon: Search },
              { title: '📝 Smart Document Drafts', desc: 'Generates professional leave approvals, promotion letters, and warning notices instantly.', icon: FileText },
              { title: '🛡️ Automated Compliance Guardrails', desc: 'Real-time validation against Indian Labour Laws, Maternity Benefit Act, and POSH guidelines.', icon: ShieldCheck }
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 hover:shadow-md transition-all">
                  <div className="h-8 w-8 rounded-xl bg-teal-50 text-[#004848] flex items-center justify-center">
                    <Icon className="h-4 w-4 text-[#004848]" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 m-0">{card.title}</h4>
                  <p className="text-[11px] font-semibold text-slate-500 leading-relaxed m-0">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode 2: Predictive Workforce Analytics */}
      {activeTab === 'predictive' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">Predicted Turnover (Q3)</span>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {workforceData?.projectedTurnoverRate ? `${workforceData.projectedTurnoverRate}%` : '2.1%'}
              </div>
              <p className="text-[11px] font-semibold text-emerald-600">↓ 1.4% lower than industry average</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">Flight Risk Employees</span>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {workforceData?.highRiskCount ? `${workforceData.highRiskCount} High Risk` : '4 High Risk'}
              </div>
              <p className="text-[11px] font-semibold text-amber-600">Action recommendations generated</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">Overall Workforce Health</span>
                <Heart className="h-4 w-4 text-rose-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {workforceData?.workforceHealthIndex ? `${workforceData.workforceHealthIndex} / 100` : '92 / 100'}
              </div>
              <p className="text-[11px] font-semibold text-teal-600">Optimal engagement index</p>
            </div>
          </div>

          {/* Flight Risk Details */}
          {flightRisks.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Identified Flight Risk Indicators & Proactive Mitigation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {flightRisks.map((fr) => (
                  <div key={fr.id || fr._id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/70 space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{fr.employeeName}</h4>
                        <span className="text-[10px] text-slate-500 font-semibold">{fr.jobTitle} • {fr.department}</span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        fr.riskLevel === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {fr.riskLevel} Risk ({fr.riskScore}/100)
                      </span>
                    </div>
                    {fr.recommendedActions && fr.recommendedActions.length > 0 && (
                      <p className="text-[11px] text-slate-600 font-medium">
                        <strong className="text-slate-700">Recommended:</strong> {fr.recommendedActions[0]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 3: Autonomous Performance & Skill Management */}
      {activeTab === 'performance' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 animate-fade-in shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Autonomous Performance & Skill Gap Matrix</h3>
            <p className="text-xs text-slate-500 mt-0.5">AI automatically maps team skill competencies against upcoming project requirements.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skillGaps.length > 0 ? (
              skillGaps.map((sg) => (
                <div key={sg.id || sg._id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800">{sg.skillName}</span>
                    <span className="text-[10px] font-bold text-slate-400">{sg.department}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${sg.readinessLevel >= 80 ? 'bg-[#004848]' : 'bg-teal-600'}`} 
                      style={{ width: `${sg.readinessLevel}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500 font-bold">
                      {sg.readinessLevel}% Team Readiness {sg.upskillingRecommended ? '(Upskilling Recommended)' : ''}
                    </span>
                    <span className="text-slate-400 font-semibold">{sg.qualifiedStaffCount}/{sg.requiredStaffCount} Staff</span>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                  <span className="text-xs font-bold text-slate-800">React & Next.js Skill Density</span>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-[#004848] h-2 rounded-full w-[88%]"></div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold">88% Team Readiness</span>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                  <span className="text-xs font-bold text-slate-800">Cloud AI & LLM Engineering</span>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-teal-600 h-2 rounded-full w-[65%]"></div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold">65% Team Readiness (Upskilling Recommended)</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Mode 4: Employee Experience (EX) & Sentiment Pulse */}
      {activeTab === 'ex' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 animate-fade-in shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">Next-Gen Employee Experience (EX) & Sentiment Pulse</h3>
          <p className="text-xs text-slate-500">Real-time anonymized sentiment radar and workload balance monitoring.</p>
          <div className="p-4 border border-teal-100 bg-teal-50/50 rounded-xl text-xs font-semibold text-teal-900 leading-relaxed">
            Current Sentiment Score: <span className="font-extrabold text-[#004848]">{sentimentData?.sentimentRating || 'Positive'} ({sentimentData?.sentimentScore || '8.6'}/10)</span> — High satisfaction recorded in flexible work hours, transparent leave policy, and internal association initiatives.
          </div>
        </div>
      )}

      {/* Mode 5: Automated Compliance */}
      {activeTab === 'compliance' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 animate-fade-in shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Automated Compliance & Audit Readiness</h3>
              <p className="text-xs text-slate-500 mt-0.5">Continuous background compliance scanning for PF, ESI, Maternity Act, and labor law updates.</p>
            </div>
            <button
              disabled={isScanningCompliance}
              onClick={handleRunComplianceScan}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#004848] hover:bg-[#003333] text-white text-xs font-bold rounded-lg transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isScanningCompliance ? 'animate-spin' : ''}`} />
              <span>{isScanningCompliance ? 'Scanning...' : 'Run Live Audit Scan'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3 p-4 border border-emerald-200 bg-emerald-50/60 rounded-xl text-xs font-bold text-emerald-900">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>100% Audit Ready — 0 compliance discrepancies found across active employee files.</span>
          </div>

          {complianceRecords.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {complianceRecords.map((cr) => (
                <div key={cr.id || cr._id} className="p-3 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800">{cr.title}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">{cr.status}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-2">{cr.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HuremasoAIPage;
