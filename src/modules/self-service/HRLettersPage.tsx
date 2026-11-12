import React, { useState, useEffect } from 'react';
import { Search, Share2, Copy, Send, Loader2, Plus, Download } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { hrLetterService, LetterTemplateItem } from '../../services/hrLetterService';

export const HRLettersPage: React.FC = () => {
  const toast = useToast();
  const [templates, setTemplates] = useState<LetterTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLetter, setSelectedLetter] = useState<string>('');
  const [editedSubject, setEditedSubject] = useState('');
  const [editedMessage, setEditedMessage] = useState('');
  const [bestRegards, setBestRegards] = useState('Best regards,\nHuman Resources Department\n[Company Name]');
  const [targetEmployeeId, setTargetEmployeeId] = useState('EMP2024001');
  const [searchTerm, setSearchTerm] = useState('');

  const defaultTemplates: Array<Omit<LetterTemplateItem, 'id'>> = [
    {
      name: 'Employment Confirmation Letter',
      category: 'Confirmation',
      subject: 'Employment Confirmation – {{employeeName}}',
      body: 'Dear {{employeeName}},\n\nWe are pleased to confirm your employment with {{companyName}} as a {{jobTitle}}, effective from {{joiningDate}}.\n\nYour performance during the probation period has been found satisfactory, and we look forward to your continued contribution to the organization. All terms and conditions of your employment remain unchanged.\n\nPlease feel free to reach out to HR for any further clarification.',
    },
    {
      name: 'Offer Letter',
      category: 'Offer',
      subject: 'Job Offer – {{employeeName}}',
      body: 'Dear {{employeeName}},\n\nWe are excited to offer you the position of {{jobTitle}} with {{companyName}}. We were very impressed by your skills and experience and believe you will be a valuable addition to our team...',
    },
    {
      name: 'Relieving Letter',
      category: 'Relieving',
      subject: 'Relieving Letter – {{employeeName}}',
      body: 'Dear {{employeeName}},\n\nThis is in reference to your resignation letter dated {{resignationDate}}. We would like to inform you that you are relieved from your services as {{jobTitle}} at the close of business hours on {{relievingDate}}...',
    },
    {
      name: 'Experience Certificate',
      category: 'Experience',
      subject: 'Experience Certificate – {{employeeName}}',
      body: 'To Whom It May Concern,\n\nThis is to certify that {{employeeName}} was employed with {{companyName}} as a {{jobTitle}} from {{startDate}} to {{endDate}}. During their tenure with us, we found them to be hard-working, honest, and dedicated to their duties...',
    },
  ];

  const loadTemplates = async () => {
    try {
      setLoading(true);
      let list = await hrLetterService.getTemplates();
      if (!list || list.length === 0) {
        for (const t of defaultTemplates) {
          await hrLetterService.createTemplate(t);
        }
        list = await hrLetterService.getTemplates();
      }
      setTemplates(list);
      if (list.length > 0) {
        setSelectedLetter(list[0].id);
        setEditedSubject(list[0].subject);
        setEditedMessage(list[0].body);
      }
    } catch (err) {
      console.error('Failed to load letter templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleSelectTemplate = (id: string) => {
    setSelectedLetter(id);
    const target = templates.find((t) => t.id === id);
    if (target) {
      setEditedSubject(target.subject);
      setEditedMessage(target.body);
    }
  };

  const handleSaveAndIssue = async () => {
    try {
      await hrLetterService.createRecord({
        employeeId: targetEmployeeId,
        templateId: selectedLetter,
        letterType: templates.find((t) => t.id === selectedLetter)?.name || 'HR Letter',
        subject: editedSubject,
        content: `${editedMessage}\n\n${bestRegards}`,
        status: 'Issued',
      });
      toast.success('Letter issued successfully and saved to records!');
    } catch (err) {
      toast.error('Failed to issue letter');
    }
  };

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownloadCurrentLetter = () => {
    const templateName = templates.find((t) => t.id === selectedLetter)?.name || 'HR Letter';
    const docDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const safeTitle = (editedSubject || templateName).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `HR_LETTER_${safeTitle}.html`;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${editedSubject || templateName}</title>
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
      <div class="badge">${templateName}</div>
    </div>
    
    <div class="meta-grid">
      <div class="meta-item">
        <span class="meta-label">Letter Type</span>
        <span class="meta-val">${templateName}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Date of Issue</span>
        <span class="meta-val">${docDate}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Target Employee ID</span>
        <span class="meta-val">${targetEmployeeId || 'N/A'}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Issued By</span>
        <span class="meta-val">HR Operations Team</span>
      </div>
    </div>

    <h2 class="doc-title">${editedSubject}</h2>
    <div class="doc-body">${editedMessage}

${bestRegards}</div>

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
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-900 m-0">HR Letter</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
          <span className="text-sm font-semibold text-slate-600">Loading templates...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <span className="block text-xs font-bold text-slate-700">Templates</span>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-slate-350"
              />
            </div>

            <div className="space-y-2 pt-2">
              {filteredTemplates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTemplate(t.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    selectedLetter === t.id
                      ? 'bg-blue-50 text-[#0473b8] border-blue-200 font-extrabold shadow-sm'
                      : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100">
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Target Employee ID</label>
              <input
                type="text"
                value={targetEmployeeId}
                onChange={(e) => setTargetEmployeeId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800"
                placeholder="EMP..."
              />
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <span className="block text-xs font-bold text-slate-700">Subject</span>
              <input
                type="text"
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-400"
              />
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <span className="block text-xs font-bold text-slate-700">Message Body</span>
              <textarea
                rows={10}
                value={editedMessage}
                onChange={(e) => setEditedMessage(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-3 text-xs font-semibold text-slate-800 outline-none focus:border-blue-400 resize-none font-mono"
              />
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <span className="block text-xs font-bold text-slate-700">Sign-off / Best Regards</span>
              <textarea
                rows={3}
                value={bestRegards}
                onChange={(e) => setBestRegards(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-3 text-xs font-semibold text-slate-800 outline-none focus:border-blue-400 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleDownloadCurrentLetter}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                title="Download Letter"
              >
                <Download className="h-4 w-4 text-[#004848]" />
                <span>Download</span>
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${editedSubject}\n\n${editedMessage}\n\n${bestRegards}`);
                  toast.success('Letter copied to clipboard!');
                }}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                <Copy className="h-4 w-4" />
                <span>Copy</span>
              </button>
              <button
                onClick={handleSaveAndIssue}
                className="flex items-center gap-1.5 px-5 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white text-xs font-bold rounded-lg cursor-pointer shadow-sm transition-colors"
              >
                <Send className="h-4 w-4" />
                <span>Issue & Send Letter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRLettersPage;
