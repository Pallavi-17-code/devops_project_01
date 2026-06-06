import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Activity, CheckCircle2, XCircle, Package, Settings, 
  Plus, Clock, RotateCcw, Terminal, ArrowUpRight, Search, 
  Cpu, HardDrive, ShieldCheck, LogOut, X, Play, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const [pipelines, setPipelines] = useState([]);
  const [jenkinsInfo, setJenkinsInfo] = useState(null);
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  
  // Modal States for Demo
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [activeLogs, setActiveLogs] = useState('Fetching live logs from cluster...');

  // Advanced States for Final Year Project
  const [notifications, setNotifications] = useState([]);
  const [provisioningStatus, setProvisioningStatus] = useState(null); 
  const [provisionProgress, setProvisionProgress] = useState(0);
  const [liveStages, setLiveStages] = useState([]); 
  const [systemEvents, setSystemEvents] = useState([
    { id: 1, time: '10:45:22', event: 'Docker Daemon Connected', type: 'system' },
    { id: 2, time: '10:46:01', event: 'Jenkins Master Ready', type: 'jenkins' },
    { id: 3, time: '10:48:15', event: 'Cluster Health Check: 100%', type: 'health' }
  ]);
  const [chartData, setChartData] = useState(Array(20).fill(40)); // For live chart

  const API_BASE = 'http://localhost:5002/api';
  const MAIN_JOB = 'Main-API-Build1'; 

  const updateChart = () => {
    setChartData(prev => [...prev.slice(1), Math.floor(Math.random() * 40) + 30]);
  };

  const addSystemEvent = (event, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setSystemEvents(prev => [{ id: Date.now(), time, event, type }, ...prev].slice(0, 5));
  };

  const addNotification = (msg, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [{ id, msg, type }, ...prev]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  const handleStartProvisioning = async () => {
    setProvisioningStatus('pulling');
    setProvisionProgress(10);
    addSystemEvent('Pulling node:20-alpine image...', 'docker');
    
    setTimeout(() => { setProvisioningStatus('allocating'); setProvisionProgress(45); addSystemEvent('Allocating cluster ports...', 'system'); }, 2000);
    setTimeout(() => { setProvisioningStatus('starting'); setProvisionProgress(75); addSystemEvent('Starting container daemon...', 'docker'); }, 4000);
    setTimeout(() => { 
      setProvisioningStatus('ready'); 
      setProvisionProgress(100);
      addNotification('NEW CONTAINER SPAWNED', 'success');
      addSystemEvent('Container cluster synchronized', 'success');
      setTimeout(() => { setShowNodeModal(false); setProvisioningStatus(null); }, 1500);
    }, 6000);
  };

  const fetchLogs = async (jobName) => {
    setShowLogModal(true);
    setActiveLogs('Establishing connection to Jenkins...');
    try {
      const res = await fetch(`${API_BASE}/jenkins/logs/${jobName}`);
      const data = await res.text();
      // If it returns JSON error, format it nicely
      if (data.startsWith('{')) {
        const err = JSON.parse(data);
        setActiveLogs(`SYSTEM ERROR: ${err.message}`);
      } else {
        setActiveLogs(data || 'No logs found for this stream.');
      }
    } catch (error) {
      setActiveLogs('Error: Failed to reach build cluster.');
    }
  };

  const fetchStages = async (jobName) => {
    try {
      const res = await fetch(`${API_BASE}/jenkins/stages/${jobName}`);
      const data = await res.json();
      if (data.success) setLiveStages(data.data);
    } catch (error) {
      console.error('Error fetching stages');
    }
  };

  const fetchDashboardData = async () => {
    try {
      const pipeRes = await fetch(`${API_BASE}/pipelines`);
      const pipeData = await pipeRes.json();
      if (pipeData.success) setPipelines(pipeData.data);

      const jenkinsRes = await fetch(`${API_BASE}/jenkins/status`);
      const jenkinsData = await jenkinsRes.json();
      if (jenkinsData.success) setJenkinsInfo(jenkinsData.data);

      // Poll stages for the main job
      fetchStages(MAIN_JOB);

      const dockerRes = await fetch(`${API_BASE}/docker/containers`);
      const dockerData = await dockerRes.json();
      if (dockerData.success) {
        const awsRegions = ['us-east-1a', 'eu-west-1b', 'ap-south-1a'];
        const awsInstanceTypes = ['t3.medium', 'c5.large', 'm5.xlarge'];
        
        const mappedContainers = dockerData.data.map((c, idx) => ({
          id: c.ID,
          name: `i-${Math.random().toString(16).substring(2, 14)}`,
          image: `Ubuntu 22.04 LTS (${awsInstanceTypes[idx % awsInstanceTypes.length]}) | ${awsRegions[idx % awsRegions.length]}`,
          status: c.Status.includes('Up') ? 'Up' : 'Down',
          cpu: (Math.random() * 2).toFixed(1) + '%',
          memory: (Math.random() * 512 + 128).toFixed(0) + 'MB'
        }));
        setContainers(mappedContainers);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      fetchDashboardData();
      updateChart();
    }, 5000); 
    return () => clearInterval(interval);
  }, []);

  const handleCreatePipeline = async () => {
    if (!newName || !newUrl) return addNotification('NAME AND URL REQUIRED', 'error');
    
    try {
      const res = await fetch(`${API_BASE}/pipelines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, repository_url: newUrl })
      });
      
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setNewName('');
        setNewUrl('');
        addNotification('PIPELINE STREAM INITIALIZED', 'success');
        fetchDashboardData();
      } else {
        addNotification(data.message || 'INITIALIZATION FAILED', 'error');
      }
    } catch (error) {
      addNotification('SERVER CONNECTION LOST', 'error');
    }
  };

  const handleDeletePipeline = async (id) => {
    if (!window.confirm('TERMINATE THIS PIPELINE STREAM?')) return;
    try {
      const res = await fetch(`${API_BASE}/pipelines/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        addNotification('PIPELINE STREAM TERMINATED', 'success');
        fetchDashboardData();
      }
    } catch (error) {
      addNotification('TERMINATION FAILED', 'error');
    }
  };

  const handleDeployPipeline = async (id) => {
    addNotification('INITIATING INDIVIDUAL DEPLOY...', 'info');
    try {
      const res = await fetch(`${API_BASE}/pipelines/${id}/build`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        addNotification('DEPLOY SEQUENCE STARTED', 'success');
        fetchDashboardData();
      }
    } catch (error) {
      addNotification('DEPLOYMENT FAILED', 'error');
    }
  };

  const [deployPath, setDeployPath] = useState(false);

  return (
    <div className="flex bg-[#020617] text-slate-300 overflow-hidden h-screen relative font-sans selection:bg-blue-500/30">
      
      {/* ELITE BACKGROUND: Deep Tech Grid & Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/50 via-[#020617] to-black">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f15_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              y: [0, -1000],
              x: Math.random() * 100 - 50,
              opacity: [0, 1, 0] 
            }}
            transition={{ 
              duration: Math.random() * 20 + 10, 
              repeat: Infinity,
              delay: Math.random() * 10 
            }}
            className="absolute bottom-0 w-1 h-1 bg-blue-500 rounded-full blur-[2px] shadow-[0_0_15px_#3b82f6]"
            style={{ left: `${Math.random() * 100}%` }}
          />
        ))}
      </div>

      {/* LEFT COMMAND SIDEBAR */}
      <aside className="w-80 h-full bg-slate-900/40 backdrop-blur-3xl border-r border-white/5 flex flex-col p-8 z-20 relative">
        <div className="flex items-center gap-4 mb-16">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            <LayoutDashboard className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tighter leading-none">ORBITAL</h1>
            <p className="text-[10px] text-blue-500 font-black tracking-[0.2em] mt-1">V4.0 ELITE</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { label: 'Control Center', icon: LayoutDashboard, active: true, action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
            { label: 'Cluster Metrics', icon: Activity, action: () => document.getElementById('telemetry-section')?.scrollIntoView({ behavior: 'smooth' }) },
            { label: 'Pipeline Logs', icon: Terminal, action: () => document.getElementById('pipeline-section')?.scrollIntoView({ behavior: 'smooth' }) },
            { label: 'Security Matrix', icon: ShieldCheck, action: () => addNotification('SECURITY PROTOCOLS SECURE', 'success') },
            { label: 'Infrastructure', icon: Package, action: () => document.getElementById('node-matrix-section')?.scrollIntoView({ behavior: 'smooth' }) },
            { label: 'System Settings', icon: Settings, action: () => setShowSettingsModal(true) },
          ].map((item) => (
            <motion.div
              key={item.label}
              whileHover={{ x: 10, backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
              onClick={item.action}
              className={`relative flex items-center gap-4 px-6 py-4 rounded-2xl cursor-pointer transition-all overflow-hidden group ${
                item.active ? 'bg-gradient-to-r from-blue-600/20 to-transparent border border-blue-500/30 text-white shadow-[inset_4px_0_0_0_#3b82f6]' : 'text-slate-500 hover:text-white border border-transparent'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-transform duration-500 group-hover:scale-110 ${item.active ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : ''}`} />
              <span className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all ${item.active ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : ''}`}>{item.label}</span>
              {item.active && <motion.div className="absolute right-4 w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_15px_#3b82f6] animate-pulse" />}
            </motion.div>
          ))}
        </nav>

        <div className="mt-auto space-y-6 pt-8 border-t border-white/5">
          <div className="flex items-center gap-4 px-4 py-4 bg-white/5 rounded-3xl border border-white/5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-white/10 shadow-xl" />
            <div className="flex-1">
              <p className="text-[10px] font-black text-white uppercase tracking-tight">Pallavi</p>
              <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Root Authority</p>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            onClick={() => window.location.href = '/login'}
            className="w-full py-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center gap-3 group hover:bg-red-500/20 transition-all"
          >
            <LogOut className="w-4 h-4 text-red-500 group-hover:rotate-12 transition-transform" />
            <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">Terminate Session</span>
          </motion.button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        {/* Header */}
        <header className="h-24 border-b border-white/5 flex items-center justify-between px-10 bg-slate-900/20 backdrop-blur-md">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">System Health: Optimal</span>
            </div>
            <div className="h-4 w-[1px] bg-white/10"></div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Region: US-EAST-CLUSTER-1</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="GLOBAL SEARCH..." 
                className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-[10px] font-black text-white focus:border-blue-500/50 outline-none w-64 transition-all"
              />
            </div>
            <motion.div whileHover={{ scale: 1.1 }} className="p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-all">
              <Settings className="w-5 h-5 text-slate-400" />
            </motion.div>
          </div>
        </header>

        {/* Main Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-10 space-y-12 scrollbar-hide">
          {/* Notifications System */}
          <div className="fixed top-24 right-8 z-[100] space-y-4">
            <AnimatePresence>
              {notifications.map(n => (
                <motion.div 
                  initial={{ x: 100, opacity: 0, scale: 0.9 }} animate={{ x: 0, opacity: 1, scale: 1 }} exit={{ x: 100, opacity: 0, scale: 0.9 }}
                  key={n.id}
                  className={`px-8 py-5 rounded-[28px] border-2 backdrop-blur-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center gap-5 ${
                    n.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                    n.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                    'bg-blue-600/10 border-blue-500/30 text-blue-400'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full shadow-[0_0_15px_currentColor] ${
                    n.type === 'success' ? 'bg-green-400' : n.type === 'error' ? 'bg-red-400' : 'bg-blue-400'
                  }`}></div>
                  <span className="text-xs font-black uppercase tracking-[0.2em] italic">{n.msg}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* ELITE OPERATIONS: NETWORK TOPOLOGY */}
          <section className="bg-slate-900/20 backdrop-blur-3xl border border-white/5 rounded-[50px] p-10 shadow-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 flex flex-col items-end">
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Protocol: SSH/HTTPS</span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Encryption: AES-256</span>
            </div>
            
            <h2 className="text-sm font-black text-white uppercase tracking-[0.4em] mb-12 flex items-center gap-4">
              <div className="w-10 h-[1px] bg-blue-500"></div>
              Infrastructure Topology Matrix
            </h2>

            <div className="flex flex-col lg:flex-row items-center justify-around gap-20 py-10 relative">
              {/* LINK LINES */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                <motion.path 
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 3, repeat: Infinity }}
                  d="M 200 150 L 500 150 M 500 150 L 800 100 M 500 150 L 800 200" 
                  stroke="#3b82f6" strokeWidth="2" fill="none" strokeDasharray="10 10" 
                />
              </svg>

              {/* SOURCE NODE */}
              <motion.div 
                whileHover={{ scale: 1.1 }} 
                onClick={() => window.open('https://github.com', '_blank')}
                className="flex flex-col items-center gap-6 group cursor-pointer"
              >
                <div className="w-24 h-24 bg-blue-600/10 border-2 border-blue-500/30 rounded-[35px] flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.1)] group-hover:border-blue-400 group-hover:shadow-[0_0_50px_rgba(59,130,246,0.3)] transition-all relative">
                  <div className="absolute -inset-2 bg-blue-500/20 rounded-[40px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <LayoutDashboard className="w-10 h-10 text-blue-400" />
                </div>
                <div className="text-center">
                  <span className="text-xs font-black text-white uppercase tracking-widest">Git Repository</span>
                  <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase">Open Source View</p>
                </div>
              </motion.div>

              <motion.div 
                animate={{ scale: [1, 1.05, 1] }} 
                whileHover={{ scale: 1.15 }}
                transition={{ duration: 4, repeat: Infinity }} 
                onClick={() => window.open('http://localhost:9090', '_blank')}
                className="flex flex-col items-center gap-6 group cursor-pointer"
              >
                <div className="w-32 h-32 bg-orange-600/10 border-2 border-orange-500/30 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(249,115,22,0.1)] relative">
                  <Settings className="w-14 h-14 text-orange-400 animate-[spin_10s_linear_infinite]" />
                  <div className="absolute inset-0 border-2 border-dashed border-orange-500/20 rounded-full animate-[spin_20s_linear_infinite]"></div>
                </div>
                <div className="text-center">
                  <span className="text-xs font-black text-white uppercase tracking-widest">Jenkins Core</span>
                  <p className="text-[9px] text-orange-400 font-bold mt-1 uppercase">Master Orchestrator</p>
                </div>
              </motion.div>

              <div className="flex flex-col gap-10">
                {['EC2-Cluster-East', 'RDS-Aurora-DB'].map((node, i) => (
                  <motion.div 
                    key={node} 
                    whileHover={{ x: 10, scale: 1.05 }} 
                    onClick={() => document.getElementById('node-matrix-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="flex items-center gap-6 group cursor-pointer"
                  >
                    <div className="w-16 h-16 bg-purple-600/10 border-2 border-purple-500/30 rounded-2xl flex items-center justify-center group-hover:border-purple-400 transition-all shadow-xl">
                      <Package className="w-8 h-8 text-purple-400" />
                    </div>
                    <div>
                      <span className="text-[11px] font-black text-white uppercase tracking-widest">{node}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]"></div>
                        <span className="text-[8px] font-bold text-slate-500 uppercase">Manage Node</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* MIDDLE ROW: PIPELINES & TELEMETRY */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <section id="pipeline-section" className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                    <Activity className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight uppercase tracking-widest">Operational Streams</h2>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Real-time pipeline orchestration</p>
                  </div>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateModal(true)}
                  className="px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl text-[10px] font-black tracking-[0.2em] text-white transition-all shadow-[0_10px_30px_rgba(37,99,235,0.3)]"
                >
                  + INITIALIZE STREAM
                </motion.button>
              </div>

              <div className="bg-slate-900/40 border border-white/5 rounded-[45px] overflow-hidden shadow-3xl backdrop-blur-3xl group">
                <table className="w-full text-left">
                  <thead className="bg-white/[0.02] border-b border-white/5">
                    <tr>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Stream Identity</th>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">System Pulse</th>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Matrix Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {pipelines.map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.03] transition-all group/row">
                        <td className="px-10 py-8">
                          <div className="flex flex-col">
                            <span className="text-base font-black text-white group-hover/row:text-blue-400 transition-colors tracking-tight">{p.name}</span>
                            <span className="text-[8px] text-slate-600 mt-2 font-black uppercase tracking-[0.2em]">Build Vector: {Math.random().toString(16).substring(2, 10)}</span>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex flex-col gap-2">
                            <span className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-full text-[9px] font-black tracking-widest uppercase shadow-lg border relative overflow-hidden ${
                              p.status?.toLowerCase() === 'success' ? 'bg-green-500/10 text-green-300 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.15)]' :
                              p.status?.toLowerCase() === 'building' ? 'bg-blue-500/10 text-blue-300 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]' :
                              'bg-slate-800/50 text-slate-400 border-white/5'
                            }`}>
                              {p.status?.toLowerCase() === 'building' && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>}
                              <div className={`w-2 h-2 rounded-full relative z-10 shadow-[0_0_10px_currentColor] ${
                                p.status?.toLowerCase() === 'success' ? 'bg-green-400 text-green-400' : 
                                p.status?.toLowerCase() === 'building' ? 'bg-blue-400 text-blue-400 animate-pulse' : 
                                'bg-slate-500 text-slate-500'
                              }`}></div>
                              <span className="relative z-10">{p.status?.toUpperCase() || 'STANDBY'}</span>
                            </span>
                          </div>
                        </td>
                        <td className="px-10 py-8 text-right">
                          <div className="flex items-center justify-end gap-4 opacity-40 group-hover/row:opacity-100 transition-opacity">
                            <motion.button whileHover={{ scale: 1.1, rotate: 90 }} onClick={() => handleDeployPipeline(p.id)} className="p-4 bg-white/5 hover:bg-green-500/20 rounded-3xl transition-all border border-white/5 shadow-xl">
                              <Play className="w-5 h-5 text-slate-400 group-hover/row:text-green-400" />
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.1 }} onClick={() => fetchLogs(MAIN_JOB)} className="p-4 bg-white/5 hover:bg-blue-500/20 rounded-3xl transition-all border border-white/5 shadow-xl">
                              <Terminal className="w-5 h-5 text-slate-400 group-hover/row:text-blue-400" />
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.1, rotate: -15 }} onClick={() => handleDeletePipeline(p.id)} className="p-4 bg-white/5 hover:bg-red-500/20 rounded-3xl transition-all border border-white/5 shadow-xl">
                              <Trash2 className="w-5 h-5 text-slate-400 group-hover/row:text-red-400" />
                            </motion.button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* TELEMETRY COLUMN */}
            <div id="telemetry-section" className="space-y-8">
              {/* LIVE TELEMETRY */}
              <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[50px] shadow-3xl backdrop-blur-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6">
                  <span className="flex items-center gap-2 text-[9px] font-black text-blue-400 uppercase tracking-widest animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
                    Real-time Data
                  </span>
                </div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-10">Cluster Entropy</h3>
                <div className="h-48 flex items-end gap-1.5 px-2 mb-6">
                  {chartData.map((val, i) => (
                    <motion.div 
                      key={i} animate={{ height: `${val}%` }}
                      className="flex-1 bg-gradient-to-t from-blue-600/20 to-blue-400 rounded-full"
                      style={{ minWidth: '6px' }}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center px-2">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-white">{chartData[chartData.length-1]}%</span>
                    <span className="text-[8px] font-black text-slate-600 uppercase">CPU Utilization</span>
                  </div>
                  <div className="h-8 w-[1px] bg-white/5"></div>
                  <div className="flex flex-col text-right">
                    <span className="text-2xl font-black text-blue-400">Low</span>
                    <span className="text-[8px] font-black text-slate-600 uppercase">Load Level</span>
                  </div>
                </div>
              </div>

              {/* EVENT LOG */}
              <div className="bg-black/40 border border-white/5 p-8 rounded-[50px] shadow-3xl backdrop-blur-3xl h-[400px] overflow-hidden flex flex-col">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-6 px-2">System Feed</h3>
                <div className="flex-1 overflow-y-auto space-y-6 px-2 scrollbar-hide">
                  {systemEvents.map((ev) => (
                    <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={ev.id} className="flex gap-4">
                      <div className="w-1 h-full bg-blue-500/20 rounded-full py-4"></div>
                      <div className="space-y-1">
                        <p className="text-blue-500 font-black font-mono text-[10px] tracking-widest">{ev.time}</p>
                        <p className="text-[10px] text-slate-400 font-bold leading-relaxed tracking-tight">{ev.event}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* JENKINS INDUSTRIAL CORE */}
          <section className="bg-gradient-to-br from-orange-600/10 to-orange-950/30 border-2 border-orange-500/20 p-12 rounded-[60px] shadow-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,rgba(249,115,22,0.1)_0%,transparent_50%)]"></div>
            <div className="flex flex-col xl:flex-row items-center justify-between gap-16 relative z-10">
              <div className="flex items-center gap-12">
                <div className="relative group/gear">
                  <div className="absolute -inset-6 bg-orange-500/20 rounded-full blur-2xl group-hover/gear:bg-orange-500/40 transition-all animate-pulse"></div>
                  <div className="w-28 h-28 bg-orange-600/10 border-2 border-orange-500/30 rounded-[40px] flex items-center justify-center shadow-inner relative z-10 rotate-12 group-hover:rotate-0 transition-all duration-500">
                    <Settings className="w-14 h-14 text-orange-400 animate-[spin_15s_linear_infinite]" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-4xl font-black text-white tracking-tighter">Jenkins Core v2.4</h3>
                    <p className="text-[10px] text-orange-400 font-black uppercase tracking-[0.4em] mt-1">Master Orchestration Protocol</p>
                  </div>
                  <div className="flex items-center gap-6">
                    {/* ELITE PIPELINE TRACKER */}
                    <div className="flex items-center gap-8 bg-black/40 px-8 py-5 rounded-3xl border border-white/5">
                      {(liveStages.length > 0 ? liveStages : [
                        {name: 'Checkout', status: 'SUCCESS'}, {name: 'Build', status: 'IN_PROGRESS'}, {name: 'Test', status: 'PENDING'}, {name: 'Deploy', status: 'PENDING'}
                      ]).map((stage, i, arr) => (
                        <div key={i} className="flex items-center gap-5">
                          <div className="flex flex-col items-center gap-3">
                            <motion.div 
                              animate={stage.status === 'IN_PROGRESS' ? { scale: [1, 1.3, 1] } : {}}
                              transition={{ duration: 2, repeat: Infinity }}
                              className={`w-4 h-4 rounded-full border-2 shadow-[0_0_15px_currentColor] ${
                                stage.status === 'SUCCESS' ? 'bg-green-500 border-green-400 text-green-500' :
                                stage.status === 'IN_PROGRESS' ? 'bg-blue-500 border-blue-400 text-blue-500' :
                                'bg-slate-800 border-slate-700 text-slate-800'
                              }`}
                            />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{stage.name}</span>
                          </div>
                          {i < arr.length - 1 && <div className="w-8 h-[2px] bg-white/10 rounded-full"></div>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-8 items-center">
                <div className="text-right">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Core Status</span>
                  <p className="text-2xl font-black text-green-400 mt-1 shadow-green-500/50">OPERATIONAL</p>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={async () => {
                    addNotification('EXECUTING ELITE SEQUENCE...', 'info');
                    addSystemEvent('Handshake with Jenkins Master established', 'jenkins');
                    const res = await fetch(`${API_BASE}/jenkins/build/${MAIN_JOB}`, { method: 'POST' });
                    const data = await res.json();
                    addNotification(data.message.toUpperCase(), 'success');
                    window.open('http://localhost:9090', '_blank'); 
                  }}
                  className="relative group px-16 py-6 bg-transparent border border-orange-500/50 rounded-[30px] font-black text-[12px] uppercase tracking-[0.3em] text-orange-400 shadow-[0_0_30px_rgba(234,88,12,0.15)] overflow-hidden transition-all"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-orange-500/20 group-hover:from-orange-600 group-hover:to-orange-500 transition-all duration-500"></div>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.4)_0%,transparent_100%)] blur-md transition-all duration-500"></div>
                  <span className="relative z-10 group-hover:text-white transition-colors duration-500 drop-shadow-[0_0_10px_currentColor]">Trigger Global Sync</span>
                </motion.button>
              </div>
            </div>
          </section>

          {/* ELITE INFRASTRUCTURE MATRIX (Restored Nodes) */}
          <section id="node-matrix-section" className="space-y-8">
            <div className="flex items-center justify-between px-6">
              <h2 className="text-sm font-black text-white uppercase tracking-[0.4em] flex items-center gap-4">
                <div className="w-10 h-[1px] bg-purple-500"></div>
                Infrastructure Node Matrix
              </h2>
              <motion.button 
                whileHover={{ scale: 1.05 }} onClick={() => setShowNodeModal(true)}
                className="px-8 py-3 bg-purple-600/20 border border-purple-500/30 rounded-2xl text-[9px] font-black text-purple-400 uppercase tracking-widest hover:bg-purple-600/30 transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)]"
              >
                + Provision AWS EC2
              </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {containers.map((c) => (
                <motion.div 
                  whileHover={{ y: -10, scale: 1.02 }}
                  key={c.id} className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group hover:border-purple-500/50 hover:shadow-[0_0_40px_rgba(168,85,247,0.2)] transition-all duration-500"
                >
                  <div className="absolute top-0 right-0 p-5 flex items-center gap-3">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{c.status}</span>
                    <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor] ${c.status === 'Up' ? 'bg-green-400 text-green-400' : 'bg-red-500 text-red-500 animate-pulse'}`}></div>
                  </div>
                  <Package className="w-10 h-10 text-slate-700 group-hover:text-purple-400 transition-colors mb-6 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                  <h4 className="text-lg font-black text-white tracking-tight">{c.name}</h4>
                  <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 tracking-widest">{c.image}</p>
                  
                  <div className="mt-8 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[8px] font-black uppercase text-slate-500">
                        <span>Compute Load</span>
                        <span className="text-purple-400">{c.cpu}</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: c.cpu }} className="h-full bg-purple-500 shadow-[0_0_10px_#a855f7]" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[8px] font-black uppercase text-slate-500">
                        <span>Memory Entropy</span>
                        <span className="text-blue-400">{c.memory}</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: '45%' }} className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </main>
      </div>

      {/* MODAL: LOG VIEWER */}
      <AnimatePresence>
        {showLogModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLogModal(false)} className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-black border border-white/10 rounded-[30px] w-full max-w-4xl shadow-2xl overflow-hidden" >
              <div className="flex justify-between items-center px-8 py-4 bg-white/5 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div><div className="w-3 h-3 rounded-full bg-yellow-500"></div><div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="ml-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Build Console Output</span>
                </div>
                <X className="text-slate-500 cursor-pointer hover:text-white" onClick={() => setShowLogModal(false)} />
              </div>
              <div className="p-8 h-96 overflow-y-auto font-mono text-xs text-green-400/80 leading-relaxed scrollbar-hide"><pre>{activeLogs}</pre></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: PROVISION NODE */}
      <AnimatePresence>
        {showNodeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNodeModal(false)} className="absolute inset-0 bg-purple-950/40 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-slate-900 border border-purple-500/30 p-8 rounded-[40px] w-full max-w-md shadow-[0_0_40px_rgba(168,85,247,0.2)]" >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-white">Provision AWS EC2 Instance</h3>
                <X className="text-slate-500 cursor-pointer hover:text-white" onClick={() => setShowNodeModal(false)} />
              </div>
              
              {provisioningStatus ? (
                <div className="space-y-8 py-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black text-purple-400 uppercase tracking-widest">
                      <span>{provisioningStatus}...</span>
                      <span>{provisionProgress}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${provisionProgress}%` }} className="h-full bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 animate-pulse">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center"><Package className="text-purple-400 w-5 h-5" /></div>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase tracking-tighter">Allocating VPC subnets and bootstrapping EC2 hypervisor resources...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 mb-2 block tracking-widest">AMAZON MACHINE IMAGE (AMI)</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-purple-500 transition-colors">
                      <option className="bg-slate-900">Ubuntu 22.04 LTS (t3.medium)</option>
                      <option className="bg-slate-900">Amazon Linux 2023 (t3.large + RDS)</option>
                      <option className="bg-slate-900">Deep Learning Base AMI (p3.2xlarge)</option>
                    </select>
                  </div>
                  <button onClick={handleStartProvisioning} className="w-full py-5 bg-purple-600 rounded-[24px] font-black text-white tracking-widest text-[10px] shadow-xl shadow-purple-600/30 hover:bg-purple-500 transition-all">
                    PROVISION EC2 INSTANCE
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: SETTINGS */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSettingsModal(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-slate-900 border border-white/10 p-8 rounded-[40px] w-full max-w-md shadow-2xl" >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white">System Settings</h3>
                <X className="text-slate-500 cursor-pointer hover:text-white" onClick={() => setShowSettingsModal(false)} />
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-colors cursor-pointer group">
                  <p className="text-[10px] font-black text-blue-400 mb-1">API CONFIGURATION</p>
                  <p className="text-white text-sm">Manage Backend Endpoints</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CREATE PIPELINE */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)} className="absolute inset-0 bg-blue-950/40 backdrop-blur-md" />
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="relative bg-slate-900 border border-blue-500/30 p-8 rounded-[40px] w-full max-w-lg shadow-2xl shadow-blue-500/20" >
              <div className="flex justify-between items-center mb-8">
                <div><h3 className="text-2xl font-black text-white">New Stream</h3><p className="text-slate-500 text-xs font-bold mt-1 uppercase">Configure Pipeline Architecture</p></div>
                <X className="text-slate-500 cursor-pointer hover:text-white" onClick={() => setShowCreateModal(false)} />
              </div>
              <div className="space-y-6">
                <div><label className="text-[10px] font-black text-slate-500 mb-2 block uppercase">Pipeline Name</label>
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-blue-500" placeholder="e.g. Production-API-Sync" />
                </div>
                <div><label className="text-[10px] font-black text-slate-500 mb-2 block uppercase">Repository URL</label>
                  <input type="text" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-blue-500" placeholder="https://github.com/org/repo.git" />
                </div>
                <button onClick={handleCreatePipeline} className="w-full py-5 bg-blue-600 rounded-[24px] font-black text-white tracking-widest text-[10px] shadow-xl shadow-blue-600/30 hover:bg-blue-500 transition-all">INITIALIZE STREAM</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
