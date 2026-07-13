window.Config = {

  // [v2.0] 显示标题
  SiteName: 'Public Status',

  // [v2.0] UptimeRobot Api Keys
  // 支持 Monitor-Specific 和 Read-Only
  ApiKeys: [
    'ur3280511-b99cbcb60ebae9fcfff493a2',
  ],

  // [v2.0] 日志天数
  // 建议 60 或 90，显示效果比较好
  CountDays: 60,

  // [v2.0] 是否显示检测站点的链接
  ShowLink: false,

  // [v2.0] 导航栏菜单
  Navi: [
    {
      text: 'GitHub',
      url: 'https://github.com/sepclouds/uptime'
    },
    {
      text: 'blog',
      url: 'https://sep.cc'
    },
  ],

  // [v2.1] Umami 统计站点的 ID (可选)
  UmamiId: '',

  // [v2.1] Umami 统计站点的服务器地址 (可选)
  UmamiServer: '',

  // [v2.1] SEO 描述 (可选)
  SEO_Description: '一个基于 UptimeRobot API 的在线状态面板',

  // [v2.1] SEO 关键词 (可选)
  SEO_Keywords: 'uptime, status, monitor',

  // [v2.1] 自定义 CSS (可选)
  // 例如: #footer { display: none; }
  CustomCSS: '#footer { display: none; }',

  // [v2.1] 自定义 JS (可选)
  CustomJS: '',
};
