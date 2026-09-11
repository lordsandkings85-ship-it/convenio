import React, { useState, useEffect, useMemo } from 'react';
import './ReportsPage.css';
import {
  Download, Clock, AlertTriangle, Users, Target, CheckCircle,
  TrendingUp, ArrowRight, Award, Zap, Bot, FileText, BarChart3,
  Phone, MapPin, DollarSign, RefreshCcw, PieChart as PieIcon,
  CheckCircle2, MessageSquare, Compass, ShieldAlert, Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';
import { getEnquiries } from '../lib/api';

const INTERESTED_SET = [
  'INTERESTED', 'EVALUATING', 'NEGOTIATION', 'READY_TO_PAY',
  'PAYMENT_RECEIVED', 'APPROVED', 'COMPLETED', 'CLOSED',
  'DOCUMENTS_REQUESTED', 'DOCUMENTS_RECEIVED', 'PAYMENT_DETAILS_SENT', 'PAYMENT_PENDING'
];

const WON_SET = ['APPROVED', 'COMPLETED', 'CLOSED', 'ONBOARDING', 'OPENED', 'PAYMENT_RECEIVED'];

export default function ReportsPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState('csv'); // 'csv' | 'xlsx'
  
  // Filtering states
  const [timeRange, setTimeRange] = useState('ALL'); // 'ALL' | '30D' | '7D' | 'TODAY'
  const [selectedSource, setSelectedSource] = useState('ALL'); // 'ALL' | 'CHAT' | 'FORM' | 'MANUAL'
  const [activeTab, setActiveTab] = useState('funnel'); // 'funnel' | 'trends' | 'channels' | 'demographics' | 'sla'
  const [selectedFunnelStep, setSelectedFunnelStep] = useState(null);

  const fetchLeads = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getEnquiries();
      setEnquiries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load leads for reports", err);
      setEnquiries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const safeEnquiries = Array.isArray(enquiries) ? enquiries : [];

  // --- Date & Source Filtered Leads ---
  const filteredEnquiries = useMemo(() => {
    const now = new Date();
    return safeEnquiries.filter(e => {
      if (!e) return false;
      
      // Source Filter
      if (selectedSource !== 'ALL') {
        if (selectedSource === 'MANUAL') {
          if (['CHAT', 'FORM'].includes(e.source)) return false;
        } else if (e.source !== selectedSource) {
          return false;
        }
      }

      // Time Filter
      if (timeRange !== 'ALL' && e.created_at) {
        const created = new Date(e.created_at);
        const diffMs = now - created;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (timeRange === 'TODAY' && diffDays > 1) return false;
        if (timeRange === '7D' && diffDays > 7) return false;
        if (timeRange === '30D' && diffDays > 30) return false;
      }

      return true;
    });
  }, [safeEnquiries, selectedSource, timeRange]);

  // --- KPI & Funnel Metrics Calculations ---
  const totalLeads = filteredEnquiries.length;
  const contactedLeads = filteredEnquiries.filter(e => e && e.status !== 'NEW').length;
  const interestedLeads = filteredEnquiries.filter(e => e && INTERESTED_SET.includes(e.status)).length;
  const wonLeads = filteredEnquiries.filter(e => e && WON_SET.includes(e.status)).length;

  // Response Time & Stagnant Calculations
  const { avgResponseTimeHours, respondedCount, stagnantCount, stagnantLeadsList, agingData } = useMemo(() => {
    let totalResponseTimeMs = 0;
    let responded = 0;
    let stagnant = 0;
    const stagnantList = [];
    const aging = { fresh: 0, moderate: 0, critical: 0 };
    const now = new Date();

    filteredEnquiries.forEach(e => {
      if (!e || !e.created_at) return;
      const created = new Date(e.created_at);
      const hoursOld = (now - created) / (1000 * 60 * 60);

      // Aging breakdown
      if (hoursOld < 24) aging.fresh++;
      else if (hoursOld <= 72) aging.moderate++;
      else aging.critical++;

      if (e.status !== 'NEW') {
        const updated = e.updated_at ? new Date(e.updated_at) : created;
        if (updated > created) {
          totalResponseTimeMs += (updated - created);
          responded++;
        }
      } else {
        if (hoursOld > 24) {
          stagnant++;
          stagnantList.push({
            ...e,
            hoursWaiting: Math.round(hoursOld)
          });
        }
      }
    });

    const avgMs = responded > 0 ? (totalResponseTimeMs / responded) : 0;
    const avgHours = (avgMs / (1000 * 60 * 60)).toFixed(1);

    return {
      avgResponseTimeHours: avgHours,
      respondedCount: responded,
      stagnantCount: stagnant,
      stagnantLeadsList: stagnantList.sort((a, b) => b.hoursWaiting - a.hoursWaiting),
      agingData: aging
    };
  }, [filteredEnquiries]);

  const winRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0.0';

  // --- Funnel Stages ---
  const funnelStages = useMemo(() => {
    const contactRate = totalLeads > 0 ? Math.round((contactedLeads / totalLeads) * 100) : 0;
    const qualifiedRate = totalLeads > 0 ? Math.round((interestedLeads / totalLeads) * 100) : 0;
    const wonRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

    const drop1 = totalLeads > 0 ? Math.round(((totalLeads - contactedLeads) / totalLeads) * 100) : 0;
    const drop2 = contactedLeads > 0 ? Math.round(((contactedLeads - interestedLeads) / contactedLeads) * 100) : 0;
    const drop3 = interestedLeads > 0 ? Math.round(((interestedLeads - wonLeads) / (interestedLeads || 1)) * 100) : 0;

    return [
      {
        id: 'step-1',
        stepNum: '01',
        name: 'Incoming Inquiries',
        subname: 'All registered franchise leads in selected window',
        count: totalLeads,
        ratePercent: 100,
        rateText: '100%',
        dropOff: 0,
        color: '#2563eb',
        lightBg: '#eff6ff',
        gradient: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
        Icon: Users,
        statusFilter: () => true
      },
      {
        id: 'step-2',
        stepNum: '02',
        name: 'First Contact Established',
        subname: 'Engaged via call, WhatsApp, or AI Bot conversation',
        count: contactedLeads,
        ratePercent: contactRate,
        rateText: `${contactRate}%`,
        dropOff: drop1,
        color: '#ea580c',
        lightBg: '#fff7ed',
        gradient: 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)',
        Icon: Target,
        statusFilter: (e) => e.status !== 'NEW'
      },
      {
        id: 'step-3',
        stepNum: '03',
        name: 'Qualified & In Discussion',
        subname: 'Budget verified, location vetted, commercial negotiations',
        count: interestedLeads,
        ratePercent: qualifiedRate,
        rateText: `${qualifiedRate}%`,
        dropOff: drop2,
        color: '#7c3aed',
        lightBg: '#f5f3ff',
        gradient: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)',
        Icon: TrendingUp,
        statusFilter: (e) => INTERESTED_SET.includes(e.status)
      },
      {
        id: 'step-4',
        stepNum: '04',
        name: 'Won & Approved Partners',
        subname: 'Franchise agreement executed and store onboarding launched',
        count: wonLeads,
        ratePercent: wonRate,
        rateText: `${wonRate}%`,
        dropOff: drop3,
        color: '#059669',
        lightBg: '#ecfdf5',
        gradient: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
        Icon: CheckCircle,
        statusFilter: (e) => WON_SET.includes(e.status)
      }
    ];
  }, [totalLeads, contactedLeads, interestedLeads, wonLeads]);

  // Funnel Bottleneck Diagnostic
  const bottleneckInsight = useMemo(() => {
    if (totalLeads === 0) return null;
    const drops = [
      { from: 'Step 1', to: 'Step 2', label: 'Initial Outreach', drop: funnelStages[1].dropOff },
      { from: 'Step 2', to: 'Step 3', label: 'Qualification / Pitching', drop: funnelStages[2].dropOff },
      { from: 'Step 3', to: 'Step 4', label: 'Closing & Agreement', drop: funnelStages[3].dropOff },
    ];
    drops.sort((a, b) => b.drop - a.drop);
    const maxDrop = drops[0];
    if (maxDrop.drop <= 0) {
      return {
        stage: 'High Velocity',
        message: '100% pipeline retention! All leads are advancing smoothly through every conversion milestone.',
        isPositive: true
      };
    }
    return {
      stage: `${maxDrop.from} → ${maxDrop.to} (${maxDrop.label})`,
      message: `Highest drop-off detected at ${maxDrop.drop}%. Consider accelerating SLA follow-up or streamlining documentation.`,
      isPositive: false
    };
  }, [totalLeads, funnelStages]);

  // Stage Drill-down list
  const stageLeads = useMemo(() => {
    const stage = funnelStages.find(s => s.id === selectedFunnelStep);
    if (!stage) return { list: [], total: 0 };
    const matched = filteredEnquiries.filter(stage.statusFilter);
    const sorted = [...matched].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return { list: sorted.slice(0, 6), total: matched.length };
  }, [filteredEnquiries, selectedFunnelStep, funnelStages]);

  // --- Trends Chart Data (Last 7 or 14 Days) ---
  const trendsChartData = useMemo(() => {
    const daysToShow = timeRange === '30D' ? 14 : 7;
    const result = [];
    const today = new Date();

    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

      const dayLeads = filteredEnquiries.filter(e => e?.created_at && e.created_at.startsWith(dateStr));
      const chatCount = dayLeads.filter(e => e?.source === 'CHAT').length;
      const formCount = dayLeads.filter(e => e?.source === 'FORM').length;
      const manualCount = dayLeads.filter(e => !['CHAT', 'FORM'].includes(e?.source)).length;

      result.push({
        date: dayLabel,
        total: dayLeads.length,
        chat: chatCount,
        form: formCount,
        manual: manualCount,
      });
    }

    return result;
  }, [filteredEnquiries, timeRange]);

  // --- Channel Matrix Data ---
  const channelData = useMemo(() => {
    const channels = [
      { name: 'AI Chatbot', id: 'CHAT', icon: Bot, iconBg: '#ecfdf5', iconColor: '#059669', color: '#10b981' },
      { name: 'Website Form', id: 'FORM', icon: FileText, iconBg: '#eff6ff', iconColor: '#2563eb', color: '#3b82f6' },
      { name: 'Direct / Manual', id: 'MANUAL', icon: Users, iconBg: '#f5f3ff', iconColor: '#7c3aed', color: '#8b5cf6' }
    ];

    return channels.map(ch => {
      const chLeads = filteredEnquiries.filter(e => ch.id === 'MANUAL' ? !['CHAT', 'FORM'].includes(e?.source) : e?.source === ch.id);
      const chTotal = chLeads.length;
      const chContacted = chLeads.filter(e => e.status !== 'NEW').length;
      const chWon = chLeads.filter(e => WON_SET.includes(e.status)).length;
      const chQualified = chLeads.filter(e => INTERESTED_SET.includes(e.status)).length;
      const avgScore = chTotal > 0 ? Math.round(chLeads.reduce((acc, curr) => acc + (curr.score || 0), 0) / chTotal) : 0;
      const conversion = chTotal > 0 ? ((chWon / chTotal) * 100).toFixed(1) : '0.0';
      const share = totalLeads > 0 ? Math.round((chTotal / totalLeads) * 100) : 0;

      return {
        ...ch,
        total: chTotal,
        contacted: chContacted,
        qualified: chQualified,
        won: chWon,
        avgScore,
        conversionRate: conversion,
        sharePct: share,
        value: chTotal
      };
    });
  }, [filteredEnquiries, totalLeads]);

  // --- Demographic & Tier Calculations ---
  const { topCities, investmentBrackets } = useMemo(() => {
    // 1. Cities
    const cityMap = {};
    filteredEnquiries.forEach(e => {
      const loc = (e.location || 'Unknown').trim().split(',')[0].trim();
      const city = loc.charAt(0).toUpperCase() + loc.slice(1);
      if (!cityMap[city]) cityMap[city] = { name: city, count: 0, won: 0 };
      cityMap[city].count++;
      if (WON_SET.includes(e.status)) cityMap[city].won++;
    });
    const cities = Object.values(cityMap).sort((a, b) => b.count - a.count).slice(0, 6);

    // 2. Investment Brackets
    const brackets = {
      'Tier 1 (₹10L - ₹20L)': 0,
      'Tier 2 (₹20L - ₹35L)': 0,
      'Tier 3 (₹35L - ₹50L)': 0,
      'Enterprise (₹50L+)': 0,
      'Unspecified': 0
    };

    filteredEnquiries.forEach(e => {
      const cap = (e.investment_capacity || '').toLowerCase();
      if (cap.includes('50') || cap.includes('crore') || cap.includes('1 cr') || cap.includes('enterprise')) {
        brackets['Enterprise (₹50L+)']++;
      } else if (cap.includes('35') || cap.includes('40') || cap.includes('45')) {
        brackets['Tier 3 (₹35L - ₹50L)']++;
      } else if (cap.includes('20') || cap.includes('25') || cap.includes('30')) {
        brackets['Tier 2 (₹20L - ₹35L)']++;
      } else if (cap.includes('10') || cap.includes('15')) {
        brackets['Tier 1 (₹10L - ₹20L)']++;
      } else {
        brackets['Unspecified']++;
      }
    });

    return {
      topCities: cities,
      investmentBrackets: Object.entries(brackets).map(([name, count]) => ({
        name,
        count,
        pct: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0
      }))
    };
  }, [filteredEnquiries, totalLeads]);

  // --- Export Handlers ---
  const handleExport = (type = 'csv') => {
    if (filteredEnquiries.length === 0) return;
    setExporting(true);
    setExportType(type);

    setTimeout(() => {
      const exportData = filteredEnquiries.map(e => ({
        ID: e.id,
        Name: e.name || '',
        Phone: e.phone || '',
        Email: e.email || '',
        Location: e.location || '',
        'Investment Capacity': e.investment_capacity || '',
        Source: e.source || '',
        Status: (e.status || '').replace(/_/g, ' '),
        Score: e.score || 0,
        'Created At': e.created_at ? new Date(e.created_at).toLocaleString('en-IN') : ''
      }));

      const dateStr = new Date().toISOString().split('T')[0];

      if (type === 'xlsx') {
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Pipeline Leads');
        XLSX.writeFile(workbook, `convenio_pipeline_report_${dateStr}.xlsx`);
      } else {
        const headers = Object.keys(exportData[0] || {}).join(',');
        const rows = exportData.map(row => Object.values(row).map(v => `"${v}"`).join(','));
        const csvContent = [headers, ...rows].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `convenio_pipeline_report_${dateStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setExporting(false);
    }, 400);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '360px', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e01a22', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Generating Pipeline Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', paddingBottom: '24px' }}>
      
      {/* ── Top Executive Header & Filter Command Bar ── */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '20px 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ padding: '10px', borderRadius: '12px', background: 'rgba(224,26,34,0.1)', color: '#e01a22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart3 style={{ width: '20px', height: '20px' }} />
            </span>
            <div>
              <h1 className="admin-page-title">Reports & Analytics</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }}></span>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Live Intelligence &bull; {filteredEnquiries.length} of {safeEnquiries.length} Leads Analyzed
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls & Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
          
          {/* Time Range Pills */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            {[
              { id: 'ALL', label: 'All Time' },
              { id: '30D', label: '30 Days' },
              { id: '7D', label: '7 Days' },
              { id: 'TODAY', label: 'Today' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTimeRange(t.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: timeRange === t.id ? '900' : '700',
                  color: timeRange === t.id ? '#0b1120' : '#64748b',
                  background: timeRange === t.id ? '#ffffff' : 'transparent',
                  boxShadow: timeRange === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Source Dropdown Filter */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedSource}
              onChange={e => setSelectedSource(e.target.value)}
              style={{
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: '800',
                background: '#ffffff',
                color: '#334155',
                border: '1.5px solid #e2e8f0',
                borderRadius: '12px',
                outline: 'none',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
              }}
            >
              <option value="ALL">All Sources</option>
              <option value="CHAT">🤖 AI Chatbot Only</option>
              <option value="FORM">📝 Web Form Only</option>
              <option value="MANUAL">👤 Direct / Manual Only</option>
            </select>
          </div>

          {/* Refresh Trigger */}
          <button
            onClick={() => fetchLeads(true)}
            disabled={refreshing}
            style={{
              padding: '8px 10px',
              borderRadius: '12px',
              background: '#f8fafc',
              color: '#475569',
              border: '1.5px solid #e2e8f0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
            title="Refresh Data"
          >
            <RefreshCcw style={{ width: '16px', height: '16px', color: refreshing ? '#e01a22' : '#64748b' }} className={refreshing ? 'animate-spin' : ''} />
          </button>

          {/* Export Dropdown Group */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#0b1120', padding: '4px', borderRadius: '12px', boxShadow: '0 2px 6px rgba(11,17,32,0.15)' }}>
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting || filteredEnquiries.length === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '800',
                color: '#ffffff',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '8px',
                opacity: (exporting || filteredEnquiries.length === 0) ? 0.5 : 1
              }}
            >
              <Download style={{ width: '14px', height: '14px', color: '#e01a22' }} className={exporting && exportType === 'csv' ? 'animate-bounce' : ''} />
              CSV
            </button>
            <span style={{ color: '#334155', padding: '0 4px' }}>|</span>
            <button
              onClick={() => handleExport('xlsx')}
              disabled={exporting || filteredEnquiries.length === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '800',
                color: '#34d399',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '8px',
                opacity: (exporting || filteredEnquiries.length === 0) ? 0.5 : 1
              }}
            >
              <FileSpreadsheet style={{ width: '14px', height: '14px', color: '#34d399' }} className={exporting && exportType === 'xlsx' ? 'animate-bounce' : ''} />
              Excel
            </button>
          </div>

        </div>
      </div>

      {/* ── 4-Card Executive KPI Command Row ── */}
      <div className="admin-metrics-grid shrink-0">
        {[
          { 
            label: 'Avg First Contact', 
            value: `${avgResponseTimeHours}h`, 
            trend: `Across ${respondedCount} engaged`, 
            trendColor: '#2563eb', 
            iconBg: '#eff6ff', 
            iconColor: '#2563eb', 
            Icon: Clock 
          },
          { 
            label: 'Stagnant Leads', 
            value: stagnantCount, 
            trend: stagnantCount > 0 ? "Awaiting > 24h" : 'All in SLA', 
            trendColor: stagnantCount > 0 ? '#ea580c' : '#059669', 
            iconBg: stagnantCount > 0 ? '#fff7ed' : '#ecfdf5', 
            iconColor: stagnantCount > 0 ? '#ea580c' : '#059669', 
            Icon: AlertTriangle 
          },
          { 
            label: 'Pipeline Win Rate', 
            value: `${winRate}%`, 
            trend: `${wonLeads} won of ${totalLeads}`, 
            trendColor: '#059669', 
            iconBg: '#ecfdf5', 
            iconColor: '#059669', 
            Icon: Award 
          },
          { 
            label: 'Active Pipeline', 
            value: interestedLeads, 
            trend: 'In negotiation', 
            trendColor: '#7c3aed', 
            iconBg: '#f5f3ff', 
            iconColor: '#7c3aed', 
            Icon: Zap 
          },
        ].map(({ label, value, trend, trendColor, iconBg, iconColor, Icon }) => (
          <div key={label} className="admin-metric-card card-base card-lift">
            <div className="admin-metric-info">
              <p className="admin-metric-label">{label}</p>
              <p className="admin-metric-value">{value}</p>
              <p className="admin-metric-trend" style={{ color: trendColor }}>{trend}</p>
            </div>
            <div className="admin-metric-icon-box" style={{ background: iconBg, color: iconColor }}>
              <Icon style={{ width: '22px', height: '22px' }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Tab Navigation Selector ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }} className="admin-scroll">
        {[
          { id: 'funnel', label: 'Overview & Conversion Funnel', icon: Target },
          { id: 'trends', label: 'Acquisition Trends & Velocity', icon: TrendingUp },
          { id: 'channels', label: 'Channel Attribution Matrix', icon: Award },
          { id: 'demographics', label: 'Demographics & Investment Tiers', icon: Compass },
          { id: 'sla', label: 'SLA & Lead Aging Radar', icon: Clock, count: stagnantCount > 0 ? stagnantCount : null }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '16px',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? '900' : '700',
              color: activeTab === tab.id ? '#ffffff' : '#475569',
              background: activeTab === tab.id ? 'linear-gradient(135deg, #0b1120 0%, #1a2542 100%)' : '#ffffff',
              border: activeTab === tab.id ? 'none' : '1px solid #e2e8f0',
              boxShadow: activeTab === tab.id ? '0 4px 14px rgba(11,17,32,0.18)' : '0 1px 3px rgba(0,0,0,0.02)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <tab.icon style={{ width: '16px', height: '16px', color: activeTab === tab.id ? '#e01a22' : '#64748b' }} />
            <span>{tab.label}</span>
            {tab.count !== null && tab.count !== undefined && (
              <span style={{
                padding: '2px 8px',
                borderRadius: '50px',
                fontSize: '11px',
                fontWeight: '900',
                background: activeTab === tab.id ? '#e01a22' : '#fee2e2',
                color: activeTab === tab.id ? '#ffffff' : '#b91c1c'
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          TAB 1: OVERVIEW & CONVERSION FUNNEL
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'funnel' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="anim-fade-up">
          
          {/* Funnel Card */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }} className="card-base">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ padding: '8px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb' }}>
                    <Target style={{ width: '18px', height: '18px' }} />
                  </span>
                  <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#0b1120' }}>Sales Conversion Funnel</h2>
                </div>
                <p style={{ fontSize: '12.5px', color: '#64748b', fontWeight: '500', marginTop: '4px' }}>
                  Stage-by-stage drop-off and conversion progression from incoming inquiries to closed franchise agreements.
                </p>
              </div>
              <div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', color: '#334155', background: '#f8fafc', padding: '8px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <Users style={{ width: '14px', height: '14px', color: '#2563eb' }} />
                  Total Pipeline: <strong style={{ color: '#0b1120', fontWeight: '900' }}>{totalLeads} Leads</strong>
                </span>
              </div>
            </div>

            {/* Stepped Funnel Lanes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {funnelStages.map((stage, index, arr) => {
                const hasLeads = stage.count > 0;
                const widthPct = totalLeads > 0 ? (stage.count / totalLeads) * 100 : 0;
                const isSelected = selectedFunnelStep === stage.id;

                return (
                  <React.Fragment key={stage.id}>
                    <div
                      style={{
                        padding: '20px 24px',
                        borderRadius: '16px',
                        border: isSelected ? '1.5px solid #0b1120' : '1px solid #e2e8f0',
                        background: isSelected ? '#f8fafc' : 'rgba(248, 250, 252, 0.7)',
                        boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.06)' : '0 1px 2px rgba(0,0,0,0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => setSelectedFunnelStep(isSelected ? null : stage.id)}
                      className="card-base"
                    >
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                        
                        {/* Stage Label & Info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '260px', flexShrink: 0 }}>
                          <div 
                            style={{ width: '44px', height: '44px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: stage.lightBg, color: stage.color, flexShrink: 0, boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)' }}
                          >
                            <stage.Icon style={{ width: '20px', height: '20px' }} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', background: '#ffffff', padding: '2px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                Step {stage.stepNum}
                              </span>
                              <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#0b1120' }}>{stage.name}</h3>
                            </div>
                            <p style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '500', marginTop: '2px' }}>{stage.subname}</p>
                          </div>
                        </div>

                        {/* Progress Bar Track */}
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <div style={{ width: '100%', background: '#e2e8f0', borderRadius: '12px', height: '44px', padding: '4px', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                            {hasLeads ? (
                              <div
                                style={{
                                  height: '100%',
                                  borderRadius: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '0 16px',
                                  width: `${Math.max(18, widthPct)}%`,
                                  background: stage.gradient,
                                  transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                                }}
                              >
                                <span style={{ fontSize: '12px', fontWeight: '900', color: '#ffffff', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>{stage.count} {stage.count === 1 ? 'Lead' : 'Leads'}</span>
                                  <span style={{ opacity: 0.85, fontSize: '11px', fontWeight: '700' }}>({stage.rateText})</span>
                                </span>
                              </div>
                            ) : (
                              <div style={{ padding: '0 16px', fontSize: '12px', fontWeight: '700', color: '#94a3b8', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#cbd5e1' }}></span>
                                <span>0 Leads &bull; 0% conversion</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Retention & Drop-off Indicators */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                          <div>
                            <span 
                              style={{ fontSize: '12px', fontWeight: '900', padding: '7px 14px', borderRadius: '12px', border: `1px solid ${stage.color}35`, background: stage.lightBg, color: stage.color, display: 'inline-block' }}
                            >
                              <strong>{stage.rateText}</strong> of pipeline
                            </span>
                          </div>

                          {index > 0 && (
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '900',
                              padding: '6px 12px',
                              borderRadius: '12px',
                              border: stage.dropOff > 0 ? '1px solid #fecaca' : '1px solid #a7f3d0',
                              background: stage.dropOff > 0 ? '#fef2f2' : '#ecfdf5',
                              color: stage.dropOff > 0 ? '#b91c1c' : '#047857'
                            }}>
                              {stage.dropOff > 0 ? `-${stage.dropOff}% drop` : '100% held'}
                            </span>
                          )}
                        </div>

                      </div>
                    </div>

                    {/* Step Flow Transition Line */}
                    {index < arr.length - 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '32px', opacity: 0.85 }}>
                        <div style={{ height: '14px', width: '2px', background: '#cbd5e1', borderRadius: '2px' }}></div>
                        <span style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ArrowRight style={{ width: '12px', height: '12px', color: '#94a3b8' }} />
                          {arr[index + 1].dropOff > 0 ? `${arr[index + 1].dropOff}% drop-off to next step` : '100% retention to next step'}
                        </span>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Funnel Bottleneck Diagnostic Alert */}
            {bottleneckInsight && (
              <div style={{
                marginTop: '24px',
                padding: '16px 20px',
                borderRadius: '16px',
                border: bottleneckInsight.isPositive ? '1px solid #a7f3d0' : '1px solid #fed7aa',
                background: bottleneckInsight.isPositive ? '#ecfdf5' : '#fff7ed',
                display: 'flex',
                alignItems: 'center',
                gap: '14px'
              }}>
                <div style={{
                  padding: '8px',
                  borderRadius: '10px',
                  background: bottleneckInsight.isPositive ? '#d1fae5' : '#ffedd5',
                  color: bottleneckInsight.isPositive ? '#065f46' : '#9a3412',
                  flexShrink: 0
                }}>
                  <Sparkles style={{ width: '18px', height: '18px' }} />
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.06em', color: bottleneckInsight.isPositive ? '#065f46' : '#9a3412', display: 'block', marginBottom: '2px' }}>
                    Pipeline Velocity Diagnostic &bull; {bottleneckInsight.stage}
                  </span>
                  <p style={{ fontSize: '12px', color: '#334155', fontWeight: '600' }}>{bottleneckInsight.message}</p>
                </div>
              </div>
            )}

            {/* Funnel 4-Stage KPI Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 mt-8 pt-7" style={{ borderTop: '1px solid #f1f5f9' }}>
              {[
                { step: 'Step 1', name: 'Total Inquiries', count: totalLeads, rate: '100%', color: '#3b82f6', bg: '#eff6ff', Icon: Users, desc: 'Top of funnel volume' },
                { step: 'Step 2', name: 'First Contact', count: contactedLeads, rate: `${funnelStages[1].rateText}`, color: '#ea580c', bg: '#fff7ed', Icon: Target, desc: 'Engaged via call / chat' },
                { step: 'Step 3', name: 'Qualified / Interest', count: interestedLeads, rate: `${funnelStages[2].rateText}`, color: '#7c3aed', bg: '#f5f3ff', Icon: TrendingUp, desc: 'Evaluation & terms' },
                { step: 'Step 4', name: 'Won & Approved', count: wonLeads, rate: `${funnelStages[3].rateText}`, color: '#059669', bg: '#ecfdf5', Icon: CheckCircle, desc: 'Signed agreements' },
              ].map(({ step, name, count, rate, color, bg, Icon, desc }) => (
                <div 
                  key={step} 
                  style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
                  className="card-base card-lift"
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ padding: '6px', borderRadius: '10px', background: bg, color: color }}>
                          <Icon style={{ width: '16px', height: '16px' }} />
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '6px' }}>
                          {step}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '900', padding: '2px 8px', borderRadius: '50px', border: `1px solid ${color}35`, background: bg, color: color }}>
                        {rate}
                      </span>
                    </div>

                    <p style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{name}</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
                      <span style={{ fontSize: '26px', fontWeight: '900', color: '#0b1120', letterSpacing: '-0.02em' }}>{count}</span>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8' }}>leads</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                    <p style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Expandable stage drill-down */}
            {selectedFunnelStep && (
              <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }} className="anim-fade-up">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0b1120' }}>
                    Active Leads at {funnelStages.find(s => s.id === selectedFunnelStep)?.name} ({stageLeads.total})
                  </span>
                  <button
                    onClick={() => setSelectedFunnelStep(null)}
                    style={{ fontSize: '11px', fontWeight: '800', color: '#e01a22', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    Close Drill-down ✕
                  </button>
                </div>
                {stageLeads.total > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {stageLeads.list.map(lead => (
                      <div key={lead.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: '900', color: '#0b1120' }}>{lead.name || 'Unnamed'}</p>
                            <p style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>{lead.phone || 'No phone'}</p>
                          </div>
                          <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', padding: '2px 8px', borderRadius: '6px', background: '#ffffff', border: '1px solid #e2e8f0', color: '#475569' }}>
                            {lead.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                          <span>{lead.location || 'Location N/A'}</span>
                          <span>Score: {lead.score || 50}/100</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>No leads currently in this stage.</p>
                )}
              </div>
            )}

          </div>

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 2: ACQUISITION TRENDS & VELOCITY
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'trends' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 anim-fade-up">
          
          {/* Main Area Chart */}
          <div className="lg:col-span-2" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '24px 28px', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0b1120', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp style={{ width: '18px', height: '18px', color: '#e01a22' }} />
                  <span>Lead Acquisition Velocity</span>
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Daily incoming prospective franchise inquiries across time</p>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '800', background: '#eff6ff', color: '#1d4ed8', padding: '4px 12px', borderRadius: '50px', border: '1px solid #dbeafe' }}>
                {timeRange === '30D' ? 'Past 14 Days' : 'Past 7 Days'}
              </span>
            </div>

            <div style={{ height: '280px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e01a22" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#e01a22" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} dy={8} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                  <RechartsTooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '12px 14px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.12)', fontSize: '12px' }}>
                            <p style={{ fontWeight: '800', color: '#0b1120', marginBottom: '4px' }}>{label}</p>
                            <p style={{ color: '#e01a22', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e01a22' }}></span>
                              {d.total} Total Leads
                            </p>
                            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: '#64748b' }}>
                              <span>🤖 Chatbot: <strong>{d.chat}</strong></span>
                              <span>📝 Form: <strong>{d.form}</strong></span>
                              <span>👤 Direct: <strong>{d.manual}</strong></span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#e01a22" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorTotal)"
                    dot={{ r: 4, strokeWidth: 2, fill: '#ffffff', stroke: '#e01a22' }} 
                    activeDot={{ r: 6, fill: '#e01a22', stroke: '#ffffff', strokeWidth: 2 }} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom Velocity Mini-Stats */}
            <div className="grid grid-cols-3 gap-3 pt-5 mt-4 text-center" style={{ borderTop: '1px solid #f1f5f9' }}>
              <div>
                <p style={{ fontSize: '10.5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>Total Enquiries</p>
                <p style={{ fontSize: '20px', fontWeight: '900', color: '#0b1120', marginTop: '2px' }}>{totalLeads}</p>
              </div>
              <div>
                <p style={{ fontSize: '10.5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>Avg Intake / Day</p>
                <p style={{ fontSize: '20px', fontWeight: '900', color: '#0b1120', marginTop: '2px' }}>
                  {(totalLeads / (timeRange === '30D' ? 30 : timeRange === '7D' ? 7 : 1)).toFixed(1)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '10.5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>Lead Conversion</p>
                <p style={{ fontSize: '20px', fontWeight: '900', color: '#059669', marginTop: '2px' }}>{winRate}%</p>
              </div>
            </div>
          </div>

          {/* Channel Share Donut */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '24px 28px', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0b1120', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieIcon style={{ width: '18px', height: '18px', color: '#2563eb' }} />
                <span>Channel Share</span>
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Volume distribution by lead acquisition source</p>
            </div>

            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={78}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
              {channelData.map(ch => (
                <div key={ch.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: ch.color }}></span>
                    {ch.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#0b1120', fontWeight: '900' }}>{ch.total} leads</span>
                    <span style={{ color: '#94a3b8', fontSize: '11px' }}>({ch.sharePct}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 3: CHANNEL ATTRIBUTION MATRIX
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'channels' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '24px 28px', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }} className="anim-fade-up">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #f1f5f9' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ padding: '8px', borderRadius: '12px', background: '#f5f3ff', color: '#7c3aed' }}>
                  <Award style={{ width: '18px', height: '18px' }} />
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#0b1120' }}>Acquisition Channel Performance Matrix</h2>
              </div>
              <p style={{ fontSize: '12.5px', color: '#64748b', fontWeight: '500', marginTop: '4px' }}>
                Comparative analysis of lead quality, engagement rate, qualification velocity, and closing rate by intake stream.
              </p>
            </div>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>
              {channelData.length} Channels Tracked
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <th style={{ paddingBottom: '14px', paddingLeft: '12px', paddingRight: '12px' }}>Channel Source</th>
                  <th style={{ paddingBottom: '14px', paddingLeft: '12px', paddingRight: '12px', textAlign: 'center' }}>Volume</th>
                  <th style={{ paddingBottom: '14px', paddingLeft: '12px', paddingRight: '12px', textAlign: 'center' }}>Share</th>
                  <th style={{ paddingBottom: '14px', paddingLeft: '12px', paddingRight: '12px', textAlign: 'center' }}>Contacted SLA</th>
                  <th style={{ paddingBottom: '14px', paddingLeft: '12px', paddingRight: '12px', textAlign: 'center' }}>In Negotiation</th>
                  <th style={{ paddingBottom: '14px', paddingLeft: '12px', paddingRight: '12px', textAlign: 'center' }}>Won Agreements</th>
                  <th style={{ paddingBottom: '14px', paddingLeft: '12px', paddingRight: '12px', textAlign: 'center' }}>Avg Score</th>
                  <th style={{ paddingBottom: '14px', paddingLeft: '12px', paddingRight: '12px', textAlign: 'right' }}>Win Rate</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155' }}>
                {channelData.map(ch => (
                  <tr key={ch.name} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                    <td style={{ padding: '16px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '8px', borderRadius: '12px', background: ch.iconBg, color: ch.iconColor, flexShrink: 0 }}>
                          <ch.icon style={{ width: '16px', height: '16px' }} />
                        </div>
                        <div>
                          <span style={{ fontWeight: '900', color: '#0b1120', fontSize: '13.5px' }}>{ch.name}</span>
                          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>Direct intake stream</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'center', fontWeight: '900', color: '#0b1120', fontSize: '14px' }}>
                      {ch.total}
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                      <span style={{ background: '#f1f5f9', color: '#334155', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '800' }}>
                        {ch.sharePct}%
                      </span>
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'center', fontWeight: '700', color: '#334155' }}>
                      {ch.contacted} <span style={{ color: '#94a3b8', fontWeight: '500' }}>leads</span>
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'center', fontWeight: '800', color: '#7c3aed' }}>
                      {ch.qualified}
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'center', fontWeight: '900', color: '#059669' }}>
                      {ch.won}
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontWeight: '900',
                        fontSize: '11.5px',
                        background: ch.avgScore >= 70 ? '#ecfdf5' : ch.avgScore >= 40 ? '#eff6ff' : '#f1f5f9',
                        color: ch.avgScore >= 70 ? '#047857' : ch.avgScore >= 40 ? '#1d4ed8' : '#475569',
                        border: ch.avgScore >= 70 ? '1px solid #a7f3d0' : ch.avgScore >= 40 ? '1px solid #bfdbfe' : '1px solid #e2e8f0'
                      }}>
                        {ch.avgScore} / 100
                      </span>
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: '900' }}>
                      <span style={{ fontSize: '12px', color: '#047857', background: '#ecfdf5', padding: '4px 12px', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
                        {ch.conversionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 4: DEMOGRAPHICS & INVESTMENT TIERS
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'demographics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 anim-fade-up">
          
          {/* Top Cities */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '24px 28px', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0b1120', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin style={{ width: '18px', height: '18px', color: '#e01a22' }} />
                  <span>Geographic Distribution</span>
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Top applicant location centers and market demand</p>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '800', background: '#f8fafc', color: '#64748b', padding: '4px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                Top {topCities.length} Cities
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {topCities.length > 0 ? topCities.map((city, idx) => {
                const pct = totalLeads > 0 ? Math.round((city.count / totalLeads) * 100) : 0;
                return (
                  <div key={city.name} style={{ padding: '14px 16px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ width: '26px', height: '26px', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0b1120', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '12px' }}>
                        {idx + 1}
                      </span>
                      <div>
                        <p style={{ fontSize: '13.5px', fontWeight: '900', color: '#0b1120' }}>{city.name}</p>
                        <p style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>{city.won} signed franchise agreements</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: '900', color: '#0b1120' }}>{city.count} leads</span>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', display: 'block' }}>({pct}% of volume)</span>
                    </div>
                  </div>
                );
              }) : (
                <div style={{ padding: '32px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>No geographic data available for this range.</div>
              )}
            </div>
          </div>

          {/* Investment Capacity Brackets */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '24px 28px', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0b1120', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DollarSign style={{ width: '18px', height: '18px', color: '#059669' }} />
                  <span>Investment Capacity Tiers</span>
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Budget capacity profile of incoming partner leads</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {investmentBrackets.map(b => (
                <div key={b.name} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: '800' }}>
                    <span style={{ color: '#0b1120' }}>{b.name}</span>
                    <span style={{ color: '#0b1120', fontWeight: '900' }}>{b.count} leads ({b.pct}%)</span>
                  </div>
                  <div style={{ width: '100%', background: '#f1f5f9', borderRadius: '50px', height: '10px', overflow: 'hidden', padding: '1px' }}>
                    <div 
                      style={{ height: '100%', borderRadius: '50px', background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', width: `${Math.max(b.pct, 4)}%`, transition: 'all 0.5s ease' }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 5: SLA & LEAD AGING WATCHLIST
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'sla' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="anim-fade-up">
          
          {/* Aging Cohorts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '18px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '900', textTransform: 'uppercase', color: '#047857', letterSpacing: '0.04em' }}>Fresh Window (&lt; 24h)</span>
                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#059669' }} />
              </div>
              <p style={{ fontSize: '28px', fontWeight: '900', color: '#064e3b', marginTop: '8px' }}>{agingData.fresh}</p>
              <p style={{ fontSize: '11.5px', fontWeight: '600', color: '#047857', marginTop: '4px' }}>High conversion propensity</p>
            </div>

            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '18px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '900', textTransform: 'uppercase', color: '#c2410c', letterSpacing: '0.04em' }}>Active Window (24h - 72h)</span>
                <Clock style={{ width: '16px', height: '16px', color: '#ea580c' }} />
              </div>
              <p style={{ fontSize: '28px', fontWeight: '900', color: '#7c2d12', marginTop: '8px' }}>{agingData.moderate}</p>
              <p style={{ fontSize: '11.5px', fontWeight: '600', color: '#c2410c', marginTop: '4px' }}>Nurturing follow-ups required</p>
            </div>

            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '18px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '900', textTransform: 'uppercase', color: '#b91c1c', letterSpacing: '0.04em' }}>Critical / Aging (&gt; 72h)</span>
                <AlertTriangle style={{ width: '16px', height: '16px', color: '#dc2626' }} />
              </div>
              <p style={{ fontSize: '28px', fontWeight: '900', color: '#7f1d1d', marginTop: '8px' }}>{agingData.critical}</p>
              <p style={{ fontSize: '11.5px', fontWeight: '600', color: '#b91c1c', marginTop: '4px' }}>Re-engagement campaign recommended</p>
            </div>
          </div>

          {/* Stagnant Leads Urgent Watchlist */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '24px 28px', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0b1120', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert style={{ width: '18px', height: '18px', color: '#dc2626' }} />
                  <span>Stagnant Leads Watchlist (&gt; 24h in New Stage)</span>
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Applicant inquiries that have exceeded the first-contact SLA threshold</p>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '900', background: '#fef2f2', color: '#b91c1c', padding: '4px 12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                {stagnantLeadsList.length} Leads At Risk
              </span>
            </div>

            {stagnantLeadsList.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      <th style={{ paddingBottom: '14px', paddingLeft: '12px', paddingRight: '12px' }}>Applicant Name</th>
                      <th style={{ paddingBottom: '14px', paddingLeft: '12px', paddingRight: '12px' }}>Contact</th>
                      <th style={{ paddingBottom: '14px', paddingLeft: '12px', paddingRight: '12px' }}>Location</th>
                      <th style={{ paddingBottom: '14px', paddingLeft: '12px', paddingRight: '12px', textAlign: 'center' }}>Time Unresponded</th>
                      <th style={{ paddingBottom: '14px', paddingLeft: '12px', paddingRight: '12px', textAlign: 'right' }}>Direct Outreach</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155' }}>
                    {stagnantLeadsList.map(lead => (
                      <tr key={lead.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 12px' }}>
                          <span style={{ fontWeight: '900', color: '#0b1120', fontSize: '13.5px', display: 'block' }}>{lead.name}</span>
                          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>Score: {lead.score || 50}/100</span>
                        </td>
                        <td style={{ padding: '14px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', color: '#0b1120' }}>
                            <Phone style={{ width: '13px', height: '13px', color: '#94a3b8' }} />
                            {lead.phone}
                          </div>
                          {lead.email && <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '2px' }}>{lead.email}</span>}
                        </td>
                        <td style={{ padding: '14px 12px', color: '#475569' }}>
                          {lead.location || 'N/A'}
                        </td>
                        <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                          <span style={{ background: '#fef2f2', color: '#b91c1c', padding: '4px 10px', borderRadius: '8px', fontSize: '11.5px', fontWeight: '900', border: '1px solid #fecaca', display: 'inline-block' }}>
                            {lead.hoursWaiting}h overdue
                          </span>
                        </td>
                        <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <a
                              href={`tel:${lead.phone}`}
                              style={{ padding: '8px', borderRadius: '10px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Call Applicant"
                            >
                              <Phone style={{ width: '14px', height: '14px' }} />
                            </a>
                            <a
                              href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ padding: '8px', borderRadius: '10px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare style={{ width: '14px', height: '14px' }} />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '36px', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: '700', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 style={{ width: '32px', height: '32px', color: '#059669' }} />
                <p>Zero stagnant leads! All incoming franchise inquiries have been contacted within SLA.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}