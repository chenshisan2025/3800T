# 小程序上架部署指南

## 1. 小程序基本信息配置

### 1.1 小程序信息

- **小程序名称**: 古灵通
- **小程序简介**: AI驱动的智能股票分析助手
- **服务类别**: 金融业 > 证券/基金/期货/外汇
- **主体类型**: 企业
- **经营范围**: 软件开发、信息技术咨询服务

### 1.2 开发者信息

- **开发者**: [公司名称]
- **联系邮箱**: dev@gulingtong.com
- **客服电话**: 400-xxx-xxxx
- **官网地址**: https://www.gulingtong.com

## 2. 业务域名配置

### 2.1 服务器域名设置

在微信公众平台 > 开发 > 开发管理 > 开发设置 > 服务器域名中配置：

#### request合法域名

```
https://api.gulingtong.com
https://data.gulingtong.com
https://auth.gulingtong.com
https://cdn.gulingtong.com
```

#### socket合法域名

```
wss://ws.gulingtong.com
wss://realtime.gulingtong.com
```

#### uploadFile合法域名

```
https://upload.gulingtong.com
https://oss.gulingtong.com
```

#### downloadFile合法域名

```
https://cdn.gulingtong.com
https://static.gulingtong.com
https://files.gulingtong.com
```

### 2.2 业务域名验证

#### 验证步骤

1. **下载验证文件**
   - 在微信公众平台下载域名验证文件
   - 文件名格式：`MP_verify_xxxxxxxxxx.txt`

2. **上传验证文件**

   ```bash
   # 将验证文件上传到各域名根目录
   scp MP_verify_xxxxxxxxxx.txt user@api.gulingtong.com:/var/www/html/
   scp MP_verify_xxxxxxxxxx.txt user@data.gulingtong.com:/var/www/html/
   scp MP_verify_xxxxxxxxxx.txt user@auth.gulingtong.com:/var/www/html/
   ```

3. **验证域名可访问性**

   ```bash
   # 测试验证文件是否可访问
   curl https://api.gulingtong.com/MP_verify_xxxxxxxxxx.txt
   curl https://data.gulingtong.com/MP_verify_xxxxxxxxxx.txt
   curl https://auth.gulingtong.com/MP_verify_xxxxxxxxxx.txt
   ```

4. **在微信公众平台完成验证**
   - 点击"验证"按钮
   - 确认所有域名验证通过

### 2.3 域名配置检查脚本

创建 `scripts/check-domains.sh`：

```bash
#!/bin/bash

echo "=== 小程序域名配置检查 ==="

# 定义域名列表
DOMAINS=(
  "api.gulingtong.com"
  "data.gulingtong.com"
  "auth.gulingtong.com"
  "cdn.gulingtong.com"
  "upload.gulingtong.com"
  "static.gulingtong.com"
)

# 检查域名解析
echo "1. 检查域名解析:"
for domain in "${DOMAINS[@]}"; do
  echo -n "$domain: "
  if nslookup $domain > /dev/null 2>&1; then
    echo "✓ 解析正常"
  else
    echo "✗ 解析失败"
  fi
done

# 检查SSL证书
echo "\n2. 检查SSL证书:"
for domain in "${DOMAINS[@]}"; do
  echo -n "$domain: "
  if echo | openssl s_client -servername $domain -connect $domain:443 2>/dev/null | openssl x509 -noout -dates > /dev/null 2>&1; then
    EXPIRY=$(echo | openssl s_client -servername $domain -connect $domain:443 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
    echo "✓ 证书有效，到期时间: $EXPIRY"
  else
    echo "✗ 证书无效或无法访问"
  fi
done

# 检查HTTP状态
echo "\n3. 检查HTTP状态:"
for domain in "${DOMAINS[@]}"; do
  echo -n "$domain: "
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$domain/)
  if [ "$STATUS" = "200" ] || [ "$STATUS" = "404" ]; then
    echo "✓ HTTP $STATUS"
  else
    echo "✗ HTTP $STATUS"
  fi
done

echo "\n=== 检查完成 ==="
```

## 3. ICP备案要求

### 3.1 备案材料清单

#### 主体备案材料

