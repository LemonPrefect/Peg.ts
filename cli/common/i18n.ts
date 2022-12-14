import { i18next } from "./lib.ts";
// import { zhCN } from "./locales/zh-CN.json" assert { type: "json" };

const systemLocale = Intl.DateTimeFormat().resolvedOptions().locale;

// i18next
//   .use(Backend)
//   .init({
//     // debug: true,
//     fallbackLng: "en",
//     resources: {
//       en: {
//         translation: enTranslation,
//       },
//       de: {
//         translation: deTranslation,
//       },
//     }
//   });

// export default (lng: string | undefined | null) =>
//   i18next.getFixedT(lng || systemLocale);