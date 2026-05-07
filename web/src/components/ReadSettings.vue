<template>
  <div class="settings-wrapper" :style="popupTheme" :class="{ night: isNight, day: !isNight }">
    <div class="settings-title">设置</div>
    <div class="setting-list">
      <ul>
        <li class="theme-list">
          <i>阅读主题</i>
          <span
            class="theme-item"
            v-for="(themeColor, index) in themeColors"
            :key="index"
            :style="themeColor"
            ref="themes"
            @click="setTheme(index)"
            :class="{ selected: selectedTheme == index }"
          >
            <div 
              class="theme-name" 
              :style="{ color: settings.themes[index].defaultFontColor || (settings.themes[index].isNight ? '#f8f8f2' : '#262626') }"
            >
              {{ settings.themes[index].name }}
            </div>
            <em class="iconfont night-icon" v-if="settings.themes[index].isNight">&#58980;</em>
            <em class="iconfont selected-icon" v-if="selectedTheme == index">&#58940;</em>
          </span>
        </li>
        <li class="font-list">
          <i>字体颜色</i>
          <el-color-picker
            v-model="fontColor"
            size="default"
            color-format="hex"
            :validate-event="false"
            @change="saveFontColor"
            @active-change="changeFontColor"
          />
        </li>
        <li class="font-list">
          <i>正文字体</i>
          <span
            class="font-item"
            v-for="(font, index) in fonts"
            :key="index"
            :class="{ selected: selectedFont == index }"
            @click="setFont(index)"
            >{{ getFontDisplayName(font) }}</span
          >
        </li>
        <li class="font-list">
          <i>自定字体</i>
          <el-tooltip effect="dark" content="自定义的字体名称" placement="top">
            <input
              type="text"
              class="font-item font-item-input"
              v-model="customFontName"
              placeholder="请输入自定义的字体名称"
            />
          </el-tooltip>

          <el-popover
            placement="top"
            width="180"
            trigger="click"
            v-model:visible="customFontSavePopVisible"
          >
            <p>请确认输入的字体名称完整无误，并且该字体已经安装在您的设备上。</p>
            <p>确定保存吗？</p>
            <div style="text-align: right; margin: 0">
              <el-button size="small" plain @click="customFontSavePopVisible = false"
                >取消</el-button
              >
              <el-button
                type="primary"
                size="small"
                @click="
                  setCustomFont();
                  customFontSavePopVisible = false;
                "
                >确定</el-button
              >
            </div>
            <template #reference>
              <span type="text" class="font-item">保存</span>
            </template>
          </el-popover>
        </li>
        <li class="font-size">
          <i>字体大小</i>
          <div class="resize">
            <span class="less" @click="lessFontSize"><em class="iconfont">&#58966;</em></span
            ><b></b> <span class="lang">{{ fontSize }}</span
            ><b></b>
            <span class="more" @click="moreFontSize"><em class="iconfont">&#58976;</em></span>
          </div>
        </li>
        <li class="letter-spacing">
          <i>字距</i>
          <div class="resize">
            <span class="less" @click="lessLetterSpacing"><em class="iconfont">&#58966;</em></span
            ><b></b> <span class="lang">{{ spacing.letter.toFixed(2) }}</span
            ><b></b>
            <span class="more" @click="moreLetterSpacing"><em class="iconfont">&#58976;</em></span>
          </div>
        </li>
        <li class="line-spacing">
          <i>行距</i>
          <div class="resize">
            <span class="less" @click="lessLineSpacing"><em class="iconfont">&#58966;</em></span
            ><b></b> <span class="lang">{{ spacing.line.toFixed(1) }}</span
            ><b></b>
            <span class="more" @click="moreLineSpacing"><em class="iconfont">&#58976;</em></span>
          </div>
        </li>
        <li class="paragraph-spacing">
          <i>段距</i>
          <div class="resize">
            <div class="resize">
              <span class="less" @click="lessParagraphSpacing"
                ><em class="iconfont">&#58966;</em></span
              ><b></b> <span class="lang">{{ spacing.paragraph.toFixed(1) }}</span
              ><b></b>
              <span class="more" @click="moreParagraphSpacing"
                ><em class="iconfont">&#58976;</em></span
              >
            </div>
          </div>
        </li>
        <li class="read-width" v-if="!store.miniInterface">
          <i>页面宽度</i>
          <div class="resize">
            <span class="less" @click="lessReadWidth"><em class="iconfont">&#58965;</em></span
            ><b></b> <span class="lang">{{ readWidth }}</span
            ><b></b>
            <span class="more" @click="moreReadWidth"><em class="iconfont">&#58975;</em></span>
          </div>
        </li>
        <li class="infinite-loading">
          <i>无限加载</i>
          <span
            class="infinite-loading-item"
            :key="0"
            :class="{ selected: infiniteLoading == false }"
            @click="setInfiniteLoading(false)"
            >关闭</span
          >
          <span
            class="infinite-loading-item"
            :key="1"
            :class="{ selected: infiniteLoading == true }"
            @click="setInfiniteLoading(true)"
            >开启</span
          >
        </li>

      </ul>
    </div>
  </div>
