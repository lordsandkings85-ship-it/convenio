import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, PieChart as PieIcon } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-white border border-borderMuted rounded-2xl px-3.5 py-3 shadow-card">
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">{item.date || label}</p>
        <p className="text-[15px] font-black text-navy mt-0.5 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary inline-block" />
          <span>{payload[0].value} {payload[0].value === 1 ? 'New Lead' : 'New Leads'}</span>
        </p>
      </div>
    );
  }
  return null;
};

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
        { name: 'Direct/Manual', value: 0, percentage: 0, color: '#8b5cf6' },
      ];
    }

    return [
      { name: 'Form', value: formCount, percentage: Math.round((formCount / total) * 100), color: '#3b82f6' },
      { name: 'Chatbot', value: chatCount, percentage: Math.round((chatCount / total) * 100), color: '#10b981' },
      { name: 'Direct/Manual', value: manualCount, percentage: Math.round((manualCount / total) * 100), color: '#8b5cf6' },
    ];
  }, [safeEnquiries]);

  if (safeEnquiries.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 shrink-0 anim-fade-up">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-dashed border-slate-200 p-8 sm:p-10 flex flex-col items-center justify-center text-center gap-3 card-base">
          <div className="w-14 h-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shadow-inner">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-navy">No analytics to show yet</h3>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            Once franchise inquiries start flowing in, their daily trend and channel distribution will appear here in real time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 shrink-0 anim-fade-up">
      {/* 7-Day Lead Volume Area Chart */}
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-card border border-slate-200/70 p-5 sm:p-6 card-base card-lift">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-[15px] font-extrabold text-navy flex items-center gap-2">
              <TrendingUp className="w-[18px] h-[18px] text-primary" />
              <span>Lead Acquisition Trend</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Daily new franchise inquiries over the past 7 days</p>
          </div>
          <span className="text-[11px] font-extrabold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200 whitespace-nowrap">
            Past 7 Days
          </span>
        </div>

        <div className="h-60 sm:h-64" role="img" aria-label="Area chart of new franchise leads over the past 7 days">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={lineData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="leadAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e01a22" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#e01a22" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} dy={8} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="leads" 
                stroke="#e01a22" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#leadAreaGradient)"
                dot={{ r: 4, strokeWidth: 2, fill: '#ffffff', stroke: '#e01a22' }} 
                activeDot={{ r: 6, fill: '#e01a22', stroke: '#ffffff', strokeWidth: 2 }} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Leads By Source Breakdown Donut Chart */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-200/70 p-5 sm:p-6 flex flex-col min-h-[280px] card-base card-lift">
        <div className="mb-3">
          <h3 className="text-[15px] font-extrabold text-navy flex items-center gap-2">
            <PieIcon className="w-[18px] h-[18px] text-blue-600" />
            <span>Channel Distribution</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Where incoming applicant leads originate</p>
        </div>

        <div className="flex-1 flex items-center justify-center" role="img" aria-label="Donut chart of lead distribution by acquisition channel">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="42%"
                cy="50%"
                innerRadius={52}
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
                            <span style={{ minWidth: '60px', color: '#334155' }}>{entry.value}</span>
                            <span style={{ color: '#0b1120', fontWeight: '800', marginLeft: 'auto', background: '#f8fafc', padding: '2px 6px', borderRadius: '6px' }}>{item.percentage}%</span>
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