- [ ] **营业执照副本**（彩色扫描件）
- [ ] **法人身份证**（正反面彩色扫描件）
- [ ] **法人手机号**（备案期间保持畅通）
- [ ] **法人邮箱**（用于接收备案通知）
- [ ] **公司座机号码**（可选）

#### 网站备案材料

- [ ] **网站负责人身份证**（正反面彩色扫描件）
- [ ] **网站负责人手机号**（备案期间保持畅通）
- [ ] **网站负责人邮箱**
- [ ] **真实性核验单**（加盖公章）
- [ ] **网站建设方案书**
- [ ] **域名证书**（各域名注册商提供）

### 3.2 备案信息表

#### 主体信息

```
主办单位名称: [公司全称]
主办单位性质: 企业
证件类型: 营业执照
证件号码: [统一社会信用代码]
法定代表人: [法人姓名]
联系方式: [法人手机号]
通信地址: [公司注册地址]
```

#### 网站信息

```
网站名称: 古灵通官网
网站域名:
  - www.gulingtong.com
  - api.gulingtong.com
  - data.gulingtong.com
  - auth.gulingtong.com
  - cdn.gulingtong.com
  - upload.gulingtong.com
  - static.gulingtong.com
网站服务内容: 金融信息服务、软件开发
前置审批项: 无
```

### 3.3 备案流程

1. **选择备案服务商**
   - 阿里云、腾讯云、华为云等
   - 根据服务器所在地选择

2. **提交备案申请**
   - 在服务商备案系统提交材料
   - 填写主体信息和网站信息
   - 上传相关证件

3. **初审阶段**
   - 服务商审核材料（1-2个工作日）
   - 根据反馈修改完善材料

4. **管局审核**
   - 提交至通信管理局审核
   - 审核周期：7-20个工作日

5. **备案完成**
   - 获得ICP备案号
   - 在网站底部显示备案号

### 3.4 备案号显示

在小程序页面底部添加备案信息：

```javascript
// pages/index/index.wxml
<view class="footer">
  <text class="icp-info">{{icpInfo}}</text>
</view>

// pages/index/index.js
Page({
  data: {
    icpInfo: '京ICP备xxxxxxxx号-1'
  }
});

// pages/index/index.wxss
.footer {
  text-align: center;
  padding: 20rpx;
  color: #999;
  font-size: 24rpx;
}

.icp-info {
  color: #666;
}
```

## 4. 模板消息配置

### 4.1 订阅消息模板申请

#### 股价提醒通知

```
模板标题: 股价提醒通知
模板内容:
{{thing1.DATA}}
股票代码: {{character_string2.DATA}}
当前价格: {{amount3.DATA}}
涨跌幅: {{phrase4.DATA}}
提醒时间: {{time5.DATA}}

参数说明:
- thing1: 提醒内容（如"股价达到预设条件"）
- character_string2: 股票代码（如"000001"）
- amount3: 当前价格（如"15.68元"）
- phrase4: 涨跌幅（如"+5.2%"）
- time5: 提醒时间
```

#### AI分析完成通知

```
模板标题: AI分析完成通知
模板内容:
{{thing1.DATA}}
分析股票: {{thing2.DATA}}
分析结果: {{thing3.DATA}}
完成时间: {{time4.DATA}}

参数说明:
- thing1: 通知内容（如"AI深度分析已完成"）
- thing2: 股票名称（如"平安银行"）
- thing3: 分析结果摘要
- time4: 完成时间
```

#### 重要资讯推送

```
模板标题: 重要资讯推送
模板内容:
{{thing1.DATA}}
资讯标题: {{thing2.DATA}}
影响股票: {{thing3.DATA}}
发布时间: {{time4.DATA}}

参数说明:
- thing1: 资讯类型（如"重要公告"）
- thing2: 资讯标题
- thing3: 相关股票
- time4: 发布时间
```

### 4.2 订阅消息代码实现

#### 申请订阅权限