</template>

<script setup>
import "../assets/fonts/popfont.css";
import "../assets/fonts/iconfont.css";
import settings from "../config/themeConfig";
import API from "@api";
const store = useBookStore();

const theme = ref(0);

const isNight = ref(settings.themes[store.config.theme]?.isNight || false);
const moonIcon = ref("");
const defaultThemeColors = [
  { background: "rgba(250, 245, 235, 0.8)" },
  { background: "rgba(245, 234, 204, 0.8)" },
  { background: "rgba(230, 242, 230, 0.8)" },
  { background: "rgba(228, 241, 245, 0.8)" },
  { background: "rgba(245, 228, 228, 0.8)" },
  { background: "rgba(224, 224, 224, 0.8)" },
  { background: "rgba(0, 0, 0, 0.5)" },
  { background: "linear-gradient(135deg, #282a36 50%, #21222c 50%)" }
];

const themeColors = computed(() => {
  return settings.themes.map((t, index) => {
    if (index < defaultThemeColors.length) {
      return defaultThemeColors[index];
    }
    return { background: t.body, backgroundSize: "cover" };
  });
});
const moonIconStyle = ref({
  display: "inline",
  color: "rgba(255,255,255,0.2)"
});
const fonts = computed(() => settings.fonts);
const getFontDisplayName = (fontFamily) => {
  let name = fontFamily;
  if (fontFamily.includes("Microsoft YaHei")) return "雅黑";
  if (fontFamily.includes("Simsun")) return "宋体";
  if (fontFamily.includes("Kaiti")) return "楷书";
  if (fontFamily.startsWith("Font_")) {
    name = fontFamily.replace("Font_", "").replace(/_/g, " ");
  }
  try {
    return decodeURIComponent(name);
  } catch (e) {
    return name;
  }
};
const customFontName = ref(store.config.customFontName);
const customFontSavePopVisible = ref(false);

onMounted(() => {
  //初始化设置项目
  var config = store.config;
  theme.value = config.theme;
  if (settings.themes[theme.value]?.isNight) {
    moonIcon.value = "";
  } else {
    moonIcon.value = "";
  }
});
const config = computed(() => {
  return store.config;
});

const popupTheme = computed(() => {
  return {
    background: settings.themes[config.value.theme].popup,
    color: config.value.fontColor
  };
});
const selectedTheme = computed(() => {
  return store.config.theme;
});
const selectedFont = computed(() => {
  return store.config.font;
});

