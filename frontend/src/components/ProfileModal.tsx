import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  UserCheck,
  UserPlus,
  Mail,
  MapPin,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  Sliders,
  Sparkles,
  Layers,
  ChevronRight,
  LogOut,
  Mountain,
  FolderCheck,
  Send,
  Building,
  Check,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useResearch } from '../context/ResearchContext';
import { Role, TeamOfficer, RegionResearchTask } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'role' | 'team' | 'tasks' | 'submit_report';
}

const STORAGE_TEAM_KEY = 'aquavene_team_members';
const STORAGE_TASKS_KEY = 'aquavene_assigned_tasks';

const INITIAL_TEAM: TeamOfficer[] = [
  {
    id: 'officer-1',
    fullName: 'Dr. Sunil Rao',
    email: 'sunil.rao@watershed.gov.in',
    specialization: 'Hydrology & Stream Gauging',
    role: 'officer',
    status: 'active',
    assignedRegionsCount: 2,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces',
    joinedAt: '2026-08-15',
  },
  {
    id: 'officer-2',
    fullName: 'Dr. Ananya Sen',
    email: 'ananya.sen@aquavene.gov.in',
    specialization: 'Soil Conservation & USLE',
    role: 'officer',
    status: 'active',
    assignedRegionsCount: 1,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=faces',
    joinedAt: '2026-09-01',
  },
  {
    id: 'officer-3',
    fullName: 'Vikramaditya Verma',
    email: 'vikram.gis@nrsc.gov.in',
    specialization: 'Remote Sensing & GIS',
    role: 'officer',
    status: 'active',
    assignedRegionsCount: 1,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=faces',
    joinedAt: '2026-09-20',
  },
  {
    id: 'officer-4',
    fullName: 'Meera Deshmukh',
    email: 'meera.civil@mgnrega.state.in',
    specialization: 'Civil Check Dams & BoQ',
    role: 'officer',
    status: 'invited',
    assignedRegionsCount: 0,
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&h=120&fit=crop&crop=faces',
    joinedAt: '2026-10-28',
  },
];

const INITIAL_TASKS: RegionResearchTask[] = [
  {
    id: 'task-101',
    regionId: 'ws-kal-001',
    regionCode: 'KA-KAL-001',
    regionName: 'Upper Kali Headwaters Catchment',
    basinName: 'Kali River Basin (Karnataka)',
    assignedToEmail: 'sunil.rao@watershed.gov.in',
    assignedToName: 'Dr. Sunil Rao',
    priority: 'Urgent',
    objectives: 'Conduct 30m SRTM slope verification, verify 3 check dam locations along steep bedrock headwaters, and sample topsoil loss.',
    dueDate: '2026-11-15',
    status: 'submitted',
    createdAt: '2026-10-20',
    submittedReport: {
      title: 'Upper Kali Ground-Truthing & Check Dam Feasibility Report',
      fieldNotes: 'Field GPS survey completed across Station 1 to 6. Average slope measured at 21.8° with active gully incision. 4 gabion check dam sites confirmed feasible with local basalt stone availability. Tolerable soil loss exceeded by 3.1x.',
      measuredSlopeDeg: 21.8,
      measuredSoilLoss: 31.2,
      fileName: 'Upper_Kali_Field_Survey_Report_v2.pdf',
      fileSize: '4.2 MB',
      submittedAt: '2026-10-30T16:45:00Z',
    },
  },
  {
    id: 'task-102',
    regionId: 'ws-bha-001',
    regionCode: 'UK-BHA-001',
    regionName: 'Upper Bhagirathi Gorge Catchment',
    basinName: 'Ganga Basin (Uttarakhand)',
    assignedToEmail: 'ananya.sen@aquavene.gov.in',
    assignedToName: 'Dr. Ananya Sen',
    priority: 'High',
    objectives: 'Field investigation of high-velocity glacial runoff scour and continuous contour trenching (CCT) feasibility.',
    dueDate: '2026-11-20',
    status: 'in_progress',
    createdAt: '2026-10-25',
  },
  {
    id: 'task-103',
    regionId: 'ws-nar-001',
    regionCode: 'MP-NAR-001',
    regionName: 'Hoshangabad Alluvial Catchment',
    basinName: 'Narmada Basin (Madhya Pradesh)',
    assignedToEmail: 'vikram.gis@nrsc.gov.in',
    assignedToName: 'Vikramaditya Verma',
    priority: 'Normal',
    objectives: 'Drone LiDAR validation of cropland sediment traps and percolation tank recharge rates.',
    dueDate: '2026-11-28',
    status: 'pending',
    createdAt: '2026-10-28',
  },
];

