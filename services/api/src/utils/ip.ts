import { Request } from 'express';

/**
 * 获取客户端真实IP地址
 * 考虑代理、负载均衡器等情况
 */
export function getClientIP(req: Request): string {
  // 检查各种可能的IP头部字段
  const forwarded = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  const clientIP = req.headers['x-client-ip'];
  const forwardedFor = req.headers['x-forwarded'];
  const forwardedProto = req.headers['forwarded-for'];
  const forwarded2 = req.headers['forwarded'];

  // x-forwarded-for 可能包含多个IP，取第一个
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const firstIP = ips.split(',')[0].trim();
    if (isValidIP(firstIP)) {
      return firstIP;
    }
  }

  // x-real-ip 通常是最可靠的
  if (realIP && !Array.isArray(realIP) && isValidIP(realIP)) {
    return realIP;
  }

  // 其他头部字段
  if (clientIP && !Array.isArray(clientIP) && isValidIP(clientIP)) {
    return clientIP;
  }

  if (forwardedFor && !Array.isArray(forwardedFor) && isValidIP(forwardedFor)) {
    return forwardedFor;
  }

  if (
    forwardedProto &&
    !Array.isArray(forwardedProto) &&
    isValidIP(forwardedProto)
  ) {
    return forwardedProto;
  }

  if (forwarded2 && !Array.isArray(forwarded2)) {
    // Forwarded 头部格式: for=192.0.2.60;proto=http;by=203.0.113.43
    const forMatch = forwarded2.match(/for=([^;,\s]+)/);
    if (forMatch && forMatch[1] && isValidIP(forMatch[1])) {
      return forMatch[1];
    }
  }

  // 最后使用连接的远程地址
  const remoteAddress =
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    (req.connection as any)?.socket?.remoteAddress;

  if (remoteAddress && isValidIP(remoteAddress)) {
    return remoteAddress;
  }

  // 如果都获取不到，返回默认值
  return 'unknown';
}

/**
 * 验证IP地址格式是否有效
 */
function isValidIP(ip: string): boolean {
  if (!ip || typeof ip !== 'string') {
    return false;
  }

  // 移除可能的端口号
  const cleanIP = ip.split(':')[0];

  // IPv4 正则表达式
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  // IPv6 正则表达式（简化版）
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;

  return ipv4Regex.test(cleanIP) || ipv6Regex.test(cleanIP);
}

/**
 * 检查IP是否为内网地址
 */
export function isPrivateIP(ip: string): boolean {
  if (!isValidIP(ip)) {
    return false;
  }

  const cleanIP = ip.split(':')[0];

  // 内网IP范围
  const privateRanges = [
    /^10\./, // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
    /^192\.168\./, // 192.168.0.0/16
    /^127\./, // 127.0.0.0/8 (localhost)
    /^169\.254\./, // 169.254.0.0/16 (link-local)
    /^::1$/, // IPv6 localhost
    /^fe80:/, // IPv6 link-local
    /^fc00:/, // IPv6 unique local
    /^fd00:/, // IPv6 unique local
  ];

  return privateRanges.some(range => range.test(cleanIP));
}

/**
 * 获取IP地址的地理位置信息（需要第三方服务）
 */
export async function getIPLocation(ip: string): Promise<{
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
} | null> {
  try {
    // 这里可以集成第三方IP地理位置服务
    // 例如：ipapi.co, ipinfo.io, geoip2 等

    // 示例：使用 ipapi.co 免费服务
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    if (response.ok) {
      const data = await response.json();
      return {
        country: data.country_name,
        region: data.region,
        city: data.city,
        timezone: data.timezone,
      };
    }
  } catch (error) {
    console.error('Failed to get IP location:', error);
  }

  return null;
}
