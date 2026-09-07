import React, { useState, useEffect } from 'react';
import { Download, Clock, AlertTriangle, Users, Target, CheckCircle, TrendingUp, ArrowRight, Award, Zap } from 'lucide-react';
import { getEnquiries } from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ReportsPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchLeads = async () => {
      try {
        const data = await getEnquiries();
        if (isMounted) {
          setEnquiries(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load leads for reports", err);
        if (isMounted) {
          setEnquiries([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchLeads();
    return () => { isMounted = false; };
  }, []);

  const safeEnquiries = Array.isArray(enquiries) ? enquiries : [];

  // --- CSV Export Logic ---
  const handleExportCSV = () => {
    if (safeEnquiries.length === 0) return;
    setExporting(true);
    
    setTimeout(() => {
      const headers = ['ID', 'Name', 'Phone', 'Email', 'Location', 'Investment Capacity', 'Source', 'Status', 'Score', 'Created At'];
      
      const rows = safeEnquiries.map(e => [
        e.id,
        `"${e.name || ''}"`,
        `"${e.phone || ''}"`,
        `"${e.email || ''}"`,
        `"${e.location || ''}"`,
        `"${e.investment_capacity || ''}"`,
        e.source,
        e.status,
        e.score || 0,
        e.created_at
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `franchise_leads_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExporting(false);
    }, 300);
  };

  // --- Metrics Calculation ---
  
  // 1. Funnel
  const totalLeads = safeEnquiries.length;
  const contactedLeads = safeEnquiries.filter(e => e && e.status !== 'NEW').length;
  const interestedLeads = safeEnquiries.filter(e => e && ['INTERESTED', 'EVALUATING', 'NEGOTIATION', 'READY_TO_PAY', 'PAYMENT_RECEIVED', 'APPROVED', 'COMPLETED', 'CLOSED'].includes(e.status)).length;
  const wonLeads = safeEnquiries.filter(e => e && ['APPROVED', 'COMPLETED', 'CLOSED'].includes(e.status)).length;

  const funnelData = [
    { name: 'Total Leads', count: totalLeads, color: '#3b82f6', rate: '100%' },
    { name: 'Contacted', count: contactedLeads, color: '#f59e0b', rate: totalLeads > 0 ? `${Math.round((contactedLeads / totalLeads) * 100)}%` : '0%' },
    { name: 'Interested', count: interestedLeads, color: '#8b5cf6', rate: totalLeads > 0 ? `${Math.round((interestedLeads / totalLeads) * 100)}%` : '0%' },
    { name: 'Approved/Won', count: wonLeads, color: '#10b981', rate: totalLeads > 0 ? `${Math.round((wonLeads / totalLeads) * 100)}%` : '0%' }
  ];

  // 2. Response Times & Stagnant Leads
  let totalResponseTimeMs = 0;
  let respondedCount = 0;
  let stagnantCount = 0;

  const now = new Date();

  safeEnquiries.forEach(e => {
    if (!e || !e.created_at) return;
    const created = new Date(e.created_at);
    
    if (e.status !== 'NEW') {
      const updated = e.updated_at ? new Date(e.updated_at) : created;
      if (updated > created) {
        totalResponseTimeMs += (updated - created);
        respondedCount++;
      }
    } else {
      const hoursDiff = (now - created) / (1000 * 60 * 60);
      if (hoursDiff > 24) {
        stagnantCount++;
      }
    }
  });

  const avgResponseTimeMs = respondedCount > 0 ? (totalResponseTimeMs / respondedCount) : 0;
  const avgResponseTimeHours = (avgResponseTimeMs / (1000 * 60 * 60)).toFixed(1);
  const winRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Generating Pipeline Reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Franchise Reports & Funnel</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Real-time pipeline progression, SLA response benchmarks, and conversion velocity.
          </p>
        </div>
        
        <button 
          onClick={handleExportCSV}
          disabled={exporting || safeEnquiries.length === 0}
          className="admin-btn-secondary inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all disabled:opacity-50"
        >
          <Download className={`h-4 w-4 text-emerald-600 ${exporting ? 'animate-bounce' : ''}`} />
          {exporting ? 'Generating CSV...' : 'Export Leads (CSV)'}
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Avg Response Time */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 card-lift relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
          <div className="flex items-start justify-between">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shadow-inner">
              <Clock className="h-6 w-6" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              SLA Time
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg First Contact</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-black text-slate-900">{avgResponseTimeHours}</span>
              <span className="text-xs font-bold text-slate-500">hours</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              Calculated across {respondedCount} engaged applicants
            </p>
          </div>
        </div>

        {/* Stagnant Leads */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 card-lift relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
          <div className="flex items-start justify-between">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shadow-inner">
              <AlertTriangle className="h-6 w-6" />
            </div>
            {stagnantCount > 0 ? (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                Needs Action
              </span>
            ) : (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                Healthy
              </span>
            )}
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stagnant Leads</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className={`text-3xl font-black ${stagnantCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{stagnantCount}</span>
              <span className="text-xs font-bold text-slate-500">leads</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              In 'New' stage &gt; 24h without first contact
            </p>
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 card-lift relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
          <div className="flex items-start justify-between">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shadow-inner">
              <Award className="h-6 w-6" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              Conversion
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pipeline Win Rate</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-black text-emerald-600">{winRate}%</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              {wonLeads} closed deals out of {totalLeads} total leads
            </p>
          </div>
        </div>

        {/* Lead Velocity */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 card-lift relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
          <div className="flex items-start justify-between">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shadow-inner">
              <Zap className="h-6 w-6" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
              Active Focus
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Pipeline</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-black text-slate-900">{interestedLeads}</span>
              <span className="text-xs font-bold text-slate-500">qualified</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              Leads in evaluation, negotiation, or payment
            </p>
          </div>
        </div>

      </div>

      {/* Funnel Chart & Progression Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-lg font-black text-slate-900">Sales Conversion Funnel</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Stage-by-stage drop-off from incoming inquiries to closed franchise agreements</p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            Total Pipeline Volume: <strong className="text-slate-900">{totalLeads}</strong>
          </span>
        </div>
        
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData} layout="vertical" margin={{ top: 10, right: 40, left: 30, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontWeight: 'bold', fontSize: 12 }} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '10px 14px' }}
                formatter={(value, name, item) => [`${value} leads (${item.payload.rate} of total)`, 'Stage Count']}
              />
              <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={34}>
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Funnel Stats Interactive Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200/60 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 bg-blue-100/70 text-blue-600 rounded-lg">
                <Users className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                100%
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">1. Total Inquiries</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{funnelData[0].count}</p>
          </div>

          <div className="p-4 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200/60 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 bg-amber-100/70 text-amber-600 rounded-lg">
                <Target className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                {funnelData[1].rate}
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">2. Contacted</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{funnelData[1].count}</p>
          </div>

          <div className="p-4 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200/60 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 bg-purple-100/70 text-purple-600 rounded-lg">
                <TrendingUp className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                {funnelData[2].rate}
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">3. Qualified / Interested</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{funnelData[2].count}</p>
          </div>

          <div className="p-4 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200/60 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 bg-emerald-100/70 text-emerald-600 rounded-lg">
                <CheckCircle className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                {funnelData[3].rate}
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">4. Won / Closed</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{funnelData[3].count}</p>
          </div>
        </div>

      </div>

    </div>
  );
}

