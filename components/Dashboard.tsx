import React, { useMemo } from 'react';
import { PackingRecord } from '../types';
import { aggregateData } from '../utils';
import StatsCard from './StatsCard';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { Package, Truck, Calendar, Layers, Activity, Users } from 'lucide-react';

interface DashboardProps {
  data: PackingRecord[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const { stats, timelineData, packageData, shipmentChartData, modeChartData } = useMemo(() => aggregateData(data), [data]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Products (QTY)" 
          value={stats.totalItems.toLocaleString()} 
          icon={Layers} 
          color="bg-blue-500" 
          subValue="Total pieces packed"
        />
        <StatsCard 
          title="Packages Used" 
          value={stats.totalPackages.toLocaleString()} 
          icon={Package} 
          color="bg-emerald-500"
          subValue="Sum of all package columns"
        />
        <StatsCard 
          title="Top Customer" 
          value={stats.topCustomer} 
          icon={Users} 
          color="bg-indigo-500"
          subValue="Highest volume"
        />
        <StatsCard 
          title="Total Jobs (SI)" 
          value={stats.totalSI.toLocaleString()} 
          icon={Activity} 
          color="bg-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Timeline */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Packing Volume Timeline
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{fontSize: 12}} 
                  tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'short', day:'numeric'})} 
                  stroke="#94a3b8"
                />
                <YAxis tick={{fontSize: 12}} stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Legend />
                <Line type="monotone" dataKey="qty" name="Products (QTY)" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="packages" name="Packages Used" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mode Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-500" />
            Transport Mode
          </h3>
          <div className="h-72 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modeChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {modeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Shipment/Customers */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Top Customers by Volume</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shipmentChartData} layout="vertical" margin={{top: 5, right: 30, left: 40, bottom: 5}}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Package Dimensions Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Package Type Usage</h3>
          <div className="h-80 overflow-y-auto pr-2 custom-scrollbar">
             {/* Using a custom list for better readability with long labels instead of a cramped chart */}
             <div className="space-y-3">
               {packageData.map((pkg, idx) => (
                 <div key={pkg.name} className="flex items-center group">
                   <div className="w-32 text-xs font-medium text-slate-500 truncate" title={pkg.name}>
                     {pkg.name}
                   </div>
                   <div className="flex-1 mx-3 h-3 bg-slate-100 rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-emerald-500 rounded-full group-hover:bg-emerald-400 transition-colors"
                       style={{ width: `${(pkg.value / Math.max(...packageData.map(p => p.value))) * 100}%` }}
                     />
                   </div>
                   <div className="text-sm font-bold text-slate-700 w-16 text-right">
                     {pkg.value.toLocaleString()}
                   </div>
                 </div>
               ))}
               {packageData.length === 0 && (
                 <p className="text-center text-slate-400 py-10">No specific package data found.</p>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
