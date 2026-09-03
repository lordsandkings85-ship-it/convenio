import React, { useState, useEffect } from 'react';
import { Download, Clock, AlertTriangle, Users, Target, CheckCircle } from 'lucide-react';
import { getEnquiries } from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ReportsPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const data = await getEnquiries();
        setEnquiries(data);
      } catch (err) {
        console.error("Failed to load leads for reports", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  // --- CSV Export Logic ---
  const handleExportCSV = () => {
    if (enquiries.length === 0) return;
    
    const headers = ['ID', 'Name', 'Phone', 'Email', 'Location', 'Investment Capacity', 'Source', 'Status', 'Score', 'Created At'];
    
    const rows = enquiries.map(e => [
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
  };

  // --- Metrics Calculation ---
  
  // 1. Funnel
  const funnelData = [
    { name: 'Total Leads', count: enquiries.length, color: '#3b82f6' }, // blue
    { name: 'Contacted', count: enquiries.filter(e => e.status !== 'NEW').length, color: '#f59e0b' }, // amber
    { name: 'Interested', count: enquiries.filter(e => ['INTERESTED', 'EVALUATING', 'NEGOTIATION', 'CLOSED'].includes(e.status)).length, color: '#8b5cf6' }, // purple
    { name: 'Closed (Won)', count: enquiries.filter(e => e.status === 'CLOSED').length, color: '#10b981' } // emerald
  ];

  // 2. Response Times
  let totalResponseTimeMs = 0;
  let respondedCount = 0;
  let stagnantCount = 0;

  const now = new Date();

  enquiries.forEach(e => {
    const created = new Date(e.created_at);
    
    if (e.status !== 'NEW') {
      const updated = new Date(e.updated_at);
      if (updated > created) {
        totalResponseTimeMs += (updated - created);
        respondedCount++;
      }
    } else {
      // It's still NEW, check if it's stagnant (> 24 hours)
      const hoursDiff = (now - created) / (1000 * 60 * 60);
      if (hoursDiff > 24) {
        stagnantCount++;
      }
    }
  });

  const avgResponseTimeMs = respondedCount > 0 ? (totalResponseTimeMs / respondedCount) : 0;
  const avgResponseTimeHours = (avgResponseTimeMs / (1000 * 60 * 60)).toFixed(1);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#0b1120', letterSpacing: '-0.02em', lineHeight: 1.2 }}>Franchise Reports</div>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginTop: '4px' }}>Analyze your lead generation and sales performance.</div>
        </div>
        
        <button 
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-navy to-[#1a2542] hover:shadow-lg text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-md w-full sm:w-auto shrink-0 active:scale-95 btn-press"
        >
          <Download className="h-4 w-4" /> Export Leads (CSV)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Response Time Widget */}
        <div className="bg-white rounded-2xl border border-borderMuted/60 shadow-card p-6 flex items-start gap-4 card-base card-lift">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-600 rounded-2xl shrink-0 shadow-sm shadow-blue-500/10">
            <Clock className="h-8 w-8" />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Avg Time to First Contact</div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-navy">{avgResponseTimeHours}</span>
              <span className="text-inkLight font-bold">hours</span>
            </div>
            <p className="text-xs text-inkLight/70 mt-2 font-medium">
              Based on {respondedCount} leads that have progressed past 'New'.
            </p>
          </div>
        </div>

        {/* Stagnant Leads Widget */}
        <div className="bg-white rounded-2xl border border-borderMuted/60 shadow-card p-6 flex items-start gap-4 card-base card-lift">
          <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 text-primary rounded-2xl shrink-0 shadow-sm shadow-primary/10">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Stagnant Leads</div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-navy">{stagnantCount}</span>
              <span className="text-inkLight font-bold">leads</span>
            </div>
            <p className="text-xs text-inkLight/70 mt-2 font-medium">
              Leads sitting in 'New' status for more than 24 hours.
            </p>
          </div>
        </div>

      </div>

      {/* Funnel Chart */}
      <div className="bg-white rounded-2xl border border-borderMuted/60 shadow-card p-6 min-h-[400px] flex flex-col card-base">
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '16px', fontWeight: '800', color: '#0b1120' }}>Sales Funnel</div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Conversion drop-off across major pipeline stages.</div>
        </div>
        
        <div className="flex-1 min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontWeight: 'bold' }} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontWeight: 'bold' }}
              />
              <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={40}>
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Funnel Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-borderMuted">
          <div className="text-center p-4 bg-surface rounded-xl">
            <Users className="h-5 w-5 text-blue-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-inkLight uppercase">Total Leads</p>
            <p className="text-2xl font-black text-navy mt-1">{funnelData[0].count}</p>
          </div>
          <div className="text-center p-4 bg-surface rounded-xl">
            <Target className="h-5 w-5 text-amber-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-inkLight uppercase">Contacted</p>
            <p className="text-2xl font-black text-navy mt-1">{funnelData[1].count}</p>
          </div>
          <div className="text-center p-4 bg-surface rounded-xl">
            <AlertTriangle className="h-5 w-5 text-purple-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-inkLight uppercase">Interested</p>
            <p className="text-2xl font-black text-navy mt-1">{funnelData[2].count}</p>
          </div>
          <div className="text-center p-4 bg-surface rounded-xl">
            <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-inkLight uppercase">Closed</p>
            <p className="text-2xl font-black text-navy mt-1">{funnelData[3].count}</p>
          </div>
        </div>

      </div>

    </div>
  );
}