const setTheme = (themeIndex) => {
  const selectedTheme = settings.themes[themeIndex];
  if (!selectedTheme) return;

  isNight.value = selectedTheme.isNight;
  moonIcon.value = selectedTheme.isNight ? "" : "";
  
  if (selectedTheme.isNight) {
    moonIconStyle.value.color = themeIndex === 7 ? "#ff79c6" : (themeIndex === 6 ? "#ed4259" : "#f6f6f4");
  } else {
    moonIconStyle.value.color = "rgba(255,255,255,0.2)";
  }
  
  fontColor.value = config.value.fontColor = selectedTheme.defaultFontColor || (selectedTheme.isNight ? "#f8f8f2" : "#262626");
  
  if (selectedTheme.fontFamily) {
    const fontIndex = settings.fonts.indexOf(selectedTheme.fontFamily);
    if (fontIndex !== -1) {
      config.value.font = fontIndex;
    }
  }

  config.value.theme = themeIndex;
  saveConfig(config.value);
};
const setFont = (font) => {
  config.value.font = font;
  saveConfig(config.value);
};
const setCustomFont = () => {
  config.value.font = -1;
  config.value.customFontName = customFontName.value;
  saveConfig(config.value);
};

const fontColor = ref(config.value.fontColor);
const saveFontColor = (color) => {
  if (!color) {
    const selectedTheme = settings.themes[config.value.theme];
    color = selectedTheme ? selectedTheme.defaultFontColor : "#262626";
  }
  fontColor.value = config.value.fontColor = color;
  saveConfig(config.value);
};
const changeFontColor = (color) => {
  if (color) {
    config.value.fontColor = color;
  } else {
    // 为空则是最后一次改变，需保存最后一次选择的颜色
    saveConfig(config.value);
  }
};

const fontSize = computed(() => {
  return store.config.fontSize;
});
const moreFontSize = () => {
  if (config.value.fontSize < 48) config.value.fontSize += 2;
  saveConfig(config.value);
};
const lessFontSize = () => {
  if (config.value.fontSize > 12) config.value.fontSize -= 2;
  saveConfig(config.value);
};

const spacing = computed(() => {
  return store.config.spacing;
});
const lessLetterSpacing = () => {
  store.config.spacing.letter -= 0.01;
  saveConfig(config.value);
};
const moreLetterSpacing = () => {
  store.config.spacing.letter += 0.01;
  saveConfig(config.value);
};
const lessLineSpacing = () => {
  store.config.spacing.line -= 0.1;
  saveConfig(config.value);
};
const moreLineSpacing = () => {
  store.config.spacing.line += 0.1;
  saveConfig(config.value);
};
const lessParagraphSpacing = () => {
  store.config.spacing.paragraph -= 0.1;
  saveConfig(config.value);
};
const moreParagraphSpacing = () => {
  store.config.spacing.paragraph += 0.1;
  saveConfig(config.value);
};

const readWidth = computed(() => {
  return store.config.readWidth;
});
const moreReadWidth = () => {
  // 此时会截断页面
  if (config.value.readWidth + 160 + 2 * 68 > window.innerWidth) return;
  config.value.readWidth += 160;
  saveConfig(config.value);
};
const lessReadWidth = () => {
  if (config.value.readWidth > 640) config.value.readWidth -= 160;
  saveConfig(config.value);
};
const infiniteLoading = computed(() => {
  return store.config.infiniteLoading;
});
const setInfiniteLoading = (loading) => {
  config.value.infiniteLoading = loading;
  saveConfig(config.value);
};

const saveConfig = (config) => {
  store.setConfig(config);
  localStorage.setItem("config", JSON.stringify(config));
  uploadConfig(config);
};
const uploadConfig = (config) => {
  API.saveReadConfig(config);
};
</script>

<style lang="scss" scoped>
:deep(.iconfont) {
  font-family: iconfont;
  font-style: normal;
}

:deep(.moon-icon) {
  font-family: iconfont;
  font-style: normal;
}

