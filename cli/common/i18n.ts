import { i18next } from "./lib.ts";
import zhcn from "../locales/zhcn.json" assert { type: "json" };
import engb from "../locales/engb.json" assert { type: "json" };

const systemLocale = Intl.DateTimeFormat().resolvedOptions().locale;

i18next
  .init({
    // debug: true,
    fallbackLng: "en-GB",
    interpolation: {
      escapeValue: false
    },
    resources: {
      "zh-CN": {
        translation: zhcn,
      },
      "en-GB": {
        translation: engb,
      },
    }
  });

export default (lang: string | undefined | null = undefined) => i18next.getFixedT(lang || systemLocale);