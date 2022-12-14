import { i18next } from "./lib.ts";
import zhcn from "../locales/zhcn.json" assert { type: "json" };
import enbg from "../locales/enbg.json" assert { type: "json" };

const systemLocale = Intl.DateTimeFormat().resolvedOptions().locale;

i18next
  .init({
    // debug: true,
    fallbackLng: "en-BG",
    resources: {
      "zh-CN": {
        translation: zhcn,
      },
      "en-BG": {
        translation: enbg,
      },
    }
  });

export default (lang: string | undefined | null = undefined) => i18next.getFixedT(lang || systemLocale);