const PRESET_REGIONS = [
  { code: 'KA-KAL-001', name: 'Upper Kali Headwaters Catchment', basin: 'Kali River Basin (Karnataka)' },
  { code: 'UK-BHA-001', name: 'Upper Bhagirathi Gorge Catchment', basin: 'Ganga Basin (Uttarakhand)' },
  { code: 'MP-NAR-001', name: 'Hoshangabad Alluvial Catchment', basin: 'Narmada Basin (Madhya Pradesh)' },
  { code: 'TN-PAL-001', name: 'Palar Semi-Arid Agricultural Valley', basin: 'Palar Basin (Tamil Nadu)' },
  { code: 'KA-KAL-002', name: 'Supa Reservoir Inflow Micro-Watershed', basin: 'Kali River Basin (Karnataka)' },
  { code: 'UK-BHA-002', name: 'Tehri Rim Slopes Vulnerability Zone', basin: 'Ganga Basin (Uttarakhand)' },
  { code: 'MP-NAR-002', name: 'Tawa Tributary Headwater Catchment', basin: 'Narmada Basin (Madhya Pradesh)' },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'role',
}) => {
  const { user, switchRoleDemo, signOut, signInWithRole } = useAuth();
  const { loadPresetCatchment, selectWatershed } = useResearch();

  const currentRole = (user?.role || 'viewer') as Role;
  const isAdmin = currentRole === 'admin';
  const isOfficer = currentRole === 'officer' || currentRole === 'planner';
  const isViewer = currentRole === 'viewer';

  const [activeTab, setActiveTab] = useState<'role' | 'team' | 'tasks' | 'submit_report'>(defaultTab);

  // Team state (persisted)
  const [team, setTeam] = useState<TeamOfficer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TEAM_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_TEAM;
  });

  // Tasks state (persisted)
  const [tasks, setTasks] = useState<RegionResearchTask[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TASKS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_TASKS;
  });

  // Invite officer form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteSpec, setInviteSpec] = useState('Hydrology & Stream Gauging');
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);

  // Assign task form
  const [selectedRegionCode, setSelectedRegionCode] = useState(PRESET_REGIONS[0].code);
  const [selectedOfficerEmail, setSelectedOfficerEmail] = useState(INITIAL_TEAM[0].email);
  const [taskObjectives, setTaskObjectives] = useState('Verify 30m SRTM slope angles and confirm check dam placement points.');
  const [taskPriority, setTaskPriority] = useState<'Urgent' | 'High' | 'Normal'>('High');
  const [taskDueDate, setTaskDueDate] = useState('2026-11-25');
  const [taskFeedback, setTaskFeedback] = useState<string | null>(null);

  // Officer report upload form
  const [selectedTaskForReport, setSelectedTaskForReport] = useState<string>('');
  const [reportTitle, setReportTitle] = useState('');
  const [reportFieldNotes, setReportFieldNotes] = useState('');
  const [reportSlope, setReportSlope] = useState('21.5');
  const [reportSoilLoss, setReportSoilLoss] = useState('29.4');
  const [reportFileName, setReportFileName] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [reportFeedback, setReportFeedback] = useState<string | null>(null);

  // Inspector modal for admin inspecting submitted report
  const [inspectedTask, setInspectedTask] = useState<RegionResearchTask | null>(null);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TEAM_KEY, JSON.stringify(team));
    } catch {}
  }, [team]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TASKS_KEY, JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  if (!isOpen) return null;

  // Handle invite officer
  const handleInviteOfficer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      setInviteFeedback('Please provide a valid email address.');
      setTimeout(() => setInviteFeedback(null), 3000);
      return;
    }

    const newOfficer: TeamOfficer = {
      id: `officer-${Date.now()}`,
      fullName: inviteName.trim() || inviteEmail.split('@')[0],
      email: inviteEmail.trim(),
      specialization: inviteSpec,
      role: 'officer',
      status: 'invited',
      assignedRegionsCount: 0,
      joinedAt: new Date().toISOString().slice(0, 10),
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces`,
    };

    setTeam((prev) => [newOfficer, ...prev]);
    setInviteFeedback(`Invitation sent successfully to ${inviteEmail}! Added to research team.`);
    setInviteEmail('');
    setInviteName('');
    setTimeout(() => setInviteFeedback(null), 4000);
  };

  // Handle assign region task
  const handleAssignTask = (e: React.FormEvent) => {
    e.preventDefault();
    const regionObj = PRESET_REGIONS.find((r) => r.code === selectedRegionCode) || PRESET_REGIONS[0];
    const officerObj = team.find((t) => t.email === selectedOfficerEmail) || team[0];

    const newTask: RegionResearchTask = {
      id: `task-${Date.now()}`,
      regionId: `ws-${selectedRegionCode.toLowerCase()}`,
      regionCode: regionObj.code,
      regionName: regionObj.name,
      basinName: regionObj.basin,
      assignedToEmail: officerObj.email,
      assignedToName: officerObj.fullName,
      priority: taskPriority,
      objectives: taskObjectives,
      dueDate: taskDueDate,
      status: 'in_progress',
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setTasks((prev) => [newTask, ...prev]);
    // Increment assigned count on officer
    setTeam((prev) =>
      prev.map((o) => (o.email === officerObj.email ? { ...o, assignedRegionsCount: o.assignedRegionsCount + 1 } : o))
    );

    setTaskFeedback(`Region ${regionObj.name} assigned to ${officerObj.fullName} (${officerObj.email})!`);
    setTimeout(() => setTaskFeedback(null), 4000);
  };

  // Handle report upload by Officer
  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    const taskIdToUpdate = selectedTaskForReport || tasks[0]?.id;
    if (!taskIdToUpdate) return;

    setUploadProgress(20);
    setTimeout(() => setUploadProgress(65), 300);
    setTimeout(() => {
      setUploadProgress(100);
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskIdToUpdate) {
            return {
              ...t,
              status: 'submitted',
              submittedReport: {
                title: reportTitle.trim() || `${t.regionName} Field Ground-Truthing Report`,
                fieldNotes: reportFieldNotes.trim() || 'Verified Whitebox D8 slope runoff and drainage density. Measured check dam site coordinates and recommended vegetative contour terracing.',
                measuredSlopeDeg: parseFloat(reportSlope) || 21.5,
                measuredSoilLoss: parseFloat(reportSoilLoss) || 28.4,
                fileName: reportFileName || 'Ground_Truthing_Diagnostic_Notes.pdf',
                fileSize: '3.8 MB',
                submittedAt: new Date().toISOString(),
              },
            };
          }
          return t;
        })
      );
      setReportFeedback('Research report uploaded and submitted to Admin successfully!');
      setTimeout(() => {
        setUploadProgress(null);
        setReportFeedback(null);
        setActiveTab('tasks');
      }, 1500);
    }, 700);
  };

  // Quick switch role
  const handleRoleSelect = (r: Role) => {
    switchRoleDemo(r);
  };

  // Officer assigned tasks
  const officerTasks = tasks.filter((t) => t.assignedToEmail === user?.email || isOfficer);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-hydro-card border border-hydro-border rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hydro-border/70 bg-gradient-to-r from-slate-900 via-hydro-panel to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-aqua-600 to-sky-500 text-white shadow-lg shadow-aqua-950/40">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-tight">
                  AquaVane Profile & Role-Based Access Control
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-aqua-950 text-aqua-400 border border-aqua-600/40 font-mono font-bold uppercase">
                  RBAC Workspace
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manage roles, invite field officers via email, assign research regions, and review uploaded field reports.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Identity & Role Quick Bar */}
        <div className="px-6 py-3.5 bg-hydro-surface/80 border-b border-hydro-border/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={
                user?.avatar_url ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces'
              }
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover border-2 border-aqua-500/60 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">
                  {user?.display_name || user?.full_name || 'Dr. Aarav Sharma'}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold border ${
                    isAdmin
                      ? 'bg-purple-950 text-purple-300 border-purple-500/50'
                      : isOfficer
                      ? 'bg-teal-950 text-teal-300 border-teal-500/50'
                      : 'bg-slate-800 text-slate-300 border-slate-600/50'
                  }`}
                >
                  {currentRole}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {user?.email || 'officer@aquavane.gov.in'}
              </p>
            </div>
          </div>

          {/* Quick Role Switcher Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-hydro-border">
            <span className="text-[11px] text-slate-400 px-2 font-semibold">Active Role:</span>
            <button
              onClick={() => handleRoleSelect('admin')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isAdmin
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              👑 Admin
            </button>
            <button
              onClick={() => handleRoleSelect('officer')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isOfficer
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              🔬 Officer
            </button>
            <button
              onClick={() => handleRoleSelect('viewer')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isViewer
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              👁️ Viewer
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center px-6 border-b border-hydro-border/60 bg-hydro-panel/40 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('role')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'role'
                ? 'border-aqua-500 text-aqua-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Role Permissions & Status</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'tasks'
                ? 'border-aqua-500 text-aqua-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Assigned Regions & Tasks</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-aqua-400 text-[10px]">
              {tasks.length}
            </span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('team')}
              className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'team'
                  ? 'border-purple-500 text-purple-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4 text-purple-400" />
              <span>Admin: Team & Invitations</span>
              <span className="px-1.5 py-0.2 rounded-full bg-purple-950 text-purple-300 text-[10px]">
                {team.length}
              </span>
            </button>
          )}

          {isOfficer && (
            <button
              onClick={() => setActiveTab('submit_report')}
              className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'submit_report'
                  ? 'border-teal-500 text-teal-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-4 h-4 text-teal-400" />
              <span>Officer: Upload Research Report</span>
            </button>
          )}
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: ROLE PERMISSIONS & STATUS */}
          {activeTab === 'role' && (
            <div className="space-y-6">
              {/* Normal Viewer Notice */}
              {isViewer && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Normal Viewer Mode (Limited Public Read-Only Access)</span>
                  </div>
                  <p>
                    As a Normal Viewer, you have transparent public access to explore published micro-watershed rankings,
                    satellite land cover, and terrain slope indices. Modifying policy restoration levers, creating certified
                    DPR budgets, and assigning regional research tasks are restricted to verified Field Officers and District Administrators.
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleRoleSelect('officer')}
                      className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Switch to Field Officer Role</span>
                    </button>
                    <button
                      onClick={() => handleRoleSelect('admin')}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                    >
                      <span>Switch to Admin Role</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 3 Role Feature Matrix Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Admin Card */}
                <div
                  className={`p-5 rounded-2xl border transition-all ${
                    isAdmin
                      ? 'bg-purple-950/40 border-purple-500 shadow-xl shadow-purple-950/30'
                      : 'bg-hydro-panel/50 border-hydro-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400">👑</span>
                    {isAdmin && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500 text-white uppercase">
                        Active Role
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white">Universal Administrator</h3>
                  <p className="text-xs text-slate-400 mt-1 mb-4">
                    District Collector or State Nodal Director with executive authority across all catchments.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300 border-t border-hydro-border/60 pt-3">
                    <li className="flex items-center gap-2 text-emerald-400">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Invite officers via email (`mail id`)</span>
                    </li>
                    <li className="flex items-center gap-2 text-emerald-400">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Assign catchment regions to officers</span>
                    </li>
                    <li className="flex items-center gap-2 text-emerald-400">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Inspect & approve uploaded field reports</span>
                    </li>
                    <li className="flex items-center gap-2 text-emerald-400">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Approve certified DPR proposals & BoQs</span>
                    </li>
                  </ul>
                  {!isAdmin && (
                    <button
                      onClick={() => handleRoleSelect('admin')}
                      className="w-full mt-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-200 text-xs font-bold transition-all border border-purple-500/40"
                    >
                      Switch to Administrator
                    </button>
                  )}
                </div>

                {/* Officer Card */}
                <div
                  className={`p-5 rounded-2xl border transition-all ${
                    isOfficer
                      ? 'bg-teal-950/40 border-teal-500 shadow-xl shadow-teal-950/30'
                      : 'bg-hydro-panel/50 border-hydro-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2 rounded-xl bg-teal-500/20 text-teal-400">🔬</span>
                    {isOfficer && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500 text-white uppercase">
                        Active Role
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white">Field Research Officer</h3>
                  <p className="text-xs text-slate-400 mt-1 mb-4">
                    Ground-truthing hydrologist verifying 30m slopes, stream discharge, and check dam coordinates.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300 border-t border-hydro-border/60 pt-3">
                    <li className="flex items-center gap-2 text-emerald-400">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>View assigned catchment regions</span>
                    </li>
                    <li className="flex items-center gap-2 text-emerald-400">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Execute 5 restoration levers simulation</span>
                    </li>
                    <li className="flex items-center gap-2 text-emerald-400">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Upload & submit field diagnostic reports</span>
                    </li>
                    <li className="flex items-center gap-2 text-rose-400">
                      <X className="w-3.5 h-3.5 shrink-0" />
                      <span>Cannot invite officers or elevate roles</span>
                    </li>
                  </ul>
                  {!isOfficer && (
                    <button
                      onClick={() => handleRoleSelect('officer')}
                      className="w-full mt-4 py-2 rounded-xl bg-teal-600/30 hover:bg-teal-600 text-teal-200 text-xs font-bold transition-all border border-teal-500/40"
                    >
                      Switch to Field Officer
                    </button>
                  )}
                </div>

                {/* Normal Viewer Card */}
                <div
                  className={`p-5 rounded-2xl border transition-all ${
                    isViewer
                      ? 'bg-slate-800/40 border-slate-500 shadow-xl'
                      : 'bg-hydro-panel/50 border-hydro-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2 rounded-xl bg-slate-700/40 text-slate-300">👁️</span>
                    {isViewer && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-200 uppercase">
                        Active Role
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white">Normal Public Viewer</h3>
                  <p className="text-xs text-slate-400 mt-1 mb-4">
                    Public citizen or academic researcher with read-only transparency rights.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300 border-t border-hydro-border/60 pt-3">
                    <li className="flex items-center gap-2 text-emerald-400">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Inspect ranked micro-watershed list</span>
                    </li>
                    <li className="flex items-center gap-2 text-emerald-400">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Explore 2D/3D interactive geospatial maps</span>
                    </li>
                    <li className="flex items-center gap-2 text-rose-400">
                      <X className="w-3.5 h-3.5 shrink-0" />
                      <span>Cannot alter policy simulation weights</span>
                    </li>
                    <li className="flex items-center gap-2 text-rose-400">
                      <X className="w-3.5 h-3.5 shrink-0" />
                      <span>Cannot create or certify DPR budgets</span>
                    </li>
                  </ul>
                  {!isViewer && (
                    <button
                      onClick={() => handleRoleSelect('viewer')}
                      className="w-full mt-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700"
                    >
                      Switch to Normal Viewer
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ASSIGNED REGIONS & TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {isAdmin ? 'All Assigned Regional Research Tasks' : 'My Assigned Field Research Regions'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Track field research progress, assigned officers, and submitted diagnostic reports.
                  </p>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => setActiveTab('team')}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Assign New Region</span>
                  </button>
                )}
              </div>

              {/* Tasks List */}
              <div className="space-y-3">
                {tasks.map((task) => {
                  const isAssignedToCurrent = task.assignedToEmail === user?.email || isOfficer;

                  return (
                    <div
                      key={task.id}
                      className="p-4 rounded-2xl bg-hydro-panel border border-hydro-border hover:border-slate-600 transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                            <Mountain className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-sm">{task.regionName}</h4>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-cyan-400">
                                {task.regionCode}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">{task.basinName}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                              task.status === 'submitted'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : task.status === 'in_progress'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {task.status === 'submitted'
                              ? '✓ Report Submitted'
                              : task.status === 'in_progress'
                              ? '⏳ In Progress'
                              : '⚪ Pending'}
                          </span>

                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-rose-300 font-mono">
                            Priority: {task.priority}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                        <strong className="text-slate-400 block mb-0.5">Field Research Objectives:</strong>
                        {task.objectives}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-hydro-border/60 text-xs">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Mail className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Assigned Officer:</span>
                          <strong className="text-white">{task.assignedToName}</strong>
                          <span className="text-slate-400 font-mono">({task.assignedToEmail})</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {task.status === 'submitted' && task.submittedReport ? (
                            <button
                              onClick={() => setInspectedTask(task)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1.5 transition-all"
                            >
                              <FileText className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Inspect Submitted Report</span>
                            </button>
                          ) : isOfficer ? (
                            <button
                              onClick={() => {
                                setSelectedTaskForReport(task.id);
                                setActiveTab('submit_report');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center gap-1.5 transition-all shadow-md"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload Field Report</span>
                            </button>
                          ) : null}

                          <button
                            onClick={() => {
                              // Load preset catchment into context and close
                              loadPresetCatchment('kali');
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                            <span>Open on Map</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ADMIN TEAM & INVITATIONS (Admin Only) */}
          {activeTab === 'team' && isAdmin && (
            <div className="space-y-6">
              {/* Invite Officer Form */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-hydro-panel to-slate-900 border border-purple-500/30 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Invite Field Officer to Team</h3>
                    <p className="text-xs text-slate-400">
                      Send official invitation via email (`mail id`) to grant hydrological research and ground-truthing access.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleInviteOfficer} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        Officer Email ID *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="officer@aquavene.gov.in"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        Full Name & Title
                      </label>
                      <input
                        type="text"
                        placeholder="Dr. Rajesh Meena"
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        Specialization
                      </label>
                      <select
                        value={inviteSpec}
                        onChange={(e) => setInviteSpec(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="Hydrology & Stream Gauging">Hydrology & Stream Gauging</option>
                        <option value="Soil Conservation & USLE">Soil Conservation & USLE</option>
                        <option value="Remote Sensing & GIS">Remote Sensing & GIS</option>
                        <option value="Civil Check Dams & BoQ">Civil Check Dams & BoQ</option>
                        <option value="Riparian Ecology & Forestry">Riparian Ecology & Forestry</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {inviteFeedback ? (
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        {inviteFeedback}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        Officer will receive invitation link and automatically appear in the team assignment roster.
                      </span>
                    )}

                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-950/50 transition-all shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Invitation & Add</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Assign Region Task Box */}
              <div className="p-5 rounded-2xl bg-hydro-panel border border-hydro-border space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Assign Watershed Region to Officer</h3>
                    <p className="text-xs text-slate-400">
                      Allocate specific micro-watersheds to officers for field ground-truthing and report submission.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAssignTask} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        Select Catchment Region *
                      </label>
                      <select
                        value={selectedRegionCode}
                        onChange={(e) => setSelectedRegionCode(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        {PRESET_REGIONS.map((r) => (
                          <option key={r.code} value={r.code}>
                            {r.name} ({r.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        Assign to Officer *
                      </label>
                      <select
                        value={selectedOfficerEmail}
                        onChange={(e) => setSelectedOfficerEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        {team.map((t) => (
                          <option key={t.id} value={t.email}>
                            {t.fullName} ({t.email}) — {t.specialization}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      Field Research Objectives & Deliverables
                    </label>
                    <textarea
                      rows={2}
                      value={taskObjectives}
                      onChange={(e) => setTaskObjectives(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        Priority Level
                      </label>
                      <select
                        value={taskPriority}
                        onChange={(e) => setTaskPriority(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Urgent">Urgent (Immediate ground-truth)</option>
                        <option value="High">High</option>
                        <option value="Normal">Normal</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        Completion Due Date
                      </label>
                      <input
                        type="date"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1 flex items-end">
                      <button
                        type="submit"
                        className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Assign Task</span>
                      </button>
                    </div>
                  </div>

                  {taskFeedback && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{taskFeedback}</span>
                    </div>
                  )}
                </form>
              </div>

              {/* Active Officers Table */}
              <div className="bg-hydro-panel border border-hydro-border rounded-2xl overflow-hidden shadow-xl">
                <div className="px-5 py-3 border-b border-hydro-border bg-slate-950/60 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Active Research Officers Roster ({team.length})
                  </h4>
                </div>

                <div className="divide-y divide-hydro-border/60 text-xs">
                  {team.map((officer) => (
                    <div key={officer.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-900/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <img
                          src={officer.avatarUrl}
                          alt={officer.fullName}
                          className="w-9 h-9 rounded-full object-cover border border-white/20"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{officer.fullName}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                officer.status === 'active'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              {officer.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400 mt-0.5">
                            <span className="font-mono text-cyan-400">{officer.email}</span>
                            <span>•</span>
                            <span>{officer.specialization}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Assigned Regions</span>
                          <strong className="text-white text-sm">{officer.assignedRegionsCount}</strong>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedOfficerEmail(officer.email);
                            // Scroll to assign form
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700"
                        >
                          Assign
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: OFFICER UPLOAD RESEARCH REPORT (Officer View) */}
          {activeTab === 'submit_report' && isOfficer && (
            <div className="space-y-5 max-w-2xl mx-auto">
              <div className="text-center space-y-1">
                <h3 className="text-base font-extrabold text-white">
                  Upload & Submit Ground-Truthing Field Report
                </h3>
                <p className="text-xs text-slate-400">
                  Deliver field observations, slope verifications, and technical survey files directly to the District Administrator.
                </p>
              </div>

              <form onSubmit={handleSubmitReport} className="space-y-4 bg-hydro-panel border border-hydro-border p-6 rounded-2xl shadow-xl">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Select Assigned Region Task *
                  </label>
                  <select
                    value={selectedTaskForReport}
                    onChange={(e) => setSelectedTaskForReport(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    {tasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.regionName} ({t.regionCode}) — Due: {t.dueDate}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Report Document Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Upper Kali Slope Stability & Check Dam Verification Report"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Verified Field Slope (°)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={reportSlope}
                      onChange={(e) => setReportSlope(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Measured Soil Loss (t/ha/yr)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={reportSoilLoss}
                      onChange={(e) => setReportSoilLoss(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Field Observations & Ground-Truthing Notes
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe channel conditions, topsoil scouring, bedrock stability, and community consultations..."
                    value={reportFieldNotes}
                    onChange={(e) => setReportFieldNotes(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 resize-none"
                  />
                </div>

                {/* File Upload Box */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Attach Field Survey File (PDF / DOCX / GeoJSON / GPS)
                  </label>
                  <div className="border-2 border-dashed border-slate-700 hover:border-teal-500 rounded-2xl p-4 text-center bg-slate-950/60 transition-colors">
                    <input
                      type="file"
                      id="reportFileInput"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setReportFileName(file.name);
                      }}
                    />
                    <label htmlFor="reportFileInput" className="cursor-pointer flex flex-col items-center gap-1.5">
                      <Upload className="w-6 h-6 text-teal-400" />
                      <span className="text-xs text-slate-200 font-semibold">
                        {reportFileName || 'Click or drag file to attach research survey report'}
                      </span>
                      <span className="text-[11px] text-slate-400">PDF, GeoJSON, Excel, or Shapefile (Max 25MB)</span>
                    </label>
                  </div>
                </div>

                {uploadProgress !== null && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Uploading research report document...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-teal-500 transition-all duration-300 rounded-full" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                {reportFeedback && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{reportFeedback}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={uploadProgress !== null}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-950/50 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Field Report to Administrator</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-3 border-t border-hydro-border/70 bg-hydro-panel/40 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>FastAPI RBAC Engine Active • JWT Bearer Auth</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                signOut();
                onClose();
              }}
              className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Inspect Report Sub-Modal */}
      {inspectedTask && inspectedTask.submittedReport && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <FolderCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {inspectedTask.submittedReport.title}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Submitted by {inspectedTask.assignedToName} ({inspectedTask.assignedToEmail})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectedTask(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Verified Slope Angle</span>
                <strong className="text-cyan-400 text-sm">{inspectedTask.submittedReport.measuredSlopeDeg}°</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Measured Soil Loss</span>
                <strong className="text-rose-400 text-sm">{inspectedTask.submittedReport.measuredSoilLoss} t/ha/yr</strong>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <strong className="text-white block">Field Diagnostics & Findings:</strong>
              <p className="leading-relaxed">{inspectedTask.submittedReport.fieldNotes}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-medium">{inspectedTask.submittedReport.fileName}</span>
                <span className="text-slate-400 font-mono">({inspectedTask.submittedReport.fileSize})</span>
              </div>
              <span className="text-emerald-400 font-bold">Verified & Certified</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setInspectedTask(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
              {isAdmin && (
                <button
                  onClick={() => {
                    setTasks((prev) =>
                      prev.map((t) => (t.id === inspectedTask.id ? { ...t, status: 'approved' } : t))
                    );
                    setInspectedTask(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
                >
                  Approve Field Report
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
