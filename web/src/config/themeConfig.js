import body_0 from "../assets/imgs/themes/body_0.png";
import content_0 from "../assets/imgs/themes/content_0.png";
import popup_0 from "../assets/imgs/themes/popup_0.png";
import body_1 from "../assets/imgs/themes/body_1.png";
import content_1 from "../assets/imgs/themes/content_1.png";
import popup_1 from "../assets/imgs/themes/popup_1.png";
import body_2 from "../assets/imgs/themes/body_2.png";
import content_2 from "../assets/imgs/themes/content_2.png";
import popup_2 from "../assets/imgs/themes/popup_2.png";
import body_3 from "../assets/imgs/themes/body_3.png";
import content_3 from "../assets/imgs/themes/content_3.png";
import popup_3 from "../assets/imgs/themes/popup_3.png";
import body_5 from "../assets/imgs/themes/body_5.png";
import content_5 from "../assets/imgs/themes/content_5.png";
import popup_5 from "../assets/imgs/themes/popup_5.png";
import body_6 from "../assets/imgs/themes/body_6.png";
import content_6 from "../assets/imgs/themes/content_6.png";
import popup_6 from "../assets/imgs/themes/popup_6.png";
var settings = {
  themes: [
    {
      body: "#ede7da url(" + body_0 + ") repeat",
      content: "#ede7da url(" + content_0 + ") repeat",
      popup: "#ede7da url(" + popup_0 + ") repeat",
      isNight: false,
      defaultFontColor: "#262626",
      name: "默认"
    },
    {
      body: "#ede7da url(" + body_1 + ") repeat",
      content: "#ede7da url(" + content_1 + ") repeat",
      popup: "#ede7da url(" + popup_1 + ") repeat",
      isNight: false,
      defaultFontColor: "#262626",
      name: "复古"
    },
    {
      body: "#ede7da url(" + body_2 + ") repeat",
      content: "#ede7da url(" + content_2 + ") repeat",
      popup: "#ede7da url(" + popup_2 + ") repeat",
      isNight: false,
      defaultFontColor: "#262626",
      name: "护眼"
    },
    {
      body: "#ede7da url(" + body_3 + ") repeat",
      content: "#ede7da url(" + content_3 + ") repeat",
      popup: "#ede7da url(" + popup_3 + ") repeat",
      isNight: false,
      defaultFontColor: "#262626",
      name: "浅蓝"
    },
    {
      body: "#ebcece repeat",
      content: "#f5e4e4 repeat",
      popup: "#faeceb repeat",
      isNight: false,
      defaultFontColor: "#262626",
      name: "粉嫩"
    },
    {
      body: "#ede7da url(" + body_5 + ") repeat",
      content: "#ede7da url(" + content_5 + ") repeat",
      popup: "#ede7da url(" + popup_5 + ") repeat",
      isNight: false,
      defaultFontColor: "#262626",
      name: "灰度"
    },
    {
      body: "#ede7da url(" + body_6 + ") repeat",
      content: "#ede7da url(" + content_6 + ") repeat",
      popup: "#ede7da url(" + popup_6 + ") repeat",
      isNight: true,
      defaultFontColor: "#666",
      name: "夜间"
    },
    {
      body: "#282a36 repeat",
      content: "#282a36 repeat",
      popup: "#21222c repeat",
      isNight: true,
      defaultFontColor: "#f8f8f2",
      name: "Dracula"
    }
  ],
  fonts: [
    "Microsoft YaHei, PingFangSC-Regular, HelveticaNeue-Light, Helvetica Neue Light, sans-serif",

    "PingFangSC-Regular, -apple-system, Simsun",

    "Kaiti"
  ]
};

if (typeof window !== "undefined" && window.__LOCAL_THEMES__) {
  settings.themes.push(...window.__LOCAL_THEMES__);
  window.__LOCAL_THEMES__.forEach(t => {
    if (t.fontFamily && !settings.fonts.includes(t.fontFamily)) {
      settings.fonts.push(t.fontFamily);
    }
  });
}

export default settings;
