import { prisma } from '../src/lib/prisma';

const SAMPLE_HLS_STREAMS = [
  'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
  'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8',
];

const MOVIES = [
  {
    doubanId: '26302614',
    imdbId: 'tt5182866',
    tmdbId: 'tv-64010',
    title: '请回答1988',
    originalTitle: '응답하라 1988',
    year: '2015',
    type: 'tv',
    poster: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=600&q=80',
    backdropsJson: JSON.stringify([
      'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80',
    ]),
    rating: 9.7,
    genres: '剧情 / 喜剧 / 爱情',
    regions: '韩国',
    languages: '韩语',
    directors: '申元浩',
    actors: '李惠利 / 朴宝剑 / 柳俊烈 / 高庚杓 / 李东辉 / 成东日 / 李一花 / 罗美兰 / 金成均 / 崔武成 / 金善映 / 刘在明 / 柳慧英 / 安宰弘 / 崔盛元 / 李敏芝',
    duration: '90分钟',
    episodeBadge: '20集全',
    episodeCount: 20,
    currentEpisode: 20,
    airDate: '2015-11-06',
    summary: '故事以1988年汉城（今首尔）奥运会为背景，讲述在首尔市道峰区双门洞居住的五家人的故事，这五个家庭都有一个生于1971年的孩子。德善、善宇、东龙、崔泽、正焕，是从小一起长大的好朋友，1988年正处于他们18岁的青春年华，他们有着共同的兴趣，还有共同崇拜的偶像，在这五个男女中也有暧昧的男女情愫，在那个纯真的年代，他们共同谱写了许多美好的记忆。',
    aiRecommendation: '申元浩导演将市井温情与青春阵痛揉进双门洞的胡同日常，用极具烟火气的群像叙事，让每个观众都能在胡同的饭香与夕阳里找回失落的邻里亲情与青春遗憾。',
    doubanReviewsJson: JSON.stringify([
      { author: '西楼尘', rating: 5, date: '2016-01-17', content: '大人只是在忍，只是在忙着大人们的事，只是在用故作坚强来承担年龄的重担，大人们，也会疼。' },
      { author: '暖晴', rating: 5, date: '2015-12-20', content: '双门洞的冬天那么冷，但只要五家人围坐在一起吃饭，所有的风雪都被挡在了门外。' },
    ]),
    seriesKey: 'reply-series',
    seasonNumber: 3,
    seasonTitle: '请回答1988',
    isNew: false,
    isHot: true,
    isTrending: true,
    watchedCount: 1420,
    wishCount: 389,
    viewCount: 9850,
  },
  {
    doubanId: '1292052',
    imdbId: 'tt0111161',
    tmdbId: 'movie-278',
    title: '肖申克的救赎',
    originalTitle: 'The Shawshank Redemption',
    year: '1994',
    type: 'movie',
    poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    backdropsJson: JSON.stringify([
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1200&q=80',
    ]),
    rating: 9.7,
    genres: '剧情 / 犯罪',
    regions: '美国',
    languages: '英语',
    directors: '弗兰克·德拉邦特',
    actors: '蒂姆·罗宾斯 / 摩根·弗里曼 / 鲍勃·冈顿 / 威廉姆·赛德勒 / 克兰西·布朗',
    duration: '142分钟',
    episodeBadge: 'HD中字',
    episodeCount: 1,
    currentEpisode: 1,
    airDate: '1994-09-10',
    summary: '一场谋杀案使银行家安迪蒙冤入狱，谋杀妻子及其情人的指控将囚禁他终生。在肖申克监狱的首次现身就让监狱“大哥”瑞德对他另眼相看。瑞德帮助他搞到一把石锤和一幅女明星海报，两人渐成患难之交。很快，安迪在监狱里大显其才，担当监狱图书管理员，并利用自己的金融知识帮助典狱长洗黑钱……',
    aiRecommendation: '穿过体制高墙的灵魂史诗：德拉邦特用近乎古典的镜头语言证明，真正的自由从不取决于围墙的厚度，而在于一个人对希望的执念有多深。',
    doubanReviewsJson: JSON.stringify([
      { author: '大头绿豆', rating: 5, date: '2005-10-02', content: '恐惧让你沦为囚犯，希望让你重获自由。' },
      { author: '如小果', rating: 5, date: '2008-03-14', content: '有些鸟儿是注定不会被关在牢笼里的，它们的每一片羽毛都闪耀着自由的光辉。' },
    ]),
    isNew: false,
    isHot: true,
    isTrending: true,
    watchedCount: 2810,
    wishCount: 512,
    viewCount: 15420,
  },
  {
    doubanId: '36151692',
    imdbId: 'tt32109876',
    tmdbId: 'movie-112233',
    title: '破·地狱',
    originalTitle: 'The Last Dance',
    year: '2024',
    type: 'movie',
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    backdropsJson: JSON.stringify([
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80',
    ]),
    rating: 8.4,
    genres: '剧情 / 家庭',
    regions: '中国香港',
    languages: '粤语',
    directors: '陈茂贤',
    actors: '黄子华 / 许冠文 / 卫诗雅 / 朱栢康 / 周家怡 / 秦沛 / 金燕玲',
    duration: '126分钟',
    episodeBadge: 'HD粤语中字',
    episodeCount: 1,
    currentEpisode: 1,
    airDate: '2024-11-09',
    summary: '婚礼策划师道生（黄子华 饰）被迫改行成为葬礼经纪人。红事变白事，道生处处碰壁，面对喃呒师傅文哥（许冠文 饰）的百般刁难，道生起初因理念不合与文哥产生许多冲突，但数次危难时刻文哥的出手相助，以及亲历文哥与女儿文玥（卫诗雅 饰）相处的点点滴滴，道生与文哥之间的心结慢慢解开，也逐渐悟到“破地狱”的真正意义。',
    aiRecommendation: '借香港殡仪业的喃呒科仪切入东亚家庭最隐秘的创伤：不止逝者需要破地狱，活在执念与传统枷锁里的生人同样需要一场自我超度。',
    doubanReviewsJson: JSON.stringify([
      { author: '港片迷', rating: 5, date: '2024-11-15', content: '生人也需要破地狱，生人也有好多地狱。黄子华与许冠文两代喜剧泰斗贡献了近年最催泪的表演。' },
    ]),
    isNew: true,
    isHot: true,
    isTrending: true,
    watchedCount: 960,
    wishCount: 410,
    viewCount: 11200,
  },
  {
    doubanId: '35267208',
    imdbId: 'tt27589902',
    tmdbId: 'tv-224891',
    title: '漫长的季节',
    originalTitle: '漫长的季节',
    year: '2023',
    type: 'tv',
    poster: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    backdropsJson: JSON.stringify([
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    ]),
    rating: 9.4,
    genres: '剧情 / 悬疑 / 犯罪',
    regions: '中国大陆',
    languages: '汉语普通话',
    directors: '辛爽',
    actors: '范伟 / 秦昊 / 陈明昊 / 李庚希 / 刘奕铁 / 蒋奇明',
    duration: '60分钟',
    episodeBadge: '12集全',
    episodeCount: 12,
    currentEpisode: 12,
    airDate: '2023-04-22',
    summary: '小城桦林，此时，出租司机王响做梦也没想到，他还有机会遇到一个他此生最想遇到，又最怕遇到的人。是仇人还是故人？遇到了，就得有交代，给自己，也给儿子。小城桦林，彼时，火车司机王响意气风发，开的了最快最好的火车，娶了最美丽的女人，生了最聪明的儿子，却在一夜之间失去了一切。',
    aiRecommendation: '辛爽用明媚的东北秋日阳光包裹最彻骨的时代悲剧，三条时间线交织出一曲关于命运、尊严与“往前看，别回头”的平民挽歌。',
    doubanReviewsJson: JSON.stringify([
      { author: '桦林往事', rating: 5, date: '2023-05-02', content: '打个响指吧，吹起小喇叭，滴答滴答滴答滴答。往前看，别回头。' },
    ]),
    isNew: false,
    isHot: true,
    isTrending: true,
    watchedCount: 1180,
    wishCount: 295,
    viewCount: 8900,
  },
  {
    doubanId: '36283051',
    imdbId: 'tt29342862',
    tmdbId: 'movie-1188104',
    title: '周处除三害',
    originalTitle: 'The Pig, the Snake and the Pigeon',
    year: '2023',
    type: 'movie',
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
    backdropsJson: JSON.stringify([
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80',
    ]),
    rating: 8.1,
    genres: '动作 / 犯罪',
    regions: '中国台湾',
    languages: '汉语普通话 / 闽南语',
    directors: '黄精甫',
    actors: '阮经天 / 袁富华 / 陈以文 / 王净 / 李李仁 / 谢琼煖',
    duration: '134分钟',
    episodeBadge: 'HD中字',
    episodeCount: 1,
    currentEpisode: 1,
    airDate: '2023-10-06',
    summary: '通缉犯陈桂林（阮经天 饰）生命将尽，却发现自己在通缉榜上只排名第三，他决心查出前两名通缉犯的下落，并将他们一一除掉。陈桂林以为自己已成为当代的周处除三害，却没想到永远参不透的贪、嗔、痴，才是人生终要面对的罪与罚。',
    aiRecommendation: '生猛凌厉的暴力美学与佛教“贪嗔痴”三毒隐喻碰撞，阮经天贡献了极具癫狂张力的末路狂徒弧光。',
    doubanReviewsJson: JSON.stringify([
      { author: '新造的人', rating: 4, date: '2024-03-01', content: '礼堂那场戏直接封神，新造的人旋律一响起全身起鸡皮疙瘩。' },
    ]),
    isNew: false,
    isHot: true,
    isTrending: true,
    watchedCount: 1050,
    wishCount: 210,
    viewCount: 8400,
  },
  {
    doubanId: '35465232',
    imdbId: 'tt13283824',
    tmdbId: 'tv-110356',
    title: '繁花',
    originalTitle: 'Blossoms Shanghai',
    year: '2023',
    type: 'tv',
    poster: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=600&q=80',
    backdropsJson: JSON.stringify([
      'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80',
    ]),
    rating: 8.7,
    genres: '剧情 / 爱情',
    regions: '中国大陆',
    languages: '沪语 / 汉语普通话',
    directors: '王家卫',
    actors: '胡歌 / 马伊琍 / 唐嫣 / 辛芷蕾 / 游本昌 / 郑恺 / 陈龙',
    duration: '50分钟',
    episodeBadge: '更新至06集',
    episodeCount: 30,
    currentEpisode: 6,
    airDate: '2023-12-27',
    nextAirDate: '今日 19:30 更新第07集',
    summary: '九十年代的上海处处是机遇与希望。青年阿宝（胡歌 饰）凭借改革开放的春风和自己的打拼跻身成为商界后起之秀，黄河路上无人不晓。平凡阿宝蜕变为宝总，离不开高人爷叔与夜东京老板玲子、外贸大楼汪小姐的鼎力协助。',
    aiRecommendation: '王家卫用流光溢彩的胶片质感重塑90年代黄河路的商战江湖，在推杯换盏与时代潮汐之间写尽海派儿女的情义与孤独。',
    doubanReviewsJson: JSON.stringify([
      { author: '黄河路常客', rating: 5, date: '2024-01-09', content: '不响最大。王家卫把三十集连续剧拍成了三十部电影。' },
    ]),
    isNew: true,
    isHot: true,
    isTrending: true,
    watchedCount: 870,
    wishCount: 340,
    viewCount: 7900,
  },
  {
    doubanId: '35689244',
    imdbId: 'tt22248376',
    tmdbId: 'tv-209867',
    title: '葬送的芙莉莲',
    originalTitle: '葬送のフリーレン',
    year: '2023',
    type: 'cartoon',
    poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    backdropsJson: JSON.stringify([
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
    ]),
    rating: 9.5,
    genres: '剧情 / 动画 / 奇幻 / 冒险',
    regions: '日本',
    languages: '日语',
    directors: '斋藤圭一郎',
    actors: '种崎敦美 / 市之濑加那 / 小林千晃 / 冈本信彦 / 东地宏树',
    duration: '24分钟',
    episodeBadge: '28集全',
    episodeCount: 28,
    currentEpisode: 28,
    airDate: '2023-09-29',
    summary: '身为精灵族的芙莉莲与同伴欣梅尔、艾泽、海塔花了十年打倒了魔王凯旋回到王都，众人接受了国王接见与表扬。正值每隔五十年出现一次的半世纪流星雨，芙莉莲还天真地说下次要带大家去一个更好的地方欣赏流星。然而五十年过去，欣梅尔已经老去逝世，芙莉莲这才意识到自己从未真正了解过身边的人类伙伴……',
    aiRecommendation: '从“打倒魔王之后”开启的后日谈奇幻杰作：用近乎散文诗的节奏探讨漫长生命里如何理解短暂的爱、告别与记忆。',
    doubanReviewsJson: JSON.stringify([
      { author: '苍月草', rating: 5, date: '2023-10-12', content: '勇者欣梅尔的话，一定也会这么做的。' },
    ]),
    isNew: false,
    isHot: true,
    isTrending: true,
    watchedCount: 920,
    wishCount: 410,
    viewCount: 8100,
  },
  {
    doubanId: '30413052',
    imdbId: 'tt2560140',
    tmdbId: 'tv-1429',
    title: '进击的巨人 最终季 完结篇',
    originalTitle: '進撃の巨人 The Final Season 完結編',
    year: '2023',
    type: 'cartoon',
    poster: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80',
    backdropsJson: JSON.stringify([
      'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1200&q=80',
    ]),
    rating: 9.3,
    genres: '动作 / 科幻 / 动画 / 灾难',
    regions: '日本',
    languages: '日语',
    directors: '林祐一郎',
    actors: '梶裕贵 / 石川由依 / 井上麻里奈 / 神谷浩史',
    duration: '85分钟',
    episodeBadge: '完结篇全',
    episodeCount: 4,
    currentEpisode: 4,
    airDate: '2023-11-04',
    summary: '为了阻止艾伦发动地鸣毁灭世界，阿尔敏、三笠、利威尔等昔日伙伴组成同盟，展开了赌上人类命运的最终决战。十年动画史诗在此落下帷幕。',
    aiRecommendation: '宏大残酷的世界观闭环，以极具冲击力的作画与配乐叩问自由的代价与仇恨的螺旋。',
    doubanReviewsJson: JSON.stringify([]),
    isNew: false,
    isHot: true,
    isTrending: false,
    watchedCount: 740,
    wishCount: 190,
    viewCount: 6400,
  },
  {
    doubanId: '36445098',
    imdbId: 'tt33001122',
    tmdbId: 'tv-251001',
    title: '现在就出发 第二季',
    originalTitle: '现在就出发2',
    year: '2024',
    type: 'show',
    poster: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=600&q=80',
    backdropsJson: JSON.stringify([
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80',
    ]),
    rating: 8.8,
    genres: '喜剧 / 真人秀',
    regions: '中国大陆',
    languages: '汉语普通话',
    directors: '王莉',
    actors: '沈腾 / 白敬亭 / 金晨 / 贾冰 / 胡先煦 / 宋亚轩 / 王安宇',
    duration: '120分钟',
    episodeBadge: '更新至20241215期',
    episodeCount: 10,
    currentEpisode: 8,
    airDate: '2024-10-26',
    nextAirDate: '今日 12:00 更新最新一期',
    summary: '沈腾携出发团老友与新朋再度集结，奔赴新疆、云南等自然秘境，在轻松荒诞的游戏互动和野生露营做饭中开启充电之旅。',
    aiRecommendation: '熟人局化学反应拉满的解压电子榨菜，沈腾与贾冰、黄景瑜、王安宇的接梗密集自然，毫无剧本包袱。',
    doubanReviewsJson: JSON.stringify([]),
    isNew: true,
    isHot: true,
    isTrending: true,
    watchedCount: 610,
    wishCount: 150,
    viewCount: 7200,
  },
  {
    doubanId: '36323120',
    imdbId: 'tt33009988',
    tmdbId: 'tv-259001',
    title: '喜剧之王单口季',
    originalTitle: '喜剧之王单口季',
    year: '2024',
    type: 'show',
    poster: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=600&q=80',
    backdropsJson: JSON.stringify([]),
    rating: 8.3,
    genres: '喜剧 / 脱口秀',
    regions: '中国大陆',
    languages: '汉语普通话',
    directors: '谭晓虹',
    actors: '郭麒麟 / 吴镇宇 / 徐峥 / 杨天真 / 庞博 / 王建国 / 周奇墨 / 付航',
    duration: '130分钟',
    episodeBadge: '10期全',
    episodeCount: 10,
    currentEpisode: 10,
    airDate: '2024-08-16',
    summary: '从小人物到喜剧之王，四十余组单口喜剧演员同台竞技，用幽默消解生活焦虑，争夺年度单口季总冠军。',
    aiRecommendation: '付航的Passion与众多新人黑马的扎实文本，让单口喜剧重回真诚共鸣与高密度笑点的舞台。',
    doubanReviewsJson: JSON.stringify([]),
    isNew: true,
    isHot: true,
    isTrending: false,
    watchedCount: 540,
    wishCount: 120,
    viewCount: 5300,
  },
  {
    doubanId: '1889243',
    imdbId: 'tt0816692',
    tmdbId: 'movie-157336',
    title: '星际穿越',
    originalTitle: 'Interstellar',
    year: '2014',
    type: 'movie',
    poster: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
    backdropsJson: JSON.stringify([
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    ]),
    rating: 9.4,
    genres: '剧情 / 科幻 / 冒险',
    regions: '美国 / 英国 / 加拿大',
    languages: '英语',
    directors: '克里斯托弗·诺兰',
    actors: '马修·麦康纳 / 安妮·海瑟薇 / 杰西卡·查斯坦 / 迈克尔·凯恩 / 麦肯吉·弗依',
    duration: '169分钟',
    episodeBadge: '4K修复版',
    episodeCount: 1,
    currentEpisode: 1,
    airDate: '2014-11-07',
    summary: '近未来的地球黄沙遍野，小麦、秋葵等基础农作物相继因枯萎病灭绝，人类不再像从前那样仰望星空，放纵想象力和灵感的迸发，而是每日在沙尘暴的肆虐下倒数着所剩不多的光景。前NASA宇航员库珀穿越虫洞寻找人类新家园……',
    aiRecommendation: '硬核天体物理学与跨越五维时空的父女羁绊交响，汉斯·季默的管风琴配乐将宇宙的孤寂与爱的引力推向极致。',
    doubanReviewsJson: JSON.stringify([]),
    isNew: false,
    isHot: true,
    isTrending: true,
    watchedCount: 1980,
    wishCount: 430,
    viewCount: 12100,
  },
  {
    doubanId: '25986180',
    imdbId: 'tt5700672',
    tmdbId: 'movie-396535',
    title: '釜山行',
    originalTitle: '부산행',
    year: '2016',
    type: 'movie',
    poster: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=600&q=80',
    backdropsJson: JSON.stringify([]),
    rating: 8.6,
    genres: '动作 / 惊悚 / 灾难',
    regions: '韩国',
    languages: '韩语',
    directors: '延尚昊',
    actors: '孔刘 / 郑有美 / 马东锡 / 金秀安 / 金义城 / 崔宇植',
    duration: '118分钟',
    episodeBadge: 'HD中字',
    episodeCount: 1,
    currentEpisode: 1,
    airDate: '2016-07-20',
    summary: '证券基金经纪人石宇光鲜精干，却也是个重利轻义之徒。妻子离他而去，女儿秀安则要求生日那天去釜山看妈妈。在开往釜山的KTX高速列车上，丧尸病毒瞬间爆发，密闭车厢化作人间炼狱……',
    aiRecommendation: '将丧尸类型片放进高速飞驰的KTX密闭列车，在生死竞速中精准解剖人性的自私与牺牲。',
    doubanReviewsJson: JSON.stringify([]),
    isNew: false,
    isHot: true,
    isTrending: false,
    watchedCount: 1320,
    wishCount: 240,
    viewCount: 7600,
  },
  {
    doubanId: '6922792',
    imdbId: 'tt2161439',
    tmdbId: 'tv-46331',
    title: '甄嬛传',
    originalTitle: '后宫·甄嬛传',
    year: '2011',
    type: 'tv',
    poster: 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?auto=format&fit=crop&w=600&q=80',
    backdropsJson: JSON.stringify([
      'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=900&q=80',
    ]),
    rating: 9.4,
    genres: '剧情 / 古装',
    regions: '中国大陆',
    languages: '汉语普通话',
    directors: '郑晓龙',
    actors: '孙俪 / 陈建斌 / 蔡少芬 / 李东学 / 蒋欣 / 陶昕然 / 斓曦 / 孙茜 / 张晓龙 / 刘雪华',
    duration: '45分钟',
    episodeBadge: '全76集',
    episodeCount: 76,
    currentEpisode: 76,
    airDate: '2011-11-17',
    summary: '时为满清雍正元年，结束了血腥的夺位之争，新的君主继位，国泰民安，政治清明，但在一片祥和的表象之下，一股暗流蠢蠢欲动。尤其后宫之中，华妃与皇后分庭抗礼，各方势力裹挟其中，凶险异常。十七岁的甄嬛与好姐妹眉庄、陵容奉命参选秀女，自此步步惊心……',
    aiRecommendation: '宫廷剧无法逾越的巅峰之作，台词考究、礼制严谨，将一个少女在封建深宫中的理想破灭与异化拍得惊心动魄。',
    doubanReviewsJson: JSON.stringify([
      {
        author: '碎玉轩常住人口',
        rating: 5,
        content: '76集没有一集是废戏，每年重温都能品出新的潜台词与人情世故。',
        date: '2024-02-10',
      },
    ]),
    isNew: false,
    isHot: true,
    isTrending: true,
    watchedCount: 4680,
    wishCount: 620,
    viewCount: 24500,
  },
];

