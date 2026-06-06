import { useState } from 'react'
import { AppView, LiveTableRef, LiveStore } from '../types'
import { NativeConfig } from '../hooks/useNativeSetup'

type Props = {
  liveStores: LiveStore[]
  liveTables: LiveTableRef[]
  onSave: (config: NativeConfig) => void
  onCancel?: () => void
  isStaffLoggedIn: boolean
  email?: string
  password?: string
  onSignIn?: () => void
  onEmailChange?: (v: string) => void
  onPasswordChange?: (v: string) => void
  authStoreSlug?: string
  onAuthStoreSlugChange?: (v: string) => void
  authError?: string | null
  authBusy?: boolean
}

export function SetupScreen({ 
  liveStores, liveTables, onSave, onCancel,
  isStaffLoggedIn, email, password, onSignIn, onEmailChange, onPasswordChange,
  authStoreSlug, onAuthStoreSlugChange,
  authError, authBusy, initialConfig
}: Props & { initialConfig?: NativeConfig | null }) {
  const [selectedView, setSelectedView] = useState<AppView>(initialConfig?.view || 'staff')
  const [selectedStoreSlug, setSelectedStoreSlug] = useState(initialConfig?.storeSlug || '')
  const [selectedQrToken, setSelectedQrToken] = useState(initialConfig?.qrToken || '')
  const [terminalName, setTerminalName] = useState(initialConfig?.terminalName || '')

  const handleSave = () => {
    // Customer-related check removed

    onSave({
      view: selectedView,
      storeSlug: selectedStoreSlug,
      qrToken: selectedQrToken,
      terminalName,
    })
  }

  return (
    <div className="setup-screen">
      <div className="setup-card panel">
        <div className="setup-head">
          <p className="eyebrow">CONFIGURATION</p>
          <h2>端末設定</h2>
          <p className="caption">この端末の役割と接続先を設定してください。</p>
        </div>

        <div className="setup-body">
          {!isStaffLoggedIn ? (
            <div className="setup-login-form">
              <p className="notice">店舗一覧を取得するため、スタッフアカウントでログインしてください。</p>
              <div className="field">
                <label>店舗ID (Store Slug)</label>
                <input 
                  type="text" 
                  value={authStoreSlug} 
                  onChange={(e) => onAuthStoreSlugChange?.(e.target.value)} 
                  placeholder="demo-store"
                />
              </div>
              <div className="field">
                <label>メールアドレス</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => onEmailChange?.(e.target.value)} 
                  placeholder="staff@example.com"
                />
              </div>
              <div className="field">
                <label>パスワード</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => onPasswordChange?.(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <button type="button" className="primary-button" onClick={onSignIn} disabled={authBusy}>
                {authBusy ? 'ログイン中...' : 'ログインして一覧を表示'}
              </button>
              {authError && (
                <div className="setup-error">
                  {authError}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="field">
                <label>役割 (View Mode)</label>
                <div className="setup-view-options">
                  {(['handy', 'staff', 'kds', 'admin', 'sales'] as AppView[]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={`setup-view-button ${selectedView === v ? 'active' : ''}`}
                      onClick={() => setSelectedView(v)}
                    >
                      <span className="setup-view-icon">
                        {v === 'handy' ? '📝' :
                         v === 'staff' ? '🖥️' :
                         v === 'kds' ? '🔥' : 
                         v === 'sales' ? '📊' : '⚙️'}
                      </span>
                      <span className="setup-view-label">
                        {v === 'handy' ? 'Handy (スマホ用)' :
                         v === 'staff' ? 'ホール (タブレット用)' :
                         v === 'kds' ? 'キッチン用' : 
                         v === 'sales' ? '売上管理' : 'マスタメンテナンス'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>端末名 (Terminal Name)</label>
                <input 
                  type="text" 
                  value={terminalName} 
                  onChange={(e) => setTerminalName(e.target.value)} 
                  placeholder="例: Handy 1"
                />
              </div>

              <div className="setup-foot">
                <button type="button" className="primary-button" onClick={handleSave}>
                  保存
                </button>
                {onCancel && (
                  <button type="button" className="secondary-button" onClick={onCancel}>
                    キャンセル
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        .setup-screen {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: radial-gradient(circle at top left, rgba(201, 131, 59, 0.12), transparent 40%),
                      radial-gradient(circle at bottom right, rgba(137, 179, 86, 0.12), transparent 40%),
                      linear-gradient(135deg, #f7f3ec 0%, #fcfaf5 100%);
          font-family: 'Inter', "Segoe UI", "Hiragino Sans", sans-serif;
        }

        .setup-card {
          width: 100%;
          max-width: 520px;
          background: rgba(255, 255, 253, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(228, 220, 207, 0.6);
          border-radius: 28px;
          padding: 40px;
          box-shadow: 0 20px 50px rgba(62, 56, 44, 0.08);
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .setup-head {
          text-align: center;
          margin-bottom: 32px;
        }

        .setup-head h2 {
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--text-main);
          margin: 8px 0;
          letter-spacing: -0.02em;
        }

        .setup-head .caption {
          font-size: 0.95rem;
          color: var(--text-sub);
          margin: 0;
        }

        .setup-body {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field label {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-sub);
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .field input,
        .field select {
          width: 100%;
          padding: 14px 16px;
          background: #fffefa;
          border: 1px solid var(--line);
          border-radius: 14px;
          color: var(--text-main);
          font-size: 1rem;
          font-weight: 500;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.01) inset;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .field input:hover,
        .field select:hover {
          border-color: var(--action);
        }

        .field input:focus,
        .field select:focus {
          outline: none;
          border-color: var(--action);
          box-shadow: 0 0 0 4px var(--warning-soft);
        }

        /* View Mode Options Grid */
        .setup-view-options {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 4px;
        }

        .setup-view-button {
          padding: 16px 12px;
          background: rgba(255, 255, 255, 0.8);
          border: 1.5px solid var(--line);
          border-radius: 16px;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .setup-view-icon {
          font-size: 1.8rem;
          line-height: 1;
        }

        .setup-view-button:hover {
          border-color: var(--action);
          background: #fff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(201, 131, 59, 0.08);
        }

        .setup-view-button.active {
          background: linear-gradient(135deg, var(--action), var(--action-strong));
          border-color: transparent;
          color: white !important;
          box-shadow: 0 8px 20px rgba(201, 131, 59, 0.25);
          transform: scale(1.02);
        }

        .setup-view-button.active span {
          color: rgba(255, 255, 255, 0.9);
        }

        /* Footer Buttons */
        .setup-foot {
          display: flex;
          gap: 16px;
          margin-top: 12px;
        }

        .setup-foot button {
          flex: 1;
          padding: 16px;
          font-size: 1rem;
          font-weight: 700;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .setup-foot .primary-button {
          background: linear-gradient(135deg, var(--accent), #759a43);
          color: white;
          border: none;
          box-shadow: 0 4px 12px rgba(137, 179, 86, 0.25);
        }

        .setup-foot .primary-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(137, 179, 86, 0.35);
        }

        .setup-foot .primary-button:active {
          transform: translateY(0);
        }

        .setup-foot .secondary-button {
          background: #fff;
          border: 1px solid var(--line);
          color: var(--text-sub);
        }

        .setup-foot .secondary-button:hover {
          background: var(--disabled-soft);
          color: var(--text-main);
          border-color: var(--disabled);
        }

        /* Login Form Styles */
        .setup-login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .setup-login-form .notice {
          background: var(--warning-soft);
          border-left: 4px solid var(--warning);
          padding: 14px 16px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--warning);
          line-height: 1.5;
          margin: 0 0 8px 0;
        }

        .setup-login-form button.primary-button {
          padding: 16px;
          font-size: 1rem;
          font-weight: 700;
          border-radius: 14px;
          background: linear-gradient(135deg, var(--action), var(--action-strong));
          color: white;
          border: none;
          box-shadow: 0 4px 12px rgba(201, 131, 59, 0.2);
          cursor: pointer;
          transition: all 0.2s;
        }

        .setup-login-form button.primary-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(201, 131, 59, 0.3);
        }

        .setup-login-form button.primary-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .setup-error {
          padding: 12px;
          background: var(--danger-soft);
          border-left: 4px solid var(--danger);
          color: var(--danger);
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          text-align: center;
        }
      `}</style>
    </div>
  )
}
