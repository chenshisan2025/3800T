import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '古灵通 API 服务',
  description: '古灵通股票投资平台 API 服务',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='zh-CN'>
      <body>{children}</body>
    </html>
  );
}
