import React, { useState, useEffect } from 'react';
import { FileText, Sparkles, Download, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import Modal from '../../components/common/Modal';
import { hrLetterService, CommunicationItem, IssuedLetterItem } from '../../services/hrLetterService';

export const HrLettersMemosPage: React.FC = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'memo' | 'notice' | 'circular' | 'letter'>('memo');
  const [communications, setCommunications] = useState<CommunicationItem[]>([]);
  const [letters, setLetters] = useState<IssuedLetterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatedDraft, setGeneratedDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'letter') {
        const list = await hrLetterService.getRecords();
        if (!list || list.length === 0) {
          const sample = await hrLetterService.createRecord({
            employeeId: 'EMP2024001',
            letterType: 'Experience & Conduct Certificate',
            subject: 'Experience Certificate – Sarah Johnson',
            content: 'This is to certify Sarah Johnson was employed as a Senior Engineer with exceptional dedication and conduct.',
            status: 'Issued',
          });
          setLetters([sample]);
        } else {
          setLetters(list);
        }
      } else {
        const list = await hrLetterService.getCommunications({ type: activeTab });
        if (!list || list.length === 0) {
          const sample = await hrLetterService.createCommunication({
            title: activeTab === 'memo' ? 'Q3 Hybrid Work & Office Policy Update' : activeTab === 'notice' ? 'Labor Day Public Holiday Announcement' : 'Q4 Engineering Code Sprint & Hackathon',
            type: activeTab,
            content: `Official notice regarding company procedures for ${activeTab}. All team members are requested to adhere to the outlined guidelines.`,
            department: 'Engineering',
            author: 'HR Management',
            status: 'Published',
          });
          setCommunications([sample]);
        } else {
          setCommunications(list);
        }
      }
    } catch (err) {
      console.error('Failed to load communication data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleGenerateAi = (type: string) => {
    if (!aiPrompt.trim()) {
      toast.error('Please describe what you want to draft!');
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedDraft(`[AI DRAFTED ${type.toUpperCase()}]\n\nSubject: ${aiPrompt}\n\nDear Team,\n\nThis is an official ${type} issued by HR Management regarding "${aiPrompt}". Please review the details below and comply with all updated procedures.\n\nBest Regards,\nHR Operations Team`);
      toast.success(`AI ${type} drafted successfully!`);
    }, 600);
  };

  const handleSaveDraft = async () => {
    try {
      if (activeTab === 'letter') {
        await hrLetterService.createRecord({
          employeeId: 'EMP2024001',
          letterType: 'General HR Letter',
          subject: aiPrompt || 'HR Official Letter',
          content: generatedDraft,
          status: 'Issued',
        });
      } else {
        await hrLetterService.createCommunication({
          title: aiPrompt || `New ${activeTab.toUpperCase()}`,
          type: activeTab,
          content: generatedDraft,
          author: 'HR Management',
          status: 'Published',
        });
      }
      toast.success('Draft saved and published to records!');
      setShowAiModal(false);
      await loadData();
    } catch (err) {
      toast.error('Failed to save communication');
    }
  };

  const handleDeleteComm = async (id: string) => {
    try {
      await hrLetterService.deleteCommunication(id);
      toast.success('Item deleted');
      await loadData();
    } catch (err) {
      toast.error('Failed to delete item');
    }
  };

  const handleDeleteLetter = async (id: string) => {
    try {
      await hrLetterService.deleteRecord(id);
      toast.success('Letter record deleted');
      await loadData();
    } catch (err) {
      toast.error('Failed to delete letter');
    }
  };

  // Functional Document Downloads
  const handleDownloadCommunication = (item: CommunicationItem) => {
    const typeLabel = item.type === 'memo'
      ? 'MEMORANDUM'
      : item.type === 'notice'
      ? 'OFFICIAL NOTICE'
      : item.type === 'circular'
      ? 'DEPARTMENT CIRCULAR'
      : 'OFFICIAL HR CORRESPONDENCE';

    const docDate = item.issuedDate
      ? new Date(item.issuedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const safeTitle = (item.title || 'Communication').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${item.type.toUpperCase()}_${safeTitle}.html`;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${item.title || typeLabel}</title>
  <style>
    @media print {
      .no-print { display: none !important; }
      body { padding: 0; background: white; }
      .doc-container { box-shadow: none !important; border: none !important; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #1e293b;
      margin: 0;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .no-print-bar {
      width: 100%;
      max-width: 800px;
      margin-bottom: 16px;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    .print-btn {
      background: #004848;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      font-size: 14px;
    }
    .doc-container {
      width: 100%;
      max-width: 800px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      padding: 48px;
      box-sizing: border-box;
    }
    .header {
      border-bottom: 3px solid #004848;
      padding-bottom: 20px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .company-title {
      font-size: 22px;
      font-weight: 800;
      color: #004848;
      margin: 0;
      letter-spacing: 0.5px;
    }
    .company-sub {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge {
      background: #004848;
      color: white;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      background: #f1f5f9;
      padding: 16px 20px;
      border-radius: 8px;
      margin-bottom: 28px;
      font-size: 13px;
    }
    .meta-item {
      display: flex;
      flex-direction: column;
    }
    .meta-label {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .meta-val {
      font-weight: 600;
      color: #0f172a;
    }
    .doc-title {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 20px;
      line-height: 1.4;
    }
    .doc-body {
      font-size: 14px;
      line-height: 1.8;
      color: #334155;
      white-space: pre-wrap;
      margin-bottom: 40px;
      min-height: 160px;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 12px;
      color: #64748b;
    }
    .signature-line {
      width: 200px;
      border-top: 1px dashed #94a3b8;
      margin-top: 40px;
      padding-top: 6px;
      text-align: center;
      font-weight: 600;
      color: #334155;
    }
  </style>
</head>
<body>
  <div class="no-print-bar no-print">
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div class="doc-container">
    <div class="header">
      <div>
        <h1 class="company-title">HUREMASO GLOBAL</h1>
        <div class="company-sub">Human Resources & Corporate Governance</div>
      </div>
      <div class="badge">${typeLabel}</div>
    </div>
    
    <div class="meta-grid">
      <div class="meta-item">
        <span class="meta-label">Subject / Title</span>
        <span class="meta-val">${item.title}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Date Issued</span>
        <span class="meta-val">${docDate}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Department / Scope</span>
        <span class="meta-val">${item.department || item.targetAudience || 'All Organization'}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Issued By</span>
        <span class="meta-val">${item.author || 'HR Operations Team'}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Status</span>
        <span class="meta-val">${item.status}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Document ID</span>
        <span class="meta-val">${item.id || item._id || 'COMM-2026'}</span>
      </div>
    </div>

    <h2 class="doc-title">${item.title}</h2>
    <div class="doc-body">${item.content || 'No additional content provided.'}</div>

    <div class="footer">
      <div>
        <div><strong>Corporate HR Administration</strong></div>
        <div>Official Communication • Confidential</div>
      </div>
      <div class="signature-line">
        Authorized Signatory
      </div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${item.type} document (${filename})`);
  };

  const handleDownloadLetter = (item: IssuedLetterItem) => {
    const docDate = item.issuedDate
      ? new Date(item.issuedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const safeTitle = (item.subject || item.letterType || 'Letter').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `HR_LETTER_${safeTitle}.html`;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${item.subject || item.letterType}</title>
  <style>
    @media print {
      .no-print { display: none !important; }
      body { padding: 0; background: white; }
      .doc-container { box-shadow: none !important; border: none !important; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #1e293b;
      margin: 0;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .no-print-bar {
      width: 100%;
      max-width: 800px;
      margin-bottom: 16px;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    .print-btn {
      background: #004848;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      font-size: 14px;
    }
    .doc-container {
      width: 100%;
      max-width: 800px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      padding: 48px;
      box-sizing: border-box;
    }
    .header {
      border-bottom: 3px solid #004848;
      padding-bottom: 20px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .company-title {
      font-size: 22px;
      font-weight: 800;
      color: #004848;
      margin: 0;
      letter-spacing: 0.5px;
    }
    .company-sub {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge {
      background: #004848;
      color: white;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      background: #f1f5f9;
      padding: 16px 20px;
      border-radius: 8px;
      margin-bottom: 28px;
      font-size: 13px;
    }
    .meta-item {
      display: flex;
      flex-direction: column;
    }
    .meta-label {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .meta-val {
      font-weight: 600;
      color: #0f172a;
    }
    .doc-title {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 20px;
      line-height: 1.4;
    }
    .doc-body {
      font-size: 14px;
      line-height: 1.8;
      color: #334155;
      white-space: pre-wrap;
      margin-bottom: 40px;
      min-height: 160px;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 12px;
      color: #64748b;
    }
    .signature-line {
      width: 200px;
      border-top: 1px dashed #94a3b8;
      margin-top: 40px;
      padding-top: 6px;
      text-align: center;
      font-weight: 600;
      color: #334155;
    }
  </style>
</head>
<body>
  <div class="no-print-bar no-print">
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div class="doc-container">
    <div class="header">
      <div>
        <h1 class="company-title">HUREMASO GLOBAL</h1>
        <div class="company-sub">Human Resources Management</div>
      </div>
      <div class="badge">${item.letterType || 'OFFICIAL HR LETTER'}</div>
    </div>
    
    <div class="meta-grid">
      <div class="meta-item">
        <span class="meta-label">Letter Type</span>
        <span class="meta-val">${item.letterType}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Date of Issue</span>
        <span class="meta-val">${docDate}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Recipient Employee ID</span>
        <span class="meta-val">${item.employeeId}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Issued By</span>
        <span class="meta-val">${item.issuedBy || 'HR Management'}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Status</span>
        <span class="meta-val">${item.status}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Document ID</span>
        <span class="meta-val">${item.id || item._id || 'LTR-2026'}</span>
      </div>
    </div>

    <h2 class="doc-title">${item.subject}</h2>
    <div class="doc-body">${item.content || 'Letter content.'}</div>

    <div class="footer">
      <div>
        <div><strong>Human Resources Department</strong></div>
        <div>Huremaso Global Enterprise • Official Document</div>
      </div>
      <div class="signature-line">
        Authorized Signature
      </div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded letter document (${filename})`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] rounded-2xl p-6 text-white shadow-md flex items-center justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-xs font-bold uppercase tracking-wider">
            <FileText className="h-3.5 w-3.5 text-teal-300" />
            <span>Official Communications</span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">HR Letters & Memos</h1>
          <p className="text-xs text-teal-100/80 m-0">Corporate memos, official notices, circulars, and AI-powered HR letter generation.</p>
        </div>
      </div>

      {/* Top Page UI Tabs */}
      <div className="flex flex-wrap gap-2.5 items-center border-b border-slate-200 pb-3 select-none">
        {[
          { id: 'memo' as const, label: 'Memo List' },
          { id: 'notice' as const, label: 'Notice List' },
          { id: 'circular' as const, label: 'Circulars List' },
          { id: 'letter' as const, label: 'HR Letters / Notes List' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#004848] text-white font-extrabold border-transparent shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 m-0">
            {activeTab === 'memo' && 'Corporate Memos'}
            {activeTab === 'notice' && 'Official HR Notices'}
            {activeTab === 'circular' && 'Department Circulars'}
            {activeTab === 'letter' && 'HR Letters & Official Notes'}
          </h3>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Manage official communications and automated drafts.
          </p>
        </div>
        <button 
          onClick={() => { setShowAiModal(true); setGeneratedDraft(''); setAiPrompt(''); }}
          className="px-4 py-2.5 bg-[#004848] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#006666] transition-all cursor-pointer flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4 text-teal-300" />
          <span>Draft with AI / API</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600 mr-2" />
          <span className="text-sm font-semibold text-slate-600">Loading communications...</span>
        </div>
      ) : activeTab === 'letter' ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
          {letters.map((item) => (
            <div key={item.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 m-0">{item.letterType}: {item.subject}</h4>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                  Recipient ID: {item.employeeId} • Date: {item.issuedDate ? new Date(item.issuedDate).toLocaleDateString() : 'Recent'} • Status: {item.status}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleDownloadLetter(item)}
                  className="px-3 py-1.5 bg-[#004848] text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-[#006666] flex items-center gap-1.5 transition-colors"
                  title="Download Official Letter"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => handleDeleteLetter(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
          {communications.map((item) => (
            <div key={item.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 m-0">{item.title}</h4>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                  Issued by: {item.author || 'HR'} • Dept: {item.department || 'All'} • Date: {item.issuedDate ? new Date(item.issuedDate).toLocaleDateString() : 'Recent'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold">
                  {item.status}
                </span>
                <button 
                  onClick={() => handleDownloadCommunication(item)}
                  className="p-1.5 text-slate-500 hover:text-[#004848] hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer"
                  title={`Download ${item.type} Document`}
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteComm(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Drafting Modal */}
      <Modal isOpen={showAiModal} onClose={() => setShowAiModal(false)} title={`Draft ${activeTab.toUpperCase()} with AI / API`}>
        <div className="space-y-4 text-xs font-semibold text-slate-700">
          <div>
            <label className="block mb-1.5 font-bold text-slate-900">Describe the topic or prompt for the draft:</label>
            <textarea
              rows={3}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Write an official memo regarding mandatory security awareness training..."
              className="w-full border border-slate-200 rounded-xl p-3 text-xs font-semibold outline-none focus:border-[#004848] resize-none"
            />
          </div>

          <button
            onClick={() => handleGenerateAi(activeTab)}
            disabled={isGenerating}
            className="w-full py-2.5 bg-[#004848] text-white text-xs font-bold rounded-xl hover:bg-[#006666] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isGenerating ? (
              <span>Drafting with AI Model...</span>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-teal-300" />
                <span>Generate Draft</span>
              </>
            )}
          </button>

          {generatedDraft && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <label className="block font-bold text-slate-900">Generated Draft Preview:</label>
              <textarea
                rows={6}
                value={generatedDraft}
                onChange={(e) => setGeneratedDraft(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold outline-none focus:border-[#004848] resize-none font-mono"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => setShowAiModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveDraft}
                  className="px-5 py-2 bg-[#004848] text-white font-bold rounded-xl hover:bg-[#006666] cursor-pointer"
                >
                  Save & Publish
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default HrLettersMemosPage;
