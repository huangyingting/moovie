import React from 'react';

type ReleaseItem = {
  tag: '优化' | '修复' | '重构' | '新增';
  text: string;
};

const TAG_STYLE: Record<ReleaseItem['tag'], { bg: string; color: string }> = {
  优化: { bg: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' },
  修复: { bg: 'rgba(16, 185, 129, 0.12)', color: '#059669' },
  重构: { bg: 'rgba(245, 158, 11, 0.14)', color: '#d97706' },
  新增: { bg: 'rgba(225, 29, 72, 0.12)', color: '#e11d48' },
};

const RELEASES: Array<{
  version: string;
  date: string;
  items: ReleaseItem[];
}> = [
  {
    version: 'v4.2.1',
    date: '2026-04-12',
    items: [
      { tag: '优化', text: '详情页没有海报时不再留出空白框，文案区域自然铺开' },
      { tag: '修复', text: '修复部分播放源偶发卡在「正在连接播放源」无法自动起播的问题' },
      { tag: '优化', text: '自动播放下一集倒计时从 8 秒调整为 15 秒，留出充足时间看片尾或手动切集' },
      { tag: '优化', text: '海报加载失败时显示带片名首字的微光渐变占位，不再留白' },
      { tag: '新增', text: '邀请制注册、单次限时邀请码、RBAC 角色权限控制与审计日志体系' },
    ],
  },
  {
    version: 'v4.1.2',
    date: '2026-03-30',
    items: [
      { tag: '重构', text: '影片详情页和观看页合二为一，点进任何电影直接就能看，信息、剧照、影评都在下方' },
      { tag: '优化', text: '电影不再展示只有 1 集的「选集」区域，不同画质版本直接整合到播放源列表' },
      { tag: '优化', text: '切换播放源移到播放器右上角，展开即可选源，不占页面空间' },
      { tag: '新增', text: '观看页下方直接展示 TMDB 剧照（点击可放大浏览）、豆瓣影评、片友短评、相似推荐' },
    ],
  },
  {
    version: 'v4.0.3',
    date: '2026-03-19',
    items: [
      { tag: '优化', text: '观看页操作栏重新设计：第三方下载、想看、看过归左，报错与智能跳过广告归右，层次更清晰' },
      { tag: '优化', text: '去掉观看页顶部冗余的面包屑导航，信息统一收归下方影片卡片' },
      { tag: '新增', text: '追剧日历上线：连载剧集播放页展示下一集预计播出时间' },
    ],
  },
  {
    version: 'v3.6.0',
    date: '2026-03-15',
    items: [
      { tag: '新增', text: '智能跳过贴片广告：基于众包与 M3U8 分片指纹自动识别并跳过源流中的插播广告' },
      { tag: '新增', text: '片友共同标记：遇到疑似广告时会温和询问，你的每一次点击都在帮全站用户排雷' },
      { tag: '优化', text: '支持随时在播放器下方开关此功能，误跳时一键撤销即可回退' },
    ],
  },
  {
    version: 'v3.4.0',
    date: '2026-02-10',
    items: [
      { tag: '新增', text: '上线「为你推荐」(/foryou) 个性化口味匹配、「片场」(/cinema) 与「关注动态」(/feed)' },
      { tag: '新增', text: '新增豆瓣账号绑定与想看/看过片单 RSS 自动同步功能' },
      { tag: '新增', text: '上线 IPTV 电视直播中心 (/iptv) 与 TVBox 接口生成服务 (/tvbox)' },
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="changelog-page" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', marginBottom: '4px' }}>
          CHANGELOG
        </div>
        <h1 style={{ fontSize: '26px', margin: '0 0 6px' }}>更新记录</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
          Moovie 影牛的每一次改进，都来自你的反馈。
        </p>
      </div>

      <div style={{ display: 'grid', gap: '18px' }}>
        {RELEASES.map((rel, idx) => (
          <div
            key={rel.version}
            className="changelog-card"
            style={{
              padding: '20px 22px',
              borderRadius: '12px',
              background: 'var(--bg-secondary)',
              border: idx === 0 ? '1px solid var(--accent)' : '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  padding: '2px 10px',
                  borderRadius: '6px',
                  background: idx === 0 ? 'var(--accent-solid)' : 'var(--bg)',
                  color: idx === 0 ? '#fff' : 'var(--text)',
                  border: idx === 0 ? 'none' : '1px solid var(--border)',
                }}
              >
                {rel.version}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{rel.date}</span>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '10px' }}>
              {rel.items.map((item, i) => {
                const badge = TAG_STYLE[item.tag];
                return (
                  <li
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      fontSize: '14px',
                      lineHeight: 1.6,
                      color: 'var(--text)',
                    }}
                  >
                    <span
                      className={`changelog-tag tag-${item.tag}`}
                      style={{
                        flexShrink: 0,
                        padding: '1px 8px',
                        borderRadius: '4px',
                        background: badge.bg,
                        color: badge.color,
                        fontSize: '12px',
                        fontWeight: 600,
                        marginTop: '2px',
                      }}
                    >
                      {item.tag}
                    </span>
                    <span>{item.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
