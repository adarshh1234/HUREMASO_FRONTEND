import React, { useState, useEffect } from 'react';
import { useToast } from '../../../hooks/useToast';
import adminService from '../../../services/adminService';

export const EmailConfigTab: React.FC = () => {
  const toast = useToast();
  const [mailSentAs, setMailSentAs] = useState('admin@huremaso.org');
  const [mailMethod, setMailMethod] = useState<'secure' | 'smtp' | 'sendmail'>('smtp');
  const [sendmailPathToggled, setSendmailPathToggled] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminService.getConfiguration()
      .then((cfg) => {
        if (cfg?.emailConfig) {
          if (cfg.emailConfig.sendAsEmail) setMailSentAs(cfg.emailConfig.sendAsEmail);
          if (cfg.emailConfig.mailSentEngine) {
            const engine = cfg.emailConfig.mailSentEngine.toLowerCase();
            if (engine === 'smtp' || engine === 'secure' || engine === 'sendmail') {
              setMailMethod(engine);
            }
          }
          if (cfg.emailConfig.sendmailPathToggled !== undefined) {
            setSendmailPathToggled(!!cfg.emailConfig.sendmailPathToggled);
          }
        }
      })
      .catch(() => { });
  }, []);

  const handleResetEmail = () => {
    setMailSentAs('admin@huremaso.org');
    setMailMethod('smtp');
    setSendmailPathToggled(false);
    toast.info("Email settings reset to defaults.");
  };

  const handleSendTestMail = async () => {
    const target = testEmailAddress.trim() || mailSentAs.trim();
    if (!target) {
      toast.error('Recipient email address is required for test email.');
      return;
    }
    setTestingEmail(true);
    try {
      const res = await adminService.testEmail({
        sendAsEmail: target,
        mailSentEngine: mailMethod.toUpperCase(),
      });
      toast.success(res.message || 'Test email dispatched successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to dispatch test email.');
    } finally {
      setTestingEmail(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminService.updateConfiguration({
        emailConfig: {
          sendAsEmail: mailSentAs,
          mailSentEngine: mailMethod.toUpperCase(),
          sendmailPathToggled,
        },
      });
      toast.success("Email Configuration saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save email configuration");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-slate-900 m-0">Email Configuration</h2>

      <div className="bg-white border border-slate-205 rounded-xl p-6 shadow-sm space-y-6">

        {/* Mail Sent As & Radio group */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs font-bold text-slate-705">
          {/* Mail Sent As input */}
          <div className="space-y-4">
            <div>
              <label className="block mb-2">Mail Sent As</label>
              <input
                type="email"
                value={mailSentAs}
                onChange={(e) => setMailSentAs(e.target.value)}
                className="w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none font-semibold text-xs bg-white"
              />
            </div>

            <div>
              <label className="block mb-2">Path to Sendmail</label>
              <span className="block text-slate-400 font-semibold mb-2">/usr/sbin/sendmail -bs</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span>Send Test Mail</span>
                <button
                  type="button"
                  onClick={() => setSendmailPathToggled(!sendmailPathToggled)}
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 duration-300 ease-in-out cursor-pointer ${sendmailPathToggled ? 'bg-[#004848]' : 'bg-gray-300'
                    }`}
                >
                  <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform duration-300 ease-in-out ${sendmailPathToggled ? 'translate-x-4' : ''
                    }`} />
                </button>
              </div>

              {sendmailPathToggled && (
                <div className="flex items-center gap-2 pt-1 max-w-md">
                  <input
                    type="email"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    placeholder={mailSentAs || "test@example.com"}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSendTestMail}
                    disabled={testingEmail}
                    className="px-3 py-1.5 bg-[#004848] text-white text-xs font-bold rounded-lg hover:bg-[#003333] cursor-pointer disabled:opacity-50"
                  >
                    {testingEmail ? 'Sending...' : 'Send Test'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Radio Group options */}
          <div className="space-y-2">
            <label className="block mb-4">Sending Method</label>
            <div className="flex items-center gap-6">
              {/* Secure SMTP */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="mailMethod"
                  checked={mailMethod === 'secure'}
                  onChange={() => setMailMethod('secure')}
                  className="text-blue-600 focus:ring-blue-400 h-4 w-4 border-slate-300"
                />
                <span>SECURE SMTP</span>
              </label>

              {/* SMTP */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="mailMethod"
                  checked={mailMethod === 'smtp'}
                  onChange={() => setMailMethod('smtp')}
                  className="text-blue-600 focus:ring-blue-400 h-4 w-4 border-slate-300"
                />
                <span>SMTP</span>
              </label>

              {/* Sendmail */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="mailMethod"
                  checked={mailMethod === 'sendmail'}
                  onChange={() => setMailMethod('sendmail')}
                  className="text-blue-600 focus:ring-blue-400 h-4 w-4 border-slate-300"
                />
                <span>Sendmail</span>
              </label>
            </div>
          </div>
        </div>

      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={handleResetEmail}
          className="px-6 py-2 border border-[#0473b8] bg-white hover:bg-blue-50/50 text-[#0473b8] text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
};

export default EmailConfigTab;