.settings-wrapper {
  user-select: none;
  margin: -13px;
  // width: 478px;
  // height: 350px;
  text-align: left;
  padding: 40px 0 40px 24px;
  background: #ede7da url("../assets/imgs/themes/popup_1.png") repeat;

  .settings-title {
    font-size: 18px;
    line-height: 22px;
    margin-bottom: 28px;
    font-family: FZZCYSK;
    font-weight: 400;
  }

  .setting-list {
    max-height: calc(70vh - 50px);
    overflow: auto;

    ul {
      list-style: none outside none;
      margin: 0;
      padding: 0;

      li {
        list-style: none outside none;

        i {
          font: 12px / 16px PingFangSC-Regular, "-apple-system", Simsun;
          display: inline-block;
          min-width: 48px;
          margin-right: 16px;
          vertical-align: middle;
          color: #666;
        }

        .theme-item {
          line-height: 34px;
          width: 78px;
          height: 34px;
          margin-right: 12px;
          margin-top: 10px;
          border-radius: 4px;
          display: inline-block;
          cursor: pointer;
          text-align: center;
          vertical-align: middle;
          border: 1px solid rgba(128, 128, 128, 0.2);
          position: relative;
          overflow: hidden;

          .theme-name {
            font-size: 12px;
            font-weight: 500;
          }

          .iconfont {
            display: none;
            position: absolute;
            font-size: 12px;
          }

          .night-icon {
            display: block;
            right: 2px;
            top: -10px;
            color: rgba(255, 255, 255, 0.5);
          }

          .selected-icon {
            right: 2px;
            bottom: -10px;
            color: #ed4259;
          }
        }

        .selected {
          border: 1.5px solid #ed4259 !important;

          .selected-icon {
            display: block;
          }
        }
      }

      .font-list,
      .infinite-loading {
        margin-top: 28px;

        .font-item,
        .infinite-loading-item {
          width: 78px;
          height: 34px;
          cursor: pointer;
          margin-right: 16px;
          border-radius: 2px;
          text-align: center;
          vertical-align: middle;
          display: inline-block;
          font: 14px / 34px PingFangSC-Regular, HelveticaNeue-Light, "Helvetica Neue Light",
            "Microsoft YaHei", sans-serif;
        }
        .font-item-input {
          width: 168px;
          color: #000000;
        }
        .selected {
          color: #ed4259;
          border: 1px solid #ed4259;
        }

        .font-item:hover,
        .infinite-loading-item:hover {
          border: 1px solid #ed4259;
          color: #ed4259;
        }
      }

      .font-size,
      .read-width,
      .letter-spacing,
      .line-spacing,
      .paragraph-spacing {
        margin-top: 28px;

        .resize {
          display: inline-block;
          width: 274px;
          height: 34px;
          vertical-align: middle;
          border-radius: 2px;

          span {
            width: 89px;
            height: 34px;
            line-height: 34px;
            display: inline-block;
            cursor: pointer;
            text-align: center;
            vertical-align: middle;

            em {
              font-style: normal;
            }
          }

          .less:hover,
          .more:hover {
            color: #ed4259;
          }

          .lang {
            color: #a6a6a6;
            font-weight: 400;
            font-family: FZZCYSK;
          }

          b {
            display: inline-block;
            height: 20px;
            vertical-align: middle;
          }
        }
      }
    }
  }
}

.night {
  :deep(.theme-item) {
    border: 1px solid #666;
  }

  :deep(.selected) {
    border: 1px solid #666;
  }

  :deep(.moon-icon) {
    color: #ed4259;
  }

  :deep(.font-list),
  .infinite-loading {
    .font-item,
    .infinite-loading-item {
      border: 1px solid #666;
      background: rgba(45, 45, 45, 0.5);
    }
  }

  :deep(.resize) {
    border: 1px solid #666;
    background: rgba(45, 45, 45, 0.5);

    b {
      border-right: 1px solid #666;
    }
  }
}

.day {
  :deep(.theme-item) {
    border: 1px solid #e5e5e5;
  }

  :deep(.selected) {
    border: 1px solid #ed4259;
  }

  :deep(.moon-icon) {
    display: inline;
    color: rgba(255, 255, 255, 0.2);
  }

  :deep(.font-list),
  .infinite-loading {
    .font-item,
    .infinite-loading-item {
      background: rgba(255, 255, 255, 0.5);
      border: 1px solid rgba(0, 0, 0, 0.1);
    }
  }

  :deep(.resize) {
    border: 1px solid #e5e5e5;
    background: rgba(255, 255, 255, 0.5);

    b {
      border-right: 1px solid #e5e5e5;
    }
  }
}

@media screen and (max-width: 500px) {
  .settings-wrapper i {
    display: flex !important;
    flex-wrap: wrap;
    padding-bottom: 5px !important;
  }
}
</style>
