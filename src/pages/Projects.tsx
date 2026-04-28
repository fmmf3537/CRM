import { Clock, CheckCircle2, AlertCircle, Plus, Calendar } from 'lucide-react';

interface Project {
  id: number;
  name: string;
  client: string;
  type: string;
  progress: number;
  status: 'ongoing' | 'completed' | 'delayed';
  deadline: string;
  members: number;
}

const projects: Project[] = [
  { id: 1, name: '农业植保无人机编队部署', client: '华远航空科技', type: '设备部署', progress: 78, status: 'ongoing', deadline: '2026-05-15', members: 8 },
  { id: 2, name: '城市高空安防巡检系统', client: '蓝天安防集团', type: '系统集成', progress: 45, status: 'ongoing', deadline: '2026-07-20', members: 12 },
  { id: 3, name: '物流配送无人机测试', client: '迅达物流', type: '测试验证', progress: 30, status: 'delayed', deadline: '2026-04-30', members: 5 },
  { id: 4, name: '极地测绘数据采集平台', client: '极地测绘研究院', type: '软件开发', progress: 92, status: 'ongoing', deadline: '2026-04-10', members: 6 },
  { id: 5, name: '生态环境遥感监测系统', client: '绿野生态监测', type: '系统集成', progress: 100, status: 'completed', deadline: '2026-03-01', members: 4 },
  { id: 6, name: '影视航拍服务框架协议', client: '云海影视传媒', type: '服务合同', progress: 60, status: 'ongoing', deadline: '2026-06-01', members: 3 },
];

const statusMap = {
  ongoing: { label: '进行中', icon: Clock, className: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed: { label: '已完成', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  delayed: { label: '已延期', icon: AlertCircle, className: 'bg-red-50 text-red-700 border-red-200' },
};

export default function Projects() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">项目中心</h1>
          <p className="text-slate-500 mt-1">跟踪项目进度与交付状态</p>
        </div>
        <button className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Plus size={18} />
          新建项目
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {projects.map((p) => {
          const status = statusMap[p.status];
          const StatusIcon = status.icon;
          return (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900">{p.name}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{p.client}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${status.className}`}>
                  <StatusIcon size={13} />
                  {status.label}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                <span className="px-2 py-1 bg-slate-100 rounded-md text-xs">{p.type}</span>
                <div className="flex items-center gap-1">
                  <Calendar size={13} />
                  截止 {p.deadline}
                </div>
                <span>{p.members} 人参与</span>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-slate-500">项目进度</span>
                  <span className="font-semibold text-slate-900">{p.progress}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      p.status === 'delayed'
                        ? 'bg-red-500'
                        : p.progress === 100
                        ? 'bg-emerald-500'
                        : 'bg-primary-500'
                    }`}
                    style={{ width: `${p.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
