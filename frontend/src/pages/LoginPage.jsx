import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/authStore'

function LoginPage() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const res = await authApi.login(values.username, values.password)
      login(res.token, {
        username: res.username,
        fullName: res.fullName,
        role: res.role
      })
      message.success('Đăng nhập thành công')
      navigate('/dashboard')
    } catch (error) {
      message.error(
        error.response?.data || 'Sai tên đăng nhập hoặc mật khẩu'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        fontFamily: "'Manrope', sans-serif",
        background: '#ffffff'
      }}
    >
      {/* Left side: Login Form Column */}
      <div
        className="login-form-container"
        style={{
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 48px',
          background: '#ffffff',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.05)',
          zIndex: 2,
          position: 'relative'
        }}
      >
        {/* Header Branding */}
        <div>
          <span style={{
            display: 'inline-block',
            marginBottom: 8,
            color: '#ee0033',
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: '3px',
          }}>
            VIETTEL GROUP
          </span>
          <h2 className="cake-title" style={{ fontSize: 26, margin: 0, color: '#212529', fontWeight: 800 }}>
            Hệ thống Phê duyệt Nội bộ
          </h2>
        </div>

        {/* Form Container */}
        <div style={{ margin: 'auto 0' }}>
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 20, margin: 0, color: '#212529', fontWeight: 700 }}>
              Đăng nhập
            </h3>
            <p style={{ color: '#6c757d', fontSize: 14, marginTop: 8, fontWeight: 500, lineHeight: 1.5 }}>
              Vui lòng nhập tên đăng nhập và mật khẩu được cung cấp để truy cập hệ thống.
            </p>
          </div>

          <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item
              name="username"
              rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#999999' }} />}
                placeholder="Tên đăng nhập"
                size="large"
                style={{
                  borderRadius: 8,
                  border: '1px solid #d9d9d9',
                  background: '#ffffff',
                  color: '#212529',
                  height: 44
                }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#999999' }} />}
                placeholder="Mật khẩu"
                size="large"
                style={{
                  borderRadius: 8,
                  border: '1px solid #d9d9d9',
                  background: '#ffffff',
                  color: '#212529',
                  height: 44
                }}
              />
            </Form.Item>

            <Form.Item style={{ marginTop: 32, marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                style={{
                  borderRadius: 8,
                  height: 44,
                  background: '#ee0033',
                  borderColor: '#ee0033',
                  fontSize: 16,
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(238, 0, 51, 0.2)'
                }}
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>
        </div>

        {/* Footer info */}
        <div style={{ color: '#999999', fontSize: 12, fontWeight: 500 }}>
          © {new Date().getFullYear()} Viettel Approval System. All rights reserved.
        </div>
      </div>

      {/* Right side: Video Column */}
      <div
        className="login-video-container"
        style={{
          flex: 1,
          position: 'relative',
          background: '#000000',
          overflow: 'hidden'
        }}
      >
        <iframe
          src="https://www.youtube.com/embed/lcONWHcvE08?autoplay=1&mute=1&loop=1&playlist=lcONWHcvE08&controls=0&showinfo=0&rel=0&playsinline=1&enablejsapi=1"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '100vw',
            height: '56.25vw',
            minHeight: '100vh',
            minWidth: '177.77vh',
            transform: 'translate(-50%, -50%)',
          }}
          title="Background Video"
        />
        {/* Semi-transparent overlay to style the video beautifully */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(238, 0, 51, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%)',
            zIndex: 1
          }}
        />
      </div>
    </div>
  )
}

export default LoginPage