```javascript
// utils/subscription.js
class SubscriptionManager {
  constructor() {
    this.templateIds = {
      PRICE_ALERT: 'template_id_price_alert',
      AI_ANALYSIS: 'template_id_ai_analysis',
      NEWS_PUSH: 'template_id_news_push',
    };
  }

  // 申请订阅权限
  async requestSubscription(templates = []) {
    const tmplIds =
      templates.length > 0 ? templates : Object.values(this.templateIds);

    return new Promise((resolve, reject) => {
      wx.requestSubscribeMessage({
        tmplIds: tmplIds,
        success: res => {
          console.log('订阅申请结果:', res);
          this.handleSubscriptionResult(res);
          resolve(res);
        },
        fail: err => {
          console.error('订阅申请失败:', err);
          reject(err);
        },
      });
    });
  }

  // 处理订阅结果
  handleSubscriptionResult(res) {
    const results = {};
    Object.entries(this.templateIds).forEach(([key, templateId]) => {
      if (res[templateId]) {
        results[key] = res[templateId] === 'accept';
      }
    });

    // 保存订阅状态到本地
    wx.setStorageSync('subscription_status', results);

    // 上报到服务器
    this.updateServerSubscription(results);
  }

  // 更新服务器订阅状态
  async updateServerSubscription(subscriptions) {
    try {
      await wx.request({
        url: 'https://api.gulingtong.com/api/user/subscription',
        method: 'POST',
        data: {
          subscriptions: subscriptions,
          openid: wx.getStorageSync('openid'),
        },
        header: {
          Authorization: `Bearer ${wx.getStorageSync('token')}`,
        },
      });
    } catch (error) {
      console.error('更新服务器订阅状态失败:', error);
    }
  }

  // 检查订阅状态
  getSubscriptionStatus() {
    return wx.getStorageSync('subscription_status') || {};
  }

  // 引导用户订阅
  showSubscriptionGuide(type) {
    const messages = {
      PRICE_ALERT: '开启股价提醒，及时掌握价格变动',
      AI_ANALYSIS: '订阅AI分析通知，第一时间获取分析结果',
      NEWS_PUSH: '订阅重要资讯，不错过市场机会',
    };

    wx.showModal({
      title: '开启消息通知',
      content: messages[type] || '开启消息通知，获得更好的使用体验',
      confirmText: '立即开启',
      success: res => {
        if (res.confirm) {
          this.requestSubscription([this.templateIds[type]]);
        }
      },
    });
  }
}

export default new SubscriptionManager();
```

#### 在页面中使用

```javascript
// pages/stock/detail.js
import SubscriptionManager from '../../utils/subscription';

Page({
  // 设置价格提醒
  async setPriceAlert() {
    // 检查是否已订阅
    const subscriptions = SubscriptionManager.getSubscriptionStatus();

    if (!subscriptions.PRICE_ALERT) {
      // 引导用户订阅
      try {
        await SubscriptionManager.requestSubscription([
          'template_id_price_alert',
        ]);
      } catch (error) {
        wx.showToast({
          title: '需要开启消息通知',
          icon: 'none',
        });
        return;
      }
    }

    // 设置提醒逻辑
    this.showPriceAlertDialog();
  },

  // AI分析完成后的通知
  async onAIAnalysisComplete() {
    const subscriptions = SubscriptionManager.getSubscriptionStatus();

    if (subscriptions.AI_ANALYSIS) {
      // 发送分析完成通知（由服务器端发送）
      wx.request({
        url: 'https://api.gulingtong.com/api/notification/ai-analysis',
        method: 'POST',
        data: {
          openid: wx.getStorageSync('openid'),
          stockCode: this.data.stockCode,
          analysisResult: this.data.analysisResult,
        },
      });
    }
  },
});
```

### 4.3 服务器端消息发送

#### Node.js实现

