import { getServerUserCredits } from "@/app/actions";
import { ClientHeader } from "@/components/header";

export async function Header() {
  // 从服务器获取用户积分
  const credits = await getServerUserCredits();
  
  // 将积分传递给客户端组件
  return <ClientHeader initialCredits={credits || 0} />;
} 