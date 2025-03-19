import dynamic from 'next/dynamic'

// 使用 dynamic import 导入客户端组件
const LandingPage = dynamic(() => import('@/app/landing'), {
  ssr: true // 启用服务端渲染
})

export default function Page() {
  return <LandingPage />;
} 