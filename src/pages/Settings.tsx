import { useAuth } from '../hooks/useAuth';
import { User, Bell, Shield, Palette, Save } from 'lucide-react';
import { useState } from 'react';

export default function Settings() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">系统设置</h1>
        <p className="text-slate-500 mt-1">管理您的账户和系统偏好</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
        {/* Profile */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <User size={20} className="text-primary-600" />
            <h3 className="font-semibold text-slate-900">个人资料</h3>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-bold border-2 border-primary-200">
              {user?.displayName?.[0] || 'U'}
            </div>
            <div>
              <p className="font-medium text-slate-900">{user?.displayName || '用户'}</p>
              <p className="text-sm text-slate-500">{user?.username || ''}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">显示名称</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">手机号</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="138****8888"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <Bell size={20} className="text-primary-600" />
            <h3 className="font-semibold text-slate-900">通知设置</h3>
          </div>

          <div className="space-y-3">
            {[
              { label: '项目状态变更通知', desc: '当项目进度或状态发生变化时接收通知' },
              { label: '新客户签约提醒', desc: '有新客户签约时发送通知' },
              { label: '设备告警通知', desc: '无人机设备出现异常时接收告警' },
            ].map((item) => (
              <label key={item.label} className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900 group-hover:text-primary-700 transition-colors">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <Shield size={20} className="text-primary-600" />
            <h3 className="font-semibold text-slate-900">安全设置</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-slate-900">两步验证</p>
                <p className="text-xs text-slate-500">通过短信或邮箱验证码增强账户安全</p>
              </div>
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">开启</button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-slate-900">修改密码</p>
                <p className="text-xs text-slate-500">定期更换密码以保护账户安全</p>
              </div>
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">修改</button>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <Palette size={20} className="text-primary-600" />
            <h3 className="font-semibold text-slate-900">外观设置</h3>
          </div>

          <div className="flex items-center gap-3">
            {[
              { label: '浅色', value: 'light', bg: 'bg-white' },
              { label: '深色', value: 'dark', bg: 'bg-slate-900' },
              { label: '自动', value: 'auto', bg: 'bg-slate-200' },
            ].map((theme) => (
              <label key={theme.value} className="flex-1 cursor-pointer">
                <input type="radio" name="theme" defaultChecked={theme.value === 'light'} className="sr-only peer" />
                <div className="border-2 border-slate-200 peer-checked:border-primary-500 rounded-lg p-3 text-center hover:border-slate-300 transition-all">
                  <div className={`w-8 h-8 ${theme.bg} border border-slate-300 rounded-md mx-auto mb-2`}></div>
                  <span className="text-sm text-slate-700">{theme.label}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="text-sm text-emerald-600 font-medium">设置已保存</span>
        )}
        <button
          onClick={handleSave}
          className="bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Save size={18} />
          保存设置
        </button>
      </div>
    </div>
  );
}
