import type { CategoryGroup } from "./types";

const categorySeed: Array<{ name: string; subcategories: string[] }> = [
  {
    name: "食費",
    subcategories: ["健康食品", "食費", "食料品", "外食", "朝ご飯", "昼ご飯", "夜ご飯", "カフェ", "その他食事"],
  },
  {
    name: "日用品",
    subcategories: ["日用品", "子育て用品", "ドラッグストア", "おこづかい", "ペット用品", "たばこ", "その他日用品"],
  },
  {
    name: "趣味・娯楽",
    subcategories: ["スマホ代", "健康", "パソコン本体", "園芸", "アウトドア", "ゴルフ", "スポーツ", "映画・音楽・ゲーム", "本", "旅行", "秘密の趣味", "その他趣味・娯楽"],
  },
  {
    name: "交際費",
    subcategories: ["交際費", "飲み会", "プレゼント代", "冠婚葬祭", "その他交際費"],
  },
  {
    name: "交通費",
    subcategories: ["交通費", "電車", "バス", "タクシー", "飛行機", "その他交通費"],
  },
  {
    name: "衣服・美容",
    subcategories: ["衣服", "クリーニング", "美容院・理髪", "化粧品", "アクセサリー", "その他衣服・美容"],
  },
  {
    name: "健康・医療",
    subcategories: ["フィットネス", "ボディケア", "医療費", "薬", "その他健康・医療"],
  },
  {
    name: "自動車",
    subcategories: ["スーパーカブ", "自動車ローン", "道路料金", "ガソリン", "駐車場", "車両", "車検・整備", "自動車保険", "その他自動車"],
  },
  {
    name: "教養・教育",
    subcategories: ["書籍", "新聞・雑誌", "習い事", "学費", "塾", "その他教養・教育"],
  },
  {
    name: "特別な支出",
    subcategories: ["家具・家電", "住宅・リフォーム", "その他特別な支出"],
  },
  {
    name: "現金・カード",
    subcategories: ["ATM引き出し", "カード引き落とし", "電子マネー", "使途不明金", "その他現金・カード"],
  },
  {
    name: "水道・光熱費",
    subcategories: ["光熱費", "電気代", "ガス・灯油代", "水道代", "その他水道・光熱費"],
  },
  {
    name: "通信費",
    subcategories: ["携帯電話", "固定電話", "インターネット", "放送視聴料", "情報サービス", "宅配便・運送", "その他通信費"],
  },
  {
    name: "住宅",
    subcategories: ["住宅", "家賃・地代", "ローン返済", "管理費・積立金", "地震・火災保険", "その他住宅"],
  },
  {
    name: "税・社会保険",
    subcategories: ["所得税・住民税", "年金保険料", "健康保険", "その他税・社会保険"],
  },
  {
    name: "保険",
    subcategories: ["生命保険", "医療保険", "その他保険"],
  },
  {
    name: "その他",
    subcategories: ["仕事", "仕送り", "事業経費", "事業原価", "事業投資", "寄付金", "雑費"],
  },
  {
    name: "未分類",
    subcategories: ["未分類"],
  },
];

export const defaultCategories: CategoryGroup[] = categorySeed.map((group) => ({
  id: createCategoryId(group.name),
  name: group.name,
  subcategories: group.subcategories.map((subcategory) => ({
    id: createCategoryId(`${group.name}-${subcategory}`),
    name: subcategory,
  })),
}));

export function getFallbackCategory(categories: CategoryGroup[]): {
  major: string;
  minor: string;
} {
  const fallbackGroup =
    categories.find((category) => category.name === "未分類") ?? categories[0] ?? defaultCategories[0];
  const fallbackItem =
    fallbackGroup.subcategories.find((category) => category.name === "未分類") ??
    fallbackGroup.subcategories[0];

  return {
    major: fallbackGroup.name,
    minor: fallbackItem?.name ?? fallbackGroup.name,
  };
}

export function formatCategory(major: string, minor: string): string {
  return `${major} / ${minor}`;
}

function createCategoryId(value: string): string {
  return encodeURIComponent(value).replace(/%/g, "").toLowerCase();
}
