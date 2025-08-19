'use client';

import { useEffect, useState } from 'react';

interface LegalContent {
  disclaimer: {
    title: string;
    content: string[];
    lastUpdated: string;
  };
  privacyPolicy: {
    title: string;
    content: string[];
    lastUpdated: string;
  };
  investmentWarning: {
    title: string;
    content: string[];
    lastUpdated: string;
  };
  termsOfService: {
    title: string;
    content: string[];
    lastUpdated: string;
  };
}

export default function LegalPage() {
  const [legalContent, setLegalContent] = useState<LegalContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLegalContent = async () => {
      try {
        const response = await fetch('/api/legal');
        if (response.ok) {
          const data = await response.json();
          setLegalContent(data.data);
        } else {
          setError('无法加载法律条款内容');
        }
      } catch (err) {
        setError('网络连接错误');
      } finally {
        setLoading(false);
      }
    };

    fetchLegalContent();
  }, []);

  const sectionStyle = {
    backgroundColor: '#fff',
    border: '1px solid #e9ecef',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px'
  };

  const titleStyle = {
    color: '#2166A5',
    fontSize: '1.5rem',
    marginBottom: '16px',
    marginTop: '0'
  };

  const contentStyle = {
    fontSize: '0.95rem',
    lineHeight: '1.6',
    color: '#495057',
    marginBottom: '8px'
  };

  const warningStyle = {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px'
  };

  if (loading) {
    return (
      <div style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px 20px',
        textAlign: 'center'
      }}>
        <p style={{ color: '#666' }}>正在加载法律条款...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px 20px'
      }}>
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #f5c6cb',
          textAlign: 'center'
        }}>
          ❌ {error}
        </div>
      </div>
    );
  }

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
          法律条款
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: '#666',
          margin: '0'
        }}>
          古灵通股票投资平台法律声明与隐私政策
        </p>
      </header>

      {legalContent && (
        <>
          {/* 投资风险提示 - 置顶显示 */}
          <div style={warningStyle}>
            <h2 style={{
              ...titleStyle,
              color: '#856404',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ⚠️ {legalContent.investmentWarning.title}
            </h2>
            <div>
              {legalContent.investmentWarning.content.map((item, index) => (
                <p key={index} style={{
                  ...contentStyle,
                  color: '#856404',
                  fontWeight: '500',
                  marginBottom: '12px'
                }}>
                  {item}
                </p>
              ))}
            </div>
            <p style={{
              fontSize: '0.85rem',
              color: '#6c757d',
              marginTop: '16px',
              marginBottom: '0'
            }}>
              最后更新：{legalContent.investmentWarning.lastUpdated}
            </p>
          </div>

          {/* 免责声明 */}
          <div style={sectionStyle}>
            <h2 style={titleStyle}>{legalContent.disclaimer.title}</h2>
            <div>
              {legalContent.disclaimer.content.map((item, index) => (
                <p key={index} style={contentStyle}>
                  {item}
                </p>
              ))}
            </div>
            <p style={{
              fontSize: '0.85rem',
              color: '#6c757d',
              marginTop: '16px',
              marginBottom: '0'
            }}>
              最后更新：{legalContent.disclaimer.lastUpdated}
            </p>
          </div>

          {/* 隐私政策 */}
          <div style={sectionStyle}>
            <h2 style={titleStyle}>{legalContent.privacyPolicy.title}</h2>
            <div>
              {legalContent.privacyPolicy.content.map((item, index) => (
                <p key={index} style={contentStyle}>
                  {item}
                </p>
              ))}
            </div>
            <p style={{
              fontSize: '0.85rem',
              color: '#6c757d',
              marginTop: '16px',
              marginBottom: '0'
            }}>
              最后更新：{legalContent.privacyPolicy.lastUpdated}
            </p>
          </div>

          {/* 服务条款 */}
          <div style={sectionStyle}>
            <h2 style={titleStyle}>{legalContent.termsOfService.title}</h2>
            <div>
              {legalContent.termsOfService.content.map((item, index) => (
                <p key={index} style={contentStyle}>
                  {item}
                </p>
              ))}
            </div>
            <p style={{
              fontSize: '0.85rem',
              color: '#6c757d',
              marginTop: '16px',
              marginBottom: '0'
            }}>
              最后更新：{legalContent.termsOfService.lastUpdated}
            </p>
          </div>
        </>
      )}

      <footer style={{
        textAlign: 'center',
        marginTop: '40px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <p style={{
          fontSize: '0.9rem',
          color: '#6c757d',
          margin: '0'
        }}>
          如有任何疑问，请联系我们的客服团队
        </p>
      </footer>
    </div>
  );
}