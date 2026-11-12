import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { projectService, CustomerItem, ProjectItem } from '../../services/projectService';

interface CustomerRecord {
  id: string;
  customerName: string;
  project: string;
  projectAdmins: string;
}

export const ProjectInfoPage: React.FC = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'customers' | 'project'>('customers');
  const [loading, setLoading] = useState(true);

  // Customers state
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerDesc, setNewCustomerDesc] = useState('');
  const customerInputRef = useRef<HTMLInputElement>(null);

  // Projects state
  const [customerRecords, setCustomerRecords] = useState<CustomerRecord[]>([]);
  const [newProjCustName, setNewProjCustName] = useState('');
  const [newProjName, setNewProjName] = useState('');
  const [newProjAdmin, setNewProjAdmin] = useState('');
  const projectInputRef = useRef<HTMLInputElement>(null);

  // Project tab search states
  const [searchCustName, setSearchCustName] = useState('');
  const [searchProjName, setSearchProjName] = useState('');
  const [searchProjAdmin, setSearchProjAdmin] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [custList, projList] = await Promise.all([
        projectService.getCustomers(),
        projectService.getProjects(),
      ]);

      if (custList.length === 0) {
        const c1 = await projectService.createCustomer({ name: 'Acme Corp', description: 'Leading apparel manufacturing chain.' });
        const c2 = await projectService.createCustomer({ name: 'Global Tech', description: 'Enterprise software provider.' });
        setCustomers([c1, c2]);
      } else {
        setCustomers(custList);
      }

      if (projList.length === 0) {
        const p1 = await projectService.createProject({
          name: 'HR Portal 2026',
          customerName: 'Acme Corp',
          projectAdmins: ['John Doe'],
        });
        setCustomerRecords([{
          id: p1.id,
          customerName: p1.customerName || 'Acme Corp',
          project: p1.name,
          projectAdmins: (p1.projectAdmins || []).join(', ') || '-',
        }]);
      } else {
        setCustomerRecords(projList.map((p) => ({
          id: p.id,
          customerName: p.customerName || 'Acme Corp',
          project: p.name,
          projectAdmins: (p.projectAdmins || []).join(', ') || '-',
        })));
      }
    } catch (err) {
      console.error('Failed to load project/customer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Customer Form Submission
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) {
      toast.warning('Please enter customer name');
      return;
    }
    try {
      const created = await projectService.createCustomer({
        name: newCustomerName.trim(),
        description: newCustomerDesc.trim() || '-',
      });
      setCustomers((prev) => [...prev, created]);
      setNewCustomerName('');
      setNewCustomerDesc('');
      toast.success('Customer added successfully');
    } catch (err) {
      toast.error('Failed to create customer');
    }
  };

  const handleEditCustomer = async (customer: CustomerItem) => {
    const name = prompt('Edit customer name:', customer.name);
    if (!name || !name.trim()) return;
    const desc = prompt('Edit customer description:', customer.description) || '';
    try {
      const updated = await projectService.updateCustomer(customer.id, {
        name: name.trim(),
        description: desc.trim() || '-',
      });
      setCustomers((prev) => prev.map((c) => (c.id === customer.id ? updated : c)));
      toast.success('Customer updated successfully');
    } catch (err) {
      toast.error('Failed to update customer');
    }
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete customer "${name}"?`)) {
      try {
        await projectService.deleteCustomer(id);
        setCustomers((prev) => prev.filter((c) => c.id !== id));
        toast.success('Customer deleted successfully');
      } catch (err) {
        toast.error('Failed to delete customer');
      }
    }
  };

  // Project Form Submission
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjCustName.trim()) {
      toast.warning('Please enter customer name');
      return;
    }
    if (!newProjName.trim()) {
      toast.warning('Please enter project name');
      return;
    }
    try {
      const admins = newProjAdmin.trim() ? [newProjAdmin.trim()] : [];
      const created = await projectService.createProject({
        name: newProjName.trim(),
        customerName: newProjCustName.trim(),
        projectAdmins: admins,
      });
      setCustomerRecords((prev) => [
        ...prev,
        {
          id: created.id,
          customerName: created.customerName || newProjCustName.trim(),
          project: created.name,
          projectAdmins: admins.join(', ') || '-',
        },
      ]);
      setNewProjCustName('');
      setNewProjName('');
      setNewProjAdmin('');
      toast.success('Project added successfully');
    } catch (err) {
      toast.error('Failed to create project');
    }
  };

  const handleEditProject = async (record: CustomerRecord) => {
    const customerName = prompt('Edit customer name:', record.customerName);
    if (!customerName || !customerName.trim()) return;
    const project = prompt('Edit project name:', record.project);
    if (!project || !project.trim()) return;
    const projectAdmins = prompt('Edit project admins:', record.projectAdmins) || '-';
    try {
      const admins = projectAdmins !== '-' ? projectAdmins.split(',').map((a) => a.trim()) : [];
      await projectService.updateProject(record.id, {
        name: project.trim(),
        customerName: customerName.trim(),
        projectAdmins: admins,
      });
      setCustomerRecords((prev) =>
        prev.map((p) =>
          p.id === record.id
            ? {
                ...p,
                customerName: customerName.trim(),
                project: project.trim(),
                projectAdmins: projectAdmins.trim() || '-',
              }
            : p
        )
      );
      toast.success('Project updated successfully');
    } catch (err) {
      toast.error('Failed to update project');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      try {
        await projectService.deleteProject(id);
        setCustomerRecords((prev) => prev.filter((c) => c.id !== id));
        toast.success('Project deleted successfully');
      } catch (err) {
        toast.error('Failed to delete project');
      }
    }
  };

  const handleReset = () => {
    setSearchCustName('');
    setSearchProjName('');
    setSearchProjAdmin('');
  };

  const filteredProjects = customerRecords.filter((c) => {
    const matchesCust = !searchCustName || c.customerName.toLowerCase().includes(searchCustName.toLowerCase());
    const matchesProj = !searchProjName || c.project.toLowerCase().includes(searchProjName.toLowerCase());
    const matchesAdmin = !searchProjAdmin || c.projectAdmins.toLowerCase().includes(searchProjAdmin.toLowerCase());
    return matchesCust && matchesProj && matchesAdmin;
  });

  const renderCustomersTab = () => {
    return (
      <div className="space-y-6">
        {/* Add New Customer Form Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
            Add New Customer
          </h2>
          <form onSubmit={handleCreateCustomer} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
            <div>
              <label className="block mb-1">Customer Name</label>
              <input
                ref={customerInputRef}
                type="text"
                placeholder="e.g. Acme Corp"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-[#004848] bg-white text-xs font-normal"
              />
            </div>
            <div>
              <label className="block mb-1">Description</label>
              <input
                type="text"
                placeholder="e.g. Leading apparel manufacturing chain."
                value={newCustomerDesc}
                onChange={(e) => setNewCustomerDesc(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-[#004848] bg-white text-xs font-normal"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 bg-[#004848] hover:bg-[#003333] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Customer</span>
              </button>
            </div>
          </form>
        </div>

        {/* Customers List Box */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900 m-0">Customers</h2>

          <div className="bg-slate-100 border border-slate-200 rounded-xl p-5 space-y-3">
            {/* Header info bar with Add Action */}
            <div className="flex justify-between items-center pb-1">
              <span className="text-[10px] font-bold text-slate-500">({customers.length}) Records Found</span>
              <button
                type="button"
                onClick={() => customerInputRef.current?.focus()}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white text-[10px] font-bold rounded-md shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>Add</span>
              </button>
            </div>

            {/* Table Column headers */}
            <div className="grid grid-cols-12 px-4 py-1 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              <span className="col-span-4">Name</span>
              <span className="col-span-6">Description</span>
              <span className="col-span-2 text-right">Actions</span>
            </div>

            {/* Rows list */}
            <div className="space-y-2">
              {customers.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-lg py-8 text-center text-xs font-semibold text-slate-400">
                  No Records Found
                </div>
              ) : (
                customers.map((c) => (
                  <div
                    key={c.id}
                    className="grid grid-cols-12 items-center bg-white border border-slate-200 rounded-lg py-3 px-4 shadow-sm text-xs font-bold text-slate-800"
                  >
                    <span className="col-span-4 text-slate-900 font-extrabold">{c.name}</span>
                    <span className="col-span-6 text-slate-500 font-semibold">{c.description}</span>

                    <div className="col-span-2 flex justify-end gap-2 text-slate-400 select-none">
                      <button
                        onClick={() => handleDeleteCustomer(c.id, c.name)}
                        className="w-7 h-7 rounded-full bg-[#d0d3d7] hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-all cursor-pointer"
                        title="Delete customer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleEditCustomer(c)}
                        className="w-7 h-7 rounded-full bg-[#d0d3d7] hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-all cursor-pointer"
                        title="Edit customer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProjectTab = () => {
    return (
      <div className="space-y-6">
        {/* Add New Project Form Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
            Add New Project
          </h2>
          <form onSubmit={handleCreateProject} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-700">
            <div>
              <label className="block mb-1">Customer Name</label>
              <input
                ref={projectInputRef}
                type="text"
                placeholder="e.g. Acme Corp"
                value={newProjCustName}
                onChange={(e) => setNewProjCustName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-[#004848] bg-white text-xs font-normal"
              />
            </div>
            <div>
              <label className="block mb-1">Project</label>
              <input
                type="text"
                placeholder="e.g. ACME Ltd"
                value={newProjName}
                onChange={(e) => setNewProjName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-[#004848] bg-white text-xs font-normal"
              />
            </div>
            <div>
              <label className="block mb-1">Project Admin</label>
              <input
                type="text"
                placeholder="e.g. John Doe (optional)"
                value={newProjAdmin}
                onChange={(e) => setNewProjAdmin(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-[#004848] bg-white text-xs font-normal"
              />
            </div>
            <div className="sm:col-span-3 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 bg-[#004848] hover:bg-[#003333] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Project</span>
              </button>
            </div>
          </form>
        </div>

        {/* Search & Records Section */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 m-0">Project Records</h2>

          {/* Search form Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1.5">Customer Name</label>
                <input
                  type="text"
                  placeholder="Filter by customer name"
                  value={searchCustName}
                  onChange={(e) => setSearchCustName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none text-xs font-normal bg-white"
                />
              </div>

              <div>
                <label className="block mb-1.5">Project</label>
                <input
                  type="text"
                  placeholder="Filter by project"
                  value={searchProjName}
                  onChange={(e) => setSearchProjName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none text-xs font-normal bg-white"
                />
              </div>

              <div>
                <label className="block mb-1.5">Project Admin</label>
                <input
                  type="text"
                  placeholder="Filter by project admin"
                  value={searchProjAdmin}
                  onChange={(e) => setSearchProjAdmin(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none text-xs font-normal bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-2 border border-[#0473b8] text-[#0473b8] text-xs font-bold rounded-lg hover:bg-blue-50/50 transition-all bg-white cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => toast.info(`Found ${filteredProjects.length} matching record(s)`)}
                className="px-6 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Search
              </button>
            </div>
          </div>

          {/* Card table view */}
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex justify-between items-center pb-1">
              <span className="text-[10px] font-bold text-slate-500">({filteredProjects.length}) Records Found</span>
              <button
                type="button"
                onClick={() => projectInputRef.current?.focus()}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white text-[10px] font-bold rounded-md shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>Add</span>
              </button>
            </div>

            {/* Table Column headers */}
            <div className="grid grid-cols-4 px-4 py-1 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              <span>Customer Name</span>
              <span>Project</span>
              <span>Project Admins</span>
              <span className="text-right">Actions</span>
            </div>

            {/* Rows list */}
            <div className="space-y-2">
              {filteredProjects.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-lg py-8 text-center text-xs font-semibold text-slate-400">
                  No Records Found
                </div>
              ) : (
                filteredProjects.map((c) => (
                  <div
                    key={c.id}
                    className="grid grid-cols-4 items-center bg-white border border-slate-200 rounded-lg py-3 px-4 shadow-sm text-xs font-bold text-slate-800"
                  >
                    <span>{c.customerName}</span>
                    <span className="text-slate-500 font-semibold">{c.project}</span>
                    <span className="text-slate-400 font-normal">{c.projectAdmins}</span>

                    <div className="flex justify-end gap-2.5">
                      <button
                        onClick={() => handleEditProject(c)}
                        className="p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                        title="Edit record"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(c.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 2 Tab pills at the top */}
      <div className="flex gap-3">
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'customers'
              ? 'bg-blue-50 text-[#0473b8] font-extrabold border border-blue-200 shadow-sm'
              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Customers
        </button>
        <button
          onClick={() => setActiveTab('project')}
          className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'project'
              ? 'bg-blue-50 text-[#0473b8] font-extrabold border border-blue-200 shadow-sm'
              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Project
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
          <span className="text-sm font-semibold text-slate-600">Loading projects and customers...</span>
        </div>
      ) : activeTab === 'customers' ? (
        renderCustomersTab()
      ) : (
        renderProjectTab()
      )}
    </div>
  );
};

export default ProjectInfoPage;
