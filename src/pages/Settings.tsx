import { useAuth } from '../hooks/useAuth';
import { User, Bell, Shield, Save, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

const API_BASE = 'http://localhost:3006/api';

function getToken() {
  return localStorage.getItem('crm_token') || '';
}

export default function Settings() {
  const { user, setUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSaved, setPwdSaved] = useState(false);
  const [pwdError, setPwdError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ name: displayName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '保存失败');

      localStorage.setItem('crm_token', data.token);
      setUser?.(data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPwdSaving(true);
    setPwdError('');
    setPwdSaved(false);
    try {
      const res = await fetch(`${API_BASE}/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '修改失败');

      setPwdSaved(true);
      setOldPassword('');
      setNewPassword('');
      setTimeout(() => setPwdSaved(false), 2000);
    } catch (err: any) {
      setPwdError(err.message);
    } finally {
      setPwdSaving(false);
    }
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
              {displayName?.[0] || 'U'}
            </div>
            <div>
              <p className="font-medium text-slate-900">{user?.name || '用户'}</p>
              <p className="text-sm text-slate-500">{user?.username || ''}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">显示名称</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
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

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-900 mb-3">修改密码</p>
              <div className="space-y-3 max-w-md">
                <div className="relative">
                  <input
                    type={showOldPwd ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="当前密码"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPwd(!showOldPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showOldPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="新密码（至少8位，含大小写字母和数字）"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {pwdError && <p className="text-sm text-red-600">{pwdError}</p>}
                {pwdSaved && <p className="text-sm text-emerald-600 font-medium">密码已修改</p>}
                <button
                  onClick={handlePasswordChange}
                  disabled={pwdSaving || !oldPassword || !newPassword}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {pwdSaving ? '修改中...' : '修改密码'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {error && <span className="text-sm text-red-600 font-medium">{error}</span>}
        {saved && (
          <span className="text-sm text-emerald-600 font-medium">设置已保存</span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Save size={18} />
          {saving ? '保存中...' : '保存设置'}
        </button>
      </div>
    </div>
  );
}
