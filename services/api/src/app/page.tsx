'use client';

import { useEffect, useState } from 'react';

interface HealthStatus {
  status: string;
  timestamp: string;
  database: {
    status: string;
    response_time: number;
  };
  memory: {
    used: number;
    total: number;
    usage_percent: number;
  };
  environment: string;
}

export default function HomePage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch('/api/health');
        if (response.ok) {
          const data = await response.json();
          setHealth(data.data);
        } else {
          setError('服务健康检查失败');
        }
      } catch (err) {
        setError('无法连接到服务');
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 20px',
      lineHeight: '1.6',
      color: '#333'
    }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{
          color: '#2166A5',
          fontSize: '2.5rem',
          marginBottom: '10px',
          fontWeight: '700'
        }}>
          古灵通 API 服务
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: '#666',
          margin: '0'
        }}>
          股票投资平台后端 API 服务
        </p>
      </header>

      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '32px'
      }}>
        <h2 style={{
          color: '#2166A5',
          fontSize: '1.5rem',
          marginBottom: '16px',
          marginTop: '0'
        }}>
          服务状态
        </h2>
        
        {loading && (
          <p style={{ color: '#666' }}>正在检查服务状态...</p>
        )}
        
        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '12px',
            borderRadius: '4px',
            border: '1px solid #f5c6cb'
          }}>
            ❌ {error}
          </div>
        )}
        
        {health && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <span style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                backgroundColor: health.status === 'healthy' ? '#28a745' : '#dc3545',
                borderRadius: '50%',
                marginRight: '8px'
              }}></span>
              <strong style={{
                color: health.status === 'healthy' ? '#28a745' : '#dc3545'
              }}>
                {health.status === 'healthy' ? '服务正常' : '服务异常'}
              </strong>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginTop: '16px'
            }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', color: '#495057' }}>数据库</h4>
                <p style={{ margin: '0', fontSize: '0.9rem' }}>
                  状态: <span style={{
                    color: health.database.status === 'connected' ? '#28a745' : '#dc3545',
                    fontWeight: '500'
                  }}>
                    {health.database.status === 'connected' ? '已连接' : '连接失败'}
                  </span><br/>
                  响应时间: {health.database.response_time}ms
                </p>
              </div>
              
              <div>
                <h4 style={{ margin: '0 0 8px 0', color: '#495057' }}>内存使用</h4>
                <p style={{ margin: '0', fontSize: '0.9rem' }}>
                  已使用: {formatBytes(health.memory.used)}<br/>
                  总计: {formatBytes(health.memory.total)}<br/>
                  使用率: {health.memory.usage_percent.toFixed(1)}%
                </p>
              </div>
              
              <div>
                <h4 style={{ margin: '0 0 8px 0', color: '#495057' }}>环境信息</h4>
                <p style={{ margin: '0', fontSize: '0.9rem' }}>
                  环境: {health.environment}<br/>
                  检查时间: {new Date(health.timestamp).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '32px'
      }}>
        <h2 style={{
          color: '#2166A5',
          fontSize: '1.5rem',
          marginBottom: '16px',
          marginTop: '0'
        }}>
          API 端点
        </h2>
        
        <div style={{
          display: 'grid',
          gap: '12px'
        }}>
          <div style={{
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}>
            <strong>健康检查:</strong> <code style={{
              backgroundColor: '#e9ecef',
              padding: '2px 6px',
              borderRadius: '3px',
              fontFamily: 'Monaco, Consolas, monospace'
            }}>GET /api/health</code>
          </div>
          
          <div style={{
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}>
            <strong>用户认证:</strong> <code style={{
              backgroundColor: '#e9ecef',
              padding: '2px 6px',
              borderRadius: '3px',
              fontFamily: 'Monaco, Consolas, monospace'
            }}>/api/auth/*</code>
          </div>
          
          <div style={{
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}>
            <strong>股票数据:</strong> <code style={{
              backgroundColor: '#e9ecef',
              padding: '2px 6px',
              borderRadius: '3px',
              fontFamily: 'Monaco, Consolas, monospace'
            }}>/api/stocks/*</code>
          </div>
          
          <div style={{
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}>
            <strong>用户功能:</strong> <code style={{
              backgroundColor: '#e9ecef',
              padding: '2px 6px',
              borderRadius: '3px',
              fontFamily: 'Monaco, Consolas, monospace'
            }}>/api/users/*</code>
          </div>
          
          <div style={{
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}>
            <strong>AI 报告:</strong> <code style={{
              backgroundColor: '#e9ecef',
              padding: '2px 6px',
              borderRadius: '3px',
              fontFamily: 'Monaco, Consolas, monospace'
            }}>/api/ai/*</code>
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        padding: '24px'
      }}>
        <h2 style={{
          color: '#2166A5',
          fontSize: '1.5rem',
          marginBottom: '16px',
          marginTop: '0'
        }}>
          技术栈
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '2rem',
              marginBottom: '8px'
            }}>⚡</div>
            <strong>Next.js</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#666' }}>API Routes</p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '2rem',
              marginBottom: '8px'
            }}>🗄️</div>
            <strong>Prisma</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#666' }}>数据库 ORM</p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '2rem',
              marginBottom: '8px'
            }}>🔐</div>
            <strong>Supabase</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#666' }}>用户认证</p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '2rem',
              marginBottom: '8px'
            }}>📝</div>
            <strong>TypeScript</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#666' }}>类型安全</p>
          </div>
        </div>
      </div>

      <footer style={{
        textAlign: 'center',
        marginTop: '40px',
        padding: '20px 0',
        borderTop: '1px solid #e9ecef',
        color: '#666',
        fontSize: '0.9rem'
      }}>
        <p style={{ margin: '0' }}>
          古灵通股票投资平台 © 2024
        </p>
      </footer>
    </div>
  );
}