const PROVIDERS = [
  { key: 'ffzy', name: '非凡资源', speed: 420, stability: '稳定' },
  { key: 'bfzy', name: '暴风资源', speed: 580, stability: '稳定' },
  { key: 'lzi', name: '量子资源', speed: 640, stability: '稳定' },
  { key: 'dytt', name: '电影天堂', speed: 890, stability: '一般' },
  { key: 'ruyi', name: '如意资源', speed: 510, stability: '稳定' },
  { key: 'snzy', name: '索尼资源', speed: 1250, stability: '较差' },
];

async function main() {
  console.log('Seeding Moovie catalog (with zero demo login accounts)...');

  for (const m of MOVIES) {
    const movie = await prisma.movie.upsert({
      where: { doubanId: m.doubanId },
      update: m,
      create: m,
    });

    await prisma.playbackSource.deleteMany({ where: { movieId: movie.id } });

    const sourceCount = m.type === 'movie' ? 6 : 4;
    for (let i = 0; i < sourceCount; i += 1) {
      const p = PROVIDERS[i % PROVIDERS.length];
      const vodId = `${m.doubanId}-${p.key}`;
      const versionLabel =
        m.type === 'movie'
          ? i === 0
            ? 'HD中字'
            : i === 1
              ? '1080P蓝光'
              : i === 2
                ? '4K高码'
                : 'HD国语/原声'
          : m.episodeBadge || '全集';

      const source = await prisma.playbackSource.create({
        data: {
          movieId: movie.id,
          sourceKey: p.key,
          sourceName: p.name,
          vodId,
          versionLabel,
          loadSpeedMs: p.speed + i * 45,
          stability: p.stability,
        },
      });

      const epTotal = Math.min(m.episodeCount, m.type === 'movie' ? 1 : 80);
      const episodesData = [];
      for (let ep = 1; ep <= epTotal; ep += 1) {
        episodesData.push({
          movieId: movie.id,
          sourceId: source.id,
          episodeNumber: ep,
          title: m.type === 'movie' ? versionLabel : `第${String(ep).padStart(2, '0')}集`,
          playUrl: SAMPLE_HLS_STREAMS[(ep + i) % SAMPLE_HLS_STREAMS.length],
          airDate: m.airDate || '2024-01-01',
        });
      }
      await prisma.episode.createMany({ data: episodesData });
    }
  }

  // Non-login catalog cinephile profiles (for public /cinema, /user/:id, /review/:id showcase)
  const profiles = [
    {
      id: '1102',
      username: 'Serein',
      avatar: '🎞️',
      bio: '偏爱慢节奏家庭剧与冷门惊悚片，每周固定双门洞重温。',
      joinedDays: 128,
      watchedCount: 42,
      wishCount: 19,
      reviewsCount: 24,
      avgRating: 8.8,
      personaTag: '双门洞常驻观察员',
      longestStreak: 9,
      topGenresJson: JSON.stringify(['剧情', '悬疑', '家庭', '科幻']),
      watchedDoubanIds: JSON.stringify(['26302614', '1292052', '36151692', '35267208', '1889243']),
      wishDoubanIds: JSON.stringify(['35465232', '35689244']),
    },
    {
      id: '1088',
      username: '阿止',
      avatar: '🍿',
      bio: '每年看片200+，港片与黑色犯罪题材死忠。',
      joinedDays: 96,
      watchedCount: 68,
      wishCount: 27,
      reviewsCount: 31,
      avgRating: 8.3,
      personaTag: '港产迷影捕手',
      longestStreak: 12,
      topGenresJson: JSON.stringify(['犯罪', '剧情', '动作', '喜剧']),
      watchedDoubanIds: JSON.stringify(['36151692', '36283051', '35267208', '25986180']),
      wishDoubanIds: JSON.stringify(['1889243']),
    },
    {
      id: '1045',
      username: 'Momo',
      avatar: '🌙',
      bio: '动画与科幻爱好者，相信光影能治愈一切疲惫。',
      joinedDays: 74,
      watchedCount: 35,
      wishCount: 16,
      reviewsCount: 15,
      avgRating: 9.1,
      personaTag: '星际奇幻旅人',
      longestStreak: 7,
      topGenresJson: JSON.stringify(['动画', '科幻', '奇幻', '冒险']),
      watchedDoubanIds: JSON.stringify(['35689244', '30413052', '1889243', '26302614']),
      wishDoubanIds: JSON.stringify(['36151692']),
    },
  ];

  for (const p of profiles) {
    await prisma.cinephileProfile.upsert({
      where: { id: p.id },
      update: p,
      create: p,
    });
  }

  // Featured short reviews (including /review/925)
  const movie1988 = await prisma.movie.findUniqueOrThrow({ where: { doubanId: '26302614' } });
  const movieLastDance = await prisma.movie.findUniqueOrThrow({ where: { doubanId: '36151692' } });
  const movieLongSeason = await prisma.movie.findUniqueOrThrow({ where: { doubanId: '35267208' } });
  const movieFrieren = await prisma.movie.findUniqueOrThrow({ where: { doubanId: '35689244' } });

  const comments = [
    {
      id: '925',
      movieId: movie1988.id,
      doubanId: '26302614',
      profileId: '1102',
      authorName: 'Serein',
      authorAvatar: '🎞️',
      rating: 5,
      content: '每次冬天重看《请回答1988》，听到胡同口妈妈们喊回家吃饭的声音，眼眶还是会发热。时间带走了青春，但双门洞永远留在1988年。',
      likesCount: 18,
      isFeatured: true,
    },
    {
      id: '926',
      movieId: movieLastDance.id,
      doubanId: '36151692',
      profileId: '1088',
      authorName: '阿止',
      authorAvatar: '🍿',
      rating: 5,
      content: '“生人也需要破地狱，生人也有好多地狱。”黄子华和许冠文在喃呒火光里的对手戏太震撼了，今年华语院线最值得静下心看的一部。',
      likesCount: 24,
      isFeatured: true,
    },
    {
      id: '927',
      movieId: movieLongSeason.id,
      doubanId: '35267208',
      profileId: '1088',
      authorName: '阿止',
      authorAvatar: '🍿',
      rating: 5,
      content: '最后一场漫天大雪飘落进玉米地的时候，王响对二十年前的自己喊出“往前看，别回头”，所有的悬疑都在那一刻化作了时代的叹息。',
      likesCount: 31,
      isFeatured: true,
    },
    {
      id: '928',
      movieId: movieFrieren.id,
      doubanId: '35689244',
      profileId: '1045',
      authorName: 'Momo',
      authorAvatar: '🌙',
      rating: 5,
      content: '原来打倒魔王只是短短十年的序章，用一生的旅途去读懂曾经并肩看过的流星雨，才是芙莉莲最温柔的魔法。',
      likesCount: 15,
      isFeatured: true,
    },
  ];

  for (const c of comments) {
    await prisma.comment.upsert({
      where: { id: c.id },
      update: c,
      create: c,
    });
  }

  await prisma.commentReply.deleteMany({ where: { commentId: '925' } });
  await prisma.commentReply.create({
    data: {
      commentId: '925',
      authorName: 'Momo',
      authorAvatar: '🌙',
      content: '同感！豹子女士和成东日大叔的戏份每次看都又哭又笑。',
    },
  });

  // Curated Lists (/list and /list/[slug])
  const lists = [
    {
      slug: 'selected-11',
      title: '深海幽闭与未知生物：幽闭空间惊悚片单',
      description: '当列车门焊死、太空舱失联、深海压力逼近极限，在无处可逃的密闭空间里，比未知怪物更可怕的往往是人性的裂痕。',
      isPublished: true,
      relatedSlugsJson: JSON.stringify(['selected-10', 'selected-09']),
      items: [
        { doubanId: '25986180', rank: 1, note: '飞驰的KTX列车化作密闭修罗场，每一节车厢都是人性试炼场。' },
        { doubanId: '1889243', rank: 2, note: '横跨虫洞与黑洞视界的深空幽闭感，时间膨胀下的每一秒都令人窒息。' },
        { doubanId: '36283051', rank: 3, note: '灵修礼堂的心理幽闭空间，温柔歌声背后的洗脑与集体狂热。' },
        { doubanId: '1292052', rank: 4, note: '高墙之内的体制囚笼，用二十年时间在绝望石墙上凿出自由通道。' },
      ],
    },
    {
      slug: 'selected-10',
      title: '人间烟火与岁月回响：冬日治愈高分剧集',
      description: '适合在寒夜里裹紧毛毯慢慢看的剧集与电影，每一部都有热气腾腾的饭菜、嘴硬心软的家人和走散后又重逢的挚友。',
      isPublished: true,
      relatedSlugsJson: JSON.stringify(['selected-11', 'selected-09']),
      items: [
        { doubanId: '26302614', rank: 1, note: '双门洞胡同里的五家人，把最寻常的柴米油盐拍成了永恒的青春乡愁。' },
        { doubanId: '36151692', rank: 2, note: '跨越生死的父女和解与行业坚守，在告别中学会珍惜眼前人。' },
        { doubanId: '35689244', rank: 3, note: '在漫长时光中重走勇者小队的旅途，每一朵苍月草都盛开着思念。' },
        { doubanId: '35465232', rank: 4, note: '黄河路灯火辉煌背后的一碗泡饭，写尽半生江湖情义。' },
      ],
    },
    {
      slug: 'selected-09',
      title: '时代褶皱里的命运悬疑：华语口碑神作精选',
      description: '不止于寻找真凶，更在于看清时代洪流之下普通人如何在泥沙俱下中守住最后的体面与执念。',
      isPublished: true,
      relatedSlugsJson: JSON.stringify(['selected-10', 'selected-11']),
      items: [
        { doubanId: '35267208', rank: 1, note: '桦林钢厂的秋日阳光与漫天大雪，近十年华语悬疑剧当之无愧的巅峰。' },
        { doubanId: '36151692', rank: 2, note: '红白二事交织的人生剧场，叩问传统礼法与现代个体的心灵出路。' },
        { doubanId: '36283051', rank: 3, note: '以暴制暴的黑色寓言，贪嗔痴三害环环相扣。' },
        { doubanId: '35465232', rank: 4, note: '九十年代上海滩资本博弈与儿女情长，镜头美学登峰造极。' },
      ],
    },
  ];

  for (const l of lists) {
    const listRecord = await prisma.curatedList.upsert({
      where: { slug: l.slug },
      update: {
        title: l.title,
        description: l.description,
        isPublished: l.isPublished,
        relatedSlugsJson: l.relatedSlugsJson,
      },
      create: {
        slug: l.slug,
        title: l.title,
        description: l.description,
        isPublished: l.isPublished,
        relatedSlugsJson: l.relatedSlugsJson,
      },
    });

    await prisma.curatedListItem.deleteMany({ where: { listId: listRecord.id } });
    for (const item of l.items) {
      const m = await prisma.movie.findUnique({ where: { doubanId: item.doubanId } });
      if (m) {
        await prisma.curatedListItem.create({
          data: {
            listId: listRecord.id,
            movieId: m.id,
            doubanId: m.doubanId,
            rank: item.rank,
            note: item.note,
          },
        });
      }
    }
  }

  // Search Trends (/trends)
  const trends = [
    { keyword: '破·地狱', doubanId: '36151692', count24h: 1842, countAll: 19450, isHot: true, isNew: true },
    { keyword: '请回答1988', doubanId: '26302614', count24h: 1520, countAll: 34210, isHot: true, isNew: false },
    { keyword: '漫长的季节', doubanId: '35267208', count24h: 1290, countAll: 28900, isHot: true, isNew: false },
    { keyword: '现在就出发 第二季', doubanId: '36445098', count24h: 1105, countAll: 14300, isHot: true, isNew: true },
    { keyword: '繁花', doubanId: '35465232', count24h: 980, countAll: 26700, isHot: true, isNew: false },
    { keyword: '肖申克的救赎', doubanId: '1292052', count24h: 890, countAll: 41200, isHot: false, isNew: false },
    { keyword: '葬送的芙莉莲', doubanId: '35689244', count24h: 840, countAll: 18600, isHot: false, isNew: false },
    { keyword: '周处除三害', doubanId: '36283051', count24h: 760, countAll: 22100, isHot: false, isNew: false },
    { keyword: '星际穿越', doubanId: '1889243', count24h: 695, countAll: 31500, isHot: false, isNew: false },
    { keyword: '喜剧之王单口季', doubanId: '36323120', count24h: 610, countAll: 12400, isHot: false, isNew: true },
    { keyword: '进击的巨人 最终季 完结篇', doubanId: '30413052', count24h: 540, countAll: 15800, isHot: false, isNew: false },
    { keyword: '釜山行', doubanId: '25986180', count24h: 490, countAll: 19200, isHot: false, isNew: false },
  ];

  for (const t of trends) {
    await prisma.searchTrend.upsert({
      where: { keyword: t.keyword },
      update: t,
      create: t,
    });
  }

  // Community Feedbacks (/feedback)
  const existingFeedbackCount = await prisma.feedback.count();
  if (existingFeedbackCount === 0) {
    await prisma.feedback.createMany({
      data: [
        {
          authorName: 'Serein',
          type: 'bug',
          movieUrl: '/watch/26302614',
          content: '《请回答1988》第3集在部分移动网络下非凡资源偶发缓冲较慢，切换到暴风资源后恢复正常。',
          status: 'resolved',
          adminReply: '已重新校准非凡资源节点权重并启用自动故障回退，感谢反馈！',
          repliedAt: new Date(Date.now() - 3600 * 1000 * 12),
        },
        {
          authorName: '阿止',
          type: 'request',
          movieUrl: '',
          content: '求收录《破·地狱》粤语原声加长版资源！',
          status: 'resolved',
          adminReply: '已同步上线 HD粤语中字与1080P蓝光线路，可直接前往详情页观看。',
          repliedAt: new Date(Date.now() - 3600 * 1000 * 24),
        },
        {
          authorName: 'Momo',
          type: 'suggestion',
          movieUrl: '',
          content: '希望片单详情页能够展示相关片单推荐，看完一个主题可以顺着继续找片。',
          status: 'resolved',
          adminReply: '已在 v4.1.1 上线「继续看片单」关联推荐功能！',
          repliedAt: new Date(Date.now() - 3600 * 1000 * 48),
        },
      ],
    });
  }

  // Danmaku samples
  const existingDanmakuCount = await prisma.danmaku.count();
  if (existingDanmakuCount === 0) {
    await prisma.danmaku.createMany({
      data: [
        { streamKey: '26302614_1', authorName: 'Serein', text: '双门洞打卡！第N次重温依然泪目', time: 2.5, color: '#ffffff' },
        { streamKey: '26302614_1', authorName: '阿止', text: '1988年的汉城奥运会开幕式！', time: 6.0, color: '#f5a623' },
        { streamKey: '26302614_1', authorName: 'Momo', text: '德善太可爱了哈哈哈', time: 11.2, color: '#4dab9a' },
        { streamKey: '1292052_1', authorName: '阿止', text: '影史第一神作，致敬安迪！', time: 3.0, color: '#ffffff' },
        { streamKey: '36151692_1', authorName: 'Serein', text: '生人也需要破地狱', time: 4.2, color: '#f5a623' },
      ],
    });
  }

  // Crowd-sourced Ad Fingerprints
  await prisma.adFingerprint.upsert({
    where: { fingerprint: 'sha256_ffzy_discontinuity_15s_slot_01' },
    update: {},
    create: {
      fingerprint: 'sha256_ffzy_discontinuity_15s_slot_01',
      sourceKey: 'ffzy',
      segmentDuration: 15.0,
      confirmVotes: 12,
      rejectVotes: 1,
      isConfirmed: true,
    },
  });

  await prisma.adFingerprint.upsert({
    where: { fingerprint: 'sha256_bfzy_candidate_ad_12s_slot_02' },
    update: {},
    create: {
      fingerprint: 'sha256_bfzy_candidate_ad_12s_slot_02',
      sourceKey: 'bfzy',
      segmentDuration: 12.0,
      confirmVotes: 3,
      rejectVotes: 0,
      isConfirmed: false,
    },
  });

  // Unified Content Filter sample (v4.2.1)
  await prisma.contentFilter.upsert({
    where: { keyword: '博彩测试词' },
    update: {},
    create: {
      keyword: '博彩测试词',
      isBlocked: true,
      isCopyright: false,
      isSensitive: true,
      note: '默认拦截垃圾采集与敏感热搜词',
    },
  });

  const userCount = await prisma.user.count();
  console.log(`Catalog seed complete! Movies: ${MOVIES.length}, Registered Users: ${userCount} (zero demo accounts).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
