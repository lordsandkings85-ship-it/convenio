import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function AnalyticsCharts({ enquiries = [] }) {
  const safeEnquiries = Array.isArray(enquiries) ? enquiries : [];

  // Compute daily trend for the last 7 days
  const lineData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dayName = days[d.getDay()];
      const dateStr = d.toISOString().split('T')[0];

      const count = safeEnquiries.filter(e => {
        if (!e?.created_at) return false;
        return e.created_at.startsWith(dateStr);
      }).length;

      result.push({
        name: i === 0 ? 'Today' : dayName,
        leads: count,
        date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
      });
    }

    return result;
  }, [safeEnquiries]);

  // Compute Source Breakdown
  const pieData = useMemo(() => {
    const chatCount = safeEnquiries.filter(e => e?.source === 'CHAT').length;
    const formCount = safeEnquiries.filter(e => e?.source === 'FORM').length;
    const manualCount = safeEnquiries.filter(e => e?.source === 'MANUAL').length;
    const total = safeEnquiries.length || 1;

    if (safeEnquiries.length === 0) {
      return [
        { name: 'Form', value: 0, percentage: 0, color: '#3b82f6' },
        { name: 'Chatbot', value: 0, percentage: 0, color: '#10b981' },
        { name: 'Direct', value: 0, percentage: 0, color: '#8b5cf6' },
      ];
    }

    return [
      { name: 'Form', value: formCount, percentage: Math.round((formCount / total) * 100), color: '#3b82f6' },
      { name: 'Chatbot', value: chatCount, percentage: Math.round((chatCount / total) * 100), color: '#10b981' },
      { name: 'Direct', value: manualCount, percentage: Math.round((manualCount / total) * 100), color: '#8b5cf6' },
    ];
  }, [safeEnquiries]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: '12px', boxShadow: '0 8px 20px -4px rgba(0,0,0,0.12)' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>{item.date || label}</p>
          <p style={{ fontSize: '14px', fontWeight: '800', color: '#0b1120', marginTop: '2px' }}>{payload[0].value} {payload[0].value === 1 ? 'Lead' : 'Leads'}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 shrink-0 anim-fade-up">
      {/* 7-Day Lead Volume Chart */}
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-borderMuted p-5 sm:p-6 card-base card-lift">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0b1120' }}>Lead Acquisition Trend</h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Daily new franchise inquiries over the past 7 days</p>
          </div>
          <span style={{ fontSize: '11px', fontWeight: '700', background: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: '50px', border: '1px solid #dbeafe' }}>
            Past 7 Days
          </span>
        </div>

        <div className="h-60 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={8} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="leads" 
                stroke="#e01a22" 
                strokeWidth={3} 
                dot={{ r: 5, strokeWidth: 2.5, fill: '#ffffff', stroke: '#e01a22' }} 
                activeDot={{ r: 7, fill: '#e01a22', stroke: '#ffffff', strokeWidth: 2.5 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Leads By Source Breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-borderMuted p-5 sm:p-6 flex flex-col min-h-[280px] card-base card-lift">
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0b1120' }}>Channel Share</h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Where your inquiries originate from</p>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="42%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                content={(props) => {
                  const { payload } = props;
                  return (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {payload.map((entry, index) => {
                        const item = pieData[index] || {};
                        return (
                          <li key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700', color: '#0b1120' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: entry.color, display: 'inline-block', flexShrink: 0 }}></span>
                            <span style={{ minWidth: '55px' }}>{entry.value}</span>
                            <span style={{ color: '#64748b', fontWeight: '600', marginLeft: 'auto' }}>{item.percentage}%</span>
                          </li>
                        );
                      })}
                    </ul>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
