import { Clock, CheckCircle2, AlertCircle, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:3006/api';

function getToken() {
  return localStorage.getItem('crm_token') || '';
}

const STAGE_LABELS: Record<string, string> = {
  STAGE_01: '线索',
  STAGE_02: '需求确认',
  STAGE_03: '方案报价',
  STAGE_04: '商务谈判',
  STAGE_05: '签约成交',
  STAGE_99: '流失',
};

const STAGE_PROGRESS: Record<string, number> = {
  STAGE_01: 10,
  STAGE_02: 25,
  STAGE_03: 50,
  STAGE_04: 75,
  STAGE_05: 100,
  STAGE_99: 0,
};

interface Opportunity {
  id: number;
  name: string;
  amount: number;
  stage: string;
  status: string;
  expectedCloseDate: string | null;
  customer?: { id: number; name: string };
  owner?: { id: number; name: string };
}

export default function Projects() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/opportunities?pageSize=100`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const items = data.data || [];
        setOpportunities(items.filter((o: Opportunity) => o.status !== 'LOST'));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getProjectStatus = (opp: Opportunity) => {
    if (opp.status === 'WON') return 'completed';
    if (opp.expectedCloseDate && new Date(opp.expectedCloseDate) < new Date()) return 'delayed';
    return 'ongoing';
  };

  const statusMap: Record<string, { label: string; icon: any; className: string }> = {
    ongoing: { label: '进行中', icon: Clock, className: 'bg-blue-50 text-blue-700 border-blue-200' },
    completed: { label: '已赢单', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    delayed: { label: '已逾期', icon: AlertCircle, className: 'bg-red-50 text-red-700 border-red-200' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">项目中心</h1>
          <p className="text-slate-500 mt-1">基于商机管道的项目跟踪视图</p>
        </div>
      </div>

      {opportunities.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <TrendingUp size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">暂无项目数据，请先创建商机</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {opportunities.map((opp) => {
            const projStatus = getProjectStatus(opp);
            const status = statusMap[projStatus];
            const StatusIcon = status.icon;
            const progress = STAGE_PROGRESS[opp.stage] || 10;

            return (
              <div
                key={opp.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">{opp.name}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">{opp.customer?.name || '未知客户'}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${status.className}`}>
                    <StatusIcon size={13} />
                    {status.label}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                  <span className="px-2 py-1 bg-slate-100 rounded-md text-xs">{STAGE_LABELS[opp.stage] || opp.stage}</span>
                  <div className="flex items-center gap-1">
                    <DollarSign size={13} />
                    ¥{opp.amount.toLocaleString()}
                  </div>
                  {opp.expectedCloseDate && (
                    <div className="flex items-center gap-1">
                      <Calendar size={13} />
                      截止 {new Date(opp.expectedCloseDate).toLocaleDateString('zh-CN')}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-slate-500">项目进度</span>
                    <span className="font-semibold text-slate-900">{progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        projStatus === 'delayed'
                        ? 'bg-red-500'
                        : projStatus === 'completed'
                        ? 'bg-emerald-500'
                        : 'bg-primary-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
