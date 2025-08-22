import { Tag } from 'antd';
import { UserRole } from '@/types/rbac';

interface RoleTagProps {
  role: UserRole;
}

export function RoleTag({ role }: RoleTagProps) {
  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return { color: 'red', text: '管理员' };
      case UserRole.ANALYST:
        return { color: 'blue', text: '分析师' };
      case UserRole.SUPPORT:
        return { color: 'green', text: '客服' };
      default:
        return { color: 'default', text: '未知' };
    }
  };

  const { color, text } = getRoleConfig(role);

  return <Tag color={color}>{text}</Tag>;
}
