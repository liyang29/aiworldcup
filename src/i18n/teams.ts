// 球队名（国家名）本地化静态表：英文(数据源) → 中/西。
// 助手 teamName(英文名, 语种)：en 或未知名回退英文。可在服务端/客户端/edge 通用。

type Tr = { zh: string; es: string };

const TEAMS: Record<string, Tr> = {
  Algeria: { zh: '阿尔及利亚', es: 'Argelia' },
  Argentina: { zh: '阿根廷', es: 'Argentina' },
  Australia: { zh: '澳大利亚', es: 'Australia' },
  Austria: { zh: '奥地利', es: 'Austria' },
  Belgium: { zh: '比利时', es: 'Bélgica' },
  'Bosnia-Herzegovina': { zh: '波黑', es: 'Bosnia y Herzegovina' },
  Brazil: { zh: '巴西', es: 'Brasil' },
  Canada: { zh: '加拿大', es: 'Canadá' },
  'Cape Verde Islands': { zh: '佛得角', es: 'Cabo Verde' },
  Colombia: { zh: '哥伦比亚', es: 'Colombia' },
  'Congo DR': { zh: '刚果（金）', es: 'RD Congo' },
  Croatia: { zh: '克罗地亚', es: 'Croacia' },
  'Curaçao': { zh: '库拉索', es: 'Curazao' },
  Czechia: { zh: '捷克', es: 'Chequia' },
  Ecuador: { zh: '厄瓜多尔', es: 'Ecuador' },
  Egypt: { zh: '埃及', es: 'Egipto' },
  England: { zh: '英格兰', es: 'Inglaterra' },
  France: { zh: '法国', es: 'Francia' },
  Germany: { zh: '德国', es: 'Alemania' },
  Ghana: { zh: '加纳', es: 'Ghana' },
  Haiti: { zh: '海地', es: 'Haití' },
  Iran: { zh: '伊朗', es: 'Irán' },
  Iraq: { zh: '伊拉克', es: 'Irak' },
  'Ivory Coast': { zh: '科特迪瓦', es: 'Costa de Marfil' },
  Japan: { zh: '日本', es: 'Japón' },
  Jordan: { zh: '约旦', es: 'Jordania' },
  Mexico: { zh: '墨西哥', es: 'México' },
  Morocco: { zh: '摩洛哥', es: 'Marruecos' },
  Netherlands: { zh: '荷兰', es: 'Países Bajos' },
  'New Zealand': { zh: '新西兰', es: 'Nueva Zelanda' },
  Norway: { zh: '挪威', es: 'Noruega' },
  Panama: { zh: '巴拿马', es: 'Panamá' },
  Paraguay: { zh: '巴拉圭', es: 'Paraguay' },
  Portugal: { zh: '葡萄牙', es: 'Portugal' },
  Qatar: { zh: '卡塔尔', es: 'Catar' },
  'Saudi Arabia': { zh: '沙特阿拉伯', es: 'Arabia Saudita' },
  Scotland: { zh: '苏格兰', es: 'Escocia' },
  Senegal: { zh: '塞内加尔', es: 'Senegal' },
  'South Africa': { zh: '南非', es: 'Sudáfrica' },
  'South Korea': { zh: '韩国', es: 'Corea del Sur' },
  Spain: { zh: '西班牙', es: 'España' },
  Sweden: { zh: '瑞典', es: 'Suecia' },
  Switzerland: { zh: '瑞士', es: 'Suiza' },
  Tunisia: { zh: '突尼斯', es: 'Túnez' },
  Turkey: { zh: '土耳其', es: 'Turquía' },
  'United States': { zh: '美国', es: 'Estados Unidos' },
  Uruguay: { zh: '乌拉圭', es: 'Uruguay' },
  Uzbekistan: { zh: '乌兹别克斯坦', es: 'Uzbekistán' },
};

export function teamName(name: string | null | undefined, locale: string): string {
  if (!name) return '';
  if (locale === 'zh') return TEAMS[name]?.zh ?? name;
  if (locale === 'es') return TEAMS[name]?.es ?? name;
  return name;
}