```javascript
// services/wechat-notification.js
const axios = require('axios');

class WeChatNotificationService {
  constructor() {
    this.appId = process.env.WECHAT_APPID;
    this.appSecret = process.env.WECHAT_APPSECRET;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // 获取访问令牌
  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry > Date.now()) {
      return this.accessToken;
    }

    try {
      const response = await axios.get(
        `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appId}&secret=${this.appSecret}`
      );

      if (response.data.access_token) {
        this.accessToken = response.data.access_token;
        this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000; // 提前5分钟过期
        return this.accessToken;
      } else {
        throw new Error('获取访问令牌失败: ' + JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('获取微信访问令牌失败:', error);
      throw error;
    }
  }

  // 发送订阅消息
  async sendSubscribeMessage(
    openid,
    templateId,
    data,
    page = 'pages/index/index'
  ) {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.post(
        `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`,
        {
          touser: openid,
          template_id: templateId,
          page: page,
          data: data,
          miniprogram_state:
            process.env.NODE_ENV === 'production' ? 'formal' : 'trial',
        }
      );

      if (response.data.errcode === 0) {
        console.log('订阅消息发送成功:', openid);
        return true;
      } else {
        console.error('订阅消息发送失败:', response.data);
        return false;
      }
    } catch (error) {
      console.error('发送订阅消息异常:', error);
      return false;
    }
  }

  // 发送股价提醒
  async sendPriceAlert(openid, stockCode, currentPrice, changePercent) {
    const data = {
      thing1: { value: '股价达到预设条件' },
      character_string2: { value: stockCode },
      amount3: { value: `${currentPrice}元` },
      phrase4: { value: `${changePercent > 0 ? '+' : ''}${changePercent}%` },
      time5: { value: new Date().toLocaleString('zh-CN') },
    };

    return await this.sendSubscribeMessage(
      openid,
      'template_id_price_alert',
      data,
      `pages/stock/detail?code=${stockCode}`
    );
  }

  // 发送AI分析完成通知
  async sendAIAnalysisComplete(openid, stockName, analysisResult) {
    const data = {
      thing1: { value: 'AI深度分析已完成' },
      thing2: { value: stockName },
      thing3: { value: analysisResult.substring(0, 20) + '...' },
      time4: { value: new Date().toLocaleString('zh-CN') },
    };

    return await this.sendSubscribeMessage(
      openid,
      'template_id_ai_analysis',
      data,
      'pages/analysis/result'
    );
  }

  // 发送重要资讯推送
  async sendNewsAlert(openid, newsTitle, relatedStock) {
    const data = {
      thing1: { value: '重要公告' },
      thing2: { value: newsTitle.substring(0, 20) + '...' },
      thing3: { value: relatedStock },
      time4: { value: new Date().toLocaleString('zh-CN') },
    };

    return await this.sendSubscribeMessage(
      openid,
      'template_id_news_push',
      data,
      'pages/news/detail'
    );
  }
}

module.exports = new WeChatNotificationService();
```

## 5. 小程序审核要点

### 5.1 功能完整性检查

- [ ] **页面完整性**
  - 所有页面功能正常
  - 无空白页面或加载失败
  - 页面跳转逻辑正确

- [ ] **数据展示**
  - 股票数据正常显示
  - AI分析结果完整
  - 图表渲染正确

- [ ] **交互功能**
  - 搜索功能正常
  - 自选股添加/删除
  - 价格提醒设置

### 5.2 内容合规性检查

- [ ] **金融合规**
  - 不提供投资建议
  - 明确风险提示
  - 不承诺收益

- [ ] **内容审查**
  - 无违法违规内容
  - 无敏感政治内容
  - 无虚假宣传

- [ ] **用户协议**
  - 用户协议完整
  - 隐私政策详细
  - 免责声明清晰

### 5.3 技术规范检查

- [ ] **性能要求**
  - 启动时间 < 3秒
  - 页面切换流畅
  - 内存使用合理

- [ ] **兼容性**
  - 支持主流微信版本
  - 适配不同屏幕尺寸
  - iOS/Android兼容

- [ ] **网络处理**
  - 网络异常处理
  - 加载状态提示
  - 重试机制完善

## 6. 上架提交清单

### 6.1 提交前检查

- [ ] 代码审查完成
- [ ] 功能测试通过
- [ ] 性能测试达标
- [ ] 安全测试完成
- [ ] 合规性审查通过
- [ ] 用户体验测试

### 6.2 提交材料

- [ ] 小程序代码包
- [ ] 版本说明
- [ ] 测试账号（如需要）
- [ ] 相关资质证明
- [ ] 隐私政策链接
- [ ] 用户协议链接

### 6.3 审核跟进

- [ ] 提交后24小时内关注审核状态
- [ ] 及时回复审核意见
- [ ] 修改后重新提交
- [ ] 审核通过后及时发布

---

_小程序部署指南最后更新: 2024年1月_
