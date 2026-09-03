import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function AnalyticsCharts() {
  const lineData = [
    { name: 'Mon', leads: 0 },
    { name: 'Tue', leads: 0 },
    { name: 'Wed', leads: 4 },
    { name: 'Thu', leads: 2 },
    { name: 'Fri', leads: 1 },
    { name: 'Sat', leads: 3 },
    { name: 'Sun', leads: 1 },
  ];

  const pieData = [
    { name: 'Form', value: 60, color: '#3b82f6' },
    { name: 'Chat', value: 25, color: '#10b981' },
    { name: 'Website', value: 15, color: '#f59e0b' },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-borderMuted/60 p-2.5 rounded-xl shadow-elevated">
          <p className="text-sm font-bold text-ink">{`${label} : ${payload[0].value} leads`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0 anim-fade-up">
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-card border border-borderMuted/60 p-5 card-base card-lift">
        <h3 className="text-sm font-bold text-navy mb-6">Leads This Week</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="leads" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={{ r: 4, strokeWidth: 2, fill: 'white', stroke: '#3b82f6' }} 
                activeDot={{ r: 6, fill: '#3b82f6', stroke: 'white', strokeWidth: 2 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-borderMuted/60 p-5 flex flex-col min-h-[250px] card-base card-lift">
        <h3 className="text-sm font-bold text-navy mb-2">Leads by Source</h3>
        <div className="flex-1 flex items-center justify-center -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="40%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
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
                    <ul className="space-y-3">
                      {payload.map((entry, index) => (
                        <li key={`item-${index}`} className="flex items-center gap-2 text-sm text-ink font-bold">
                          <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></span>
                          <span className="w-16">{entry.value}</span>
                          <span className="text-inkLight font-normal ml-2">{pieData[index].value}%</span>
                        </li>
                      ))}
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
