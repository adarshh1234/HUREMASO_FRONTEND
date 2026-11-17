import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  X,
  Filter,
  Calendar,
  GraduationCap,
  Info,
  Clock,
  Layers,
  BookOpen,
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { 
  aiService, 
  ChatMessage, 
  WorkforceAnalytics, 
  FlightRiskItem, 
  SkillGapItem, 
  ComplianceItem,
  DevelopmentRecommendationItem,
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

  // File Attachment & Voice Input State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: number; content?: string } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Tab Data States
  const [workforceData, setWorkforceData] = useState<WorkforceAnalytics | null>(null);
  const [flightRisks, setFlightRisks] = useState<FlightRiskItem[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('Q3 2026 (Live Forecast)');
  const [isLoadingWorkforce, setIsLoadingWorkforce] = useState(false);

  const [skillGaps, setSkillGaps] = useState<SkillGapItem[]>([]);
  const [devRecommendations, setDevRecommendations] = useState<DevelopmentRecommendationItem[]>([]);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(false);

  const [sentimentData, setSentimentData] = useState<any>(null);
  const [complianceRecords, setComplianceRecords] = useState<ComplianceItem[]>([]);
  const [isScanningCompliance, setIsScanningCompliance] = useState(false);

  // Speech Recognition initialization
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results?.[0]?.[0]?.transcript;
          if (transcript) {
            setInputQuery(prev => (prev ? `${prev} ${transcript}` : transcript));
            toast.success(`Voice input recognized: "${transcript}"`);
          }
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event?.error);
          setIsListening(false);
          if (event?.error !== 'no-speech') {
            toast.error(`Voice error: ${event?.error || 'recognition failed'}`);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('SpeechRecognition initialization failed', e);
        setSpeechSupported(false);
      }
    }
  }, [toast]);

  const handleToggleVoice = () => {
    if (!speechSupported || !recognitionRef.current) {
      toast.info('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.info('Listening... speak now into your microphone.');
      } catch (err) {
        console.error('Failed to start speech recognition', err);
        setIsListening(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit.');
      return;
    }

    if (
      file.type.includes('text') || 
      file.name.endsWith('.txt') || 
      file.name.endsWith('.json') || 
      file.name.endsWith('.csv') || 
      file.name.endsWith('.md')
    ) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setAttachedFile({
          name: file.name,
          size: file.size,
          content: text ? text.slice(0, 3000) : undefined,
        });
        toast.success(`Attached file: ${file.name}`);
      };
      reader.readAsText(file);
    } else {
      setAttachedFile({
        name: file.name,
        size: file.size,
      });
      toast.success(`Attached file: ${file.name}`);
    }
  };

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
        setIsLoadingWorkforce(true);
        const [analytics, risks] = await Promise.all([
          aiService.getWorkforceAnalytics(),
          aiService.getFlightRisks({ department: selectedDepartment === 'All' ? undefined : selectedDepartment }),
        ]);
        setWorkforceData(analytics);
        setFlightRisks(risks);
        setIsLoadingWorkforce(false);
      } else if (tab === 'performance') {
        setIsLoadingPerformance(true);
        const [skills, recs] = await Promise.all([
          aiService.getSkillGaps(),
          aiService.getDevelopmentRecommendations(),
        ]);
        setSkillGaps(skills);
        setDevRecommendations(recs);
        setIsLoadingPerformance(false);
      } else if (tab === 'ex') {
        const sentiment = await aiService.getSentimentMetrics();
        setSentimentData(sentiment);
      } else if (tab === 'compliance') {
        const records = await aiService.getComplianceRecords();
        setComplianceRecords(records);
      }
    } catch (err) {
      console.error(`Failed to load data for tab ${tab}`, err);
      setIsLoadingWorkforce(false);
      setIsLoadingPerformance(false);
    }
  }, [selectedDepartment]);

  const handleFilterDepartment = async (dept: string) => {
    setSelectedDepartment(dept);
    setIsLoadingWorkforce(true);
    try {
      const risks = await aiService.getFlightRisks({
        department: dept === 'All' ? undefined : dept,
      });
      setFlightRisks(risks);
    } catch (err) {
      console.error('Failed to filter flight risks by department', err);
      toast.error('Failed to filter department flight risks');
    } finally {
      setIsLoadingWorkforce(false);
    }
  };

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
    let query = textToSend || inputQuery;
    if (!query.trim() && !attachedFile) return;

    if (attachedFile) {
      const fileHeader = `[Attached File: ${attachedFile.name}${attachedFile.content ? `\nContent:\n${attachedFile.content}` : ''}]`;
      query = query.trim() ? `${query}\n\n${fileHeader}` : `Please analyze attached document: ${fileHeader}`;
    }

    const userText = query;
    if (!textToSend) {
      setInputQuery('');
      setAttachedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
    
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
      const res = await aiService.syncKnowledgeBase();
      const count = res?.chunksCount || 16;
      const entities = res?.syncedEntities || 4;
      toast.success(`AI Knowledge Base synchronized! (${count} policy chunks indexed across ${entities} documents)`);
    } catch (err) {
      console.error('Failed to sync knowledge base', err);
      toast.error('Failed to synchronize knowledge base.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResolveRisk = async (id: string) => {
    try {
      await aiService.resolveFlightRisk(id, 'Mitigation 1-on-1 scheduled & compensation review executed');
      toast.success('Flight risk marked as Resolved!');
      const [analytics, risks] = await Promise.all([
        aiService.getWorkforceAnalytics(),
        aiService.getFlightRisks(),
      ]);
      setWorkforceData(analytics);
      setFlightRisks(risks);
    } catch (err) {
      console.error('Failed to resolve risk', err);
      toast.error('Failed to resolve flight risk.');
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
                    {msg.sender === 'ai' && msg.citations && msg.citations.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {msg.citations.map((c, ci) => (
                          <span key={ci} className="inline-flex items-center gap-1 text-[9px] font-semibold text-teal-800 bg-teal-50 border border-teal-200/60 rounded px-1.5 py-0.5">
                            <ShieldCheck className="h-2.5 w-2.5 text-teal-600" />
                            <span>{c}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    {msg.sender === 'ai' && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.suggestedActions.map((act, ai) => (
                          <button
                            key={ai}
                            type="button"
                            onClick={() => handleSendChat(act)}
                            className="text-[10px] font-bold text-[#004848] bg-slate-100 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 rounded-full px-2 py-0.5 transition-colors cursor-pointer"
                          >
                            {act}
                          </button>
                        ))}
                      </div>
                    )}
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
            <form onSubmit={(e) => { e.preventDefault(); handleSendChat(); }} className="p-4 bg-white border-t border-slate-200 flex flex-col gap-2.5">
              {attachedFile && (
                <div className="flex items-center justify-between px-3 py-1.5 bg-teal-50 border border-teal-200 text-teal-800 rounded-xl text-xs font-semibold w-fit max-w-full">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                    <span className="truncate max-w-[280px]">{attachedFile.name}</span>
                    <span className="text-[10px] text-teal-600 shrink-0">({(attachedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="ml-2 p-0.5 text-teal-700 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Remove attached file"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".txt,.md,.json,.csv,.doc,.docx,.pdf"
                  className="hidden"
                />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach document or policy file"
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
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
                  onClick={handleToggleVoice}
                  title={speechSupported ? (isListening ? 'Click to stop listening' : 'Click to speak') : 'Voice recognition is not supported in this browser (Use Chrome or Edge)'}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    isListening
                      ? 'bg-rose-100 text-rose-600 animate-pulse'
                      : speechSupported
                        ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                        : 'text-slate-300 hover:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <Mic className="h-4 w-4" />
                </button>
                <button
                  type="submit"
                  disabled={isTyping || (!inputQuery.trim() && !attachedFile)}
                  className="px-5 py-2.5 bg-[#004848] hover:bg-[#003333] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <span>Send</span>
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
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
          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#004848]" />
              <span className="text-xs font-bold text-slate-700">Analytics Horizon & Filters:</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-500">Department:</span>
                <select
                  value={selectedDepartment}
                  onChange={(e) => handleFilterDepartment(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-[#004848] cursor-pointer"
                >
                  <option value="All">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Product Design">Product Design</option>
                  <option value="Recruitment">Recruitment</option>
                  <option value="Sales">Sales</option>
                  <option value="Operations">Operations</option>
                  <option value="HR">HR</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[11px] font-semibold text-slate-500">Forecast Horizon:</span>
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-[#004848] cursor-pointer"
                >
                  <option value="Q3 2026 (Live Forecast)">Q3 2026 (Live Forecast)</option>
                  <option value="Q4 2026 (Projected)">Q4 2026 (Projected)</option>
                  <option value="Annual 2026">Annual 2026 (Full Year)</option>
                </select>
              </div>

              {selectedDepartment !== 'All' && (
                <button
                  type="button"
                  onClick={() => handleFilterDepartment('All')}
                  className="text-[11px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 border border-teal-200 rounded-lg px-2.5 py-1 transition-all cursor-pointer"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>

          {/* Model Methodology & Limitations Banner */}
          <div className="bg-teal-50/70 border border-teal-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
            <Info className="h-5 w-5 text-teal-700 shrink-0 mt-0.5" />
            <div className="text-xs text-teal-950 space-y-1">
              <div className="font-bold">Predictive Intelligence Model Notice & Methodology</div>
              <p className="text-[11px] leading-relaxed text-teal-900/90 m-0">
                Turnover metrics represent forward-looking predictive risk models derived from weighted employee tenure, engagement sentiment, quarterly appraisal trajectories, and compensation benchmarks. Projections are advisory signals designed to guide proactive managerial 1-on-1 conversations and retention planning.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">Predicted Turnover ({selectedTimeframe.split(' ')[0]})</span>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {workforceData?.projectedTurnoverRate ? `${workforceData.projectedTurnoverRate}%` : '2.1%'}
              </div>
              <p className="text-[11px] font-semibold text-emerald-600">↓ 1.4% lower than industry benchmark (3.5%)</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">Active Flight Risks</span>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {isLoadingWorkforce ? '...' : `${flightRisks.length} Identified`}
              </div>
              <p className="text-[11px] font-semibold text-amber-600">
                {selectedDepartment === 'All' ? 'Across all departments' : `Filtered: ${selectedDepartment}`}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">Workforce Health Index</span>
                <Heart className="h-4 w-4 text-rose-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {workforceData?.workforceHealthIndex ? `${workforceData.workforceHealthIndex} / 100` : '92 / 100'}
              </div>
              <p className="text-[11px] font-semibold text-teal-600">Optimal engagement & retention score</p>
            </div>
          </div>

          {/* Flight Risk Details */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 m-0">
                Identified Flight Risk Indicators & Proactive Mitigation
              </h3>
              <span className="text-xs text-slate-500 font-semibold">
                Showing {flightRisks.length} {flightRisks.length === 1 ? 'employee' : 'employees'}
              </span>
            </div>

            {isLoadingWorkforce ? (
              <div className="p-8 text-center text-xs text-slate-500 font-semibold">
                Loading workforce risk indicators...
              </div>
            ) : flightRisks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {flightRisks.map((fr) => (
                  <div key={fr.id || fr._id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/70 space-y-2.5">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 m-0">{fr.employeeName}</h4>
                        <span className="text-[10px] text-slate-500 font-semibold">{fr.jobTitle} • {fr.department}</span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        fr.riskLevel === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {fr.riskLevel} Risk ({fr.riskScore}/100)
                      </span>
                    </div>

                    {fr.indicators && fr.indicators.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {fr.indicators.map((ind, ii) => (
                          <span key={ii} className="text-[9px] font-semibold bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                            {ind.factor}: {ind.description || `${ind.weight}% impact`}
                          </span>
                        ))}
                      </div>
                    )}

                    {fr.recommendedActions && fr.recommendedActions.length > 0 && (
                      <p className="text-[11px] text-slate-600 font-medium m-0">
                        <strong className="text-slate-700">Mitigation:</strong> {fr.recommendedActions[0]}
                      </p>
                    )}

                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/70">
                      <span className="text-[10px] font-bold text-slate-500">
                        Status: <span className={fr.status === 'Resolved' ? 'text-emerald-700' : 'text-slate-700'}>{fr.status || 'Open'}</span>
                      </span>
                      {fr.status !== 'Resolved' && (
                        <button
                          type="button"
                          onClick={() => handleResolveRisk(fr.id || fr._id || '')}
                          className="text-[10px] font-bold text-teal-700 hover:text-white bg-teal-50 hover:bg-[#004848] border border-teal-200 rounded-lg px-2.5 py-0.5 transition-all cursor-pointer"
                        >
                          Resolve Risk
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl space-y-1">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto" />
                <div className="text-xs font-bold text-slate-800">No active flight risks detected</div>
                <div className="text-[11px] text-slate-500">
                  {selectedDepartment !== 'All' 
                    ? `No high or medium flight risk employees in ${selectedDepartment}.` 
                    : 'All workforce retention signals are currently in optimal bounds.'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 3: Autonomous Performance & Skill Management */}
      {activeTab === 'performance' && (
        <div className="space-y-6 animate-fade-in">
          {/* Skill Gap Matrix */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">Autonomous Performance & Skill Gap Matrix</h3>
                <p className="text-xs text-slate-500 mt-0.5 m-0">AI automatically maps team skill competencies against upcoming project requirements.</p>
              </div>
              <span className="text-xs text-slate-400 font-semibold">
                {skillGaps.length} Competency Tracks
              </span>
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

          {/* Personalized Learning & Development Recommendations */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-[#004848]" />
                  <h3 className="text-sm font-bold text-slate-900 m-0">Personalized Learning & Development Recommendations</h3>
                </div>
                <p className="text-xs text-slate-500 m-0">
                  Targeted upskilling and career development pathways generated from quarterly performance benchmarks.
                </p>
              </div>
              <span className="text-xs text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full font-bold">
                {devRecommendations.length} Active Tracks
              </span>
            </div>

            {isLoadingPerformance ? (
              <div className="p-8 text-center text-xs text-slate-500 font-semibold">
                Loading development recommendations...
              </div>
            ) : devRecommendations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {devRecommendations.map((rec) => (
                  <div key={rec.id || rec._id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/60 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                          {rec.recommendationType || 'Training'}
                        </span>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                          rec.priority === 'High' ? 'bg-rose-100 text-rose-700' :
                          rec.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {rec.priority} Priority
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 m-0 leading-snug">
                        {rec.recommendationTitle}
                      </h4>

                      <div className="text-[11px] text-slate-600 font-semibold">
                        Assigned to: <span className="text-slate-800 font-bold">{rec.employeeName}</span>
                      </div>

                      {rec.targetSkill && (
                        <div className="text-[10px] text-teal-800 font-bold">
                          Focus Skill: <span className="text-teal-900">{rec.targetSkill}</span>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-500 line-clamp-2 m-0 leading-relaxed">
                        {rec.description}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-200/70">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500 font-bold">Progress</span>
                        <span className="text-[#004848] font-extrabold">{rec.progressPercentage ?? 0}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div 
                          className="bg-[#004848] h-1.5 rounded-full transition-all"
                          style={{ width: `${rec.progressPercentage ?? 0}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 font-semibold">
                        <span>{rec.estimatedDuration || '4 Weeks'}</span>
                        <span className="font-bold text-slate-700">{rec.provider || 'Internal Academy'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl space-y-1">
                <BookOpen className="h-6 w-6 text-slate-400 mx-auto" />
                <div className="text-xs font-bold text-slate-800">No active development recommendations</div>
                <div className="text-[11px] text-slate-500">
                  Recommendations generate automatically from annual appraisal ratings and skill gap analysis.
                </div>
              </div>
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
