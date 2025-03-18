// 菜单项接口
export interface MenuItem {
  name: string;
  price: string;
  description: string;
  menuImage: {
    b64_json: string;
  };
} 