<template>
  <div class="page-layout" :style="bodyTheme" :class="{ night: isNight, day: !isNight }">
    <div class="chapter-header-area" :style="{ background: bodyColor, color: fontColor }" @click="showToolBar = !showToolBar">
      <div class="chapter-info">
        {{ catalog[chapterIndex]?.title }}{{ chapterProgress }}
      </div>
    </div>
    <div
      class="scroll-container"
      ref="scrollContainer"
      @click="showToolBar = !showToolBar"
    >
      <div
        class="chapter-wrapper"
        :style="{ paddingTop: topPadding + 'px' }"
      >
        <div class="tool-bar" :style="leftBarTheme" @click.stop>
          <div class="tools">
            <el-popover
              placement="right"
              :width="popupWidth"
              trigger="click"
              :show-arrow="false"
              v-model:visible="popCataVisible"
              popper-class="pop-cata"
            >
              <PopCatalog @getContent="getContent" class="popup" />
              <template #reference>
                <div class="tool-icon" :class="{ 'no-point': noPoint }">
                  <div class="iconfont">&#58905;</div>
                  <div class="icon-text">目录</div>
                </div>
              </template>
            </el-popover>
            <el-popover
              placement="right"
              :width="popupWidth"
              trigger="click"
              :show-arrow="false"
              v-model:visible="readSettingsVisible"
              popper-class="pop-setting"
            >
              <read-settings class="popup" />
              <template #reference>
                <div class="tool-icon" :class="{ 'no-point': noPoint }">
                  <div class="iconfont">&#58971;</div>
                  <div class="icon-text">设置</div>
                </div>
              </template>
            </el-popover>
            <div class="tool-icon" @click="toShelf">
              <div class="iconfont">&#58892;</div>
              <div class="icon-text">书架</div>
            </div>
            <div class="tool-icon" :class="{ 'no-point': noPoint }" @click="toTop">
              <div class="iconfont">&#58914;</div>
              <div class="icon-text">顶部</div>
            </div>
            <div class="tool-icon" :class="{ 'no-point': noPoint }" @click="toBottom">
              <div class="iconfont">&#58915;</div>
              <div class="icon-text">底部</div>
            </div>
          </div>
        </div>
        <div class="read-bar" :style="rightBarTheme" @click.stop>
          <div class="tools">
            <div class="tool-icon" :class="{ 'no-point': noPoint }" @click="toPreChapter">
              <div class="iconfont">&#58920;</div>
              <span v-if="miniInterface">上一章</span>
            </div>
            <div class="tool-icon" :class="{ 'no-point': noPoint }" @click="toNextChapter">
              <span v-if="miniInterface">下一章</span>
              <div class="iconfont">&#58913;</div>
            </div>
            <div class="tool-icon" @click.stop="toggleZenMode">
              <div style="font-size: 14px; font-weight: bold; margin-bottom: 4px;">{{ isZenMode ? '▣' : '▢' }}</div>
              <div class="icon-text">{{ isZenMode ? '还原' : '全屏' }}</div>
            </div>
          </div>
        </div>
        <div class="chapter-bar"></div>
        <div class="chapter" ref="content" :style="chapterTheme">
          <div class="content">
            <div class="top-bar" ref="top"></div>
            <div class="loading-top" ref="loadingTop"></div>
            <div v-for="data in chapterData" :key="data.index" :chapterIndex="data.index" ref="chapterDivRefs">
              <chapter-content
                ref="chapterRef"
                :chapterIndex="data.index"
                :contents="data.content"
                :title="data.title"
                :spacing="store.config.spacing"
                :fontSize="fontSize"
                :fontFamily="fontFamily"
                :scrollContainer="scrollContainer"
                @readedLengthChange="onReadedLengthChange"
                v-if="showContent"
              />
            </div>
            <div class="loading" ref="loading"></div>
            <div class="bottom-bar" ref="bottom"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import jump from "@/plugins/jump";
import settings from "@/config/themeConfig";
import API from "@api";
import WEB from "@/api/web";
import { useLoading } from "@/hooks/loading";

const content = ref();
const scrollContainer = ref();
// loading spinner
const { isLoading, loadingWrapper } = useLoading(content, "正在获取信息");
const store = useBookStore();

// 读取阅读配置
try {
  const browerConfig = JSON.parse(localStorage.getItem("config"));
  if (browerConfig != null) store.setConfig(browerConfig);
} catch {
  localStorage.removeItem("config");
}

let isRestoringScroll = false;
let lastUserInteraction = Date.now();
const isIdle = ref(false);
const IDLE_THRESHOLD = 10 * 60 * 1000; // 10分钟
let idleTimer = null;

const recordUserInteraction = () => {
  if (isIdle.value) {
    isIdle.value = false;
    checkServerProgress();
  }
  lastUserInteraction = Date.now();
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    isIdle.value = true;
  }, IDLE_THRESHOLD);
};

const checkServerProgress = () => {
  const bookUrl = sessionStorage.getItem("bookUrl");
  if (!bookUrl) return;

  API.getBookShelf().then((res) => {
    if (res.data.isSuccess) {
      const serverBook = res.data.data.find((b) => b.bookUrl === bookUrl);
      if (serverBook) {
        const localIndex = chapterIndex.value;
        const localPos = chapterPos.value;
        const serverIndex = Number(serverBook.durChapterIndex) || 0;
        const serverPos = Number(serverBook.durChapterPos) || 0;

        if (serverIndex > localIndex || (serverIndex === localIndex && serverPos > localPos)) {
          ElMessageBox.confirm(
            `检测到服务器进度较新（第${serverIndex + 1}章），是否同步？`,
            "同步提醒",
            {
              confirmButtonText: "同步",
              cancelButtonText: "稍后",
              type: "info",
            }
          ).then(() => {
            getContent(serverIndex, true, serverPos);
          }).catch(() => {});
        }
      }
    }
  });
};

const scrollOptions = { passive: true };
onMounted(() => {
  recordUserInteraction(); // 初始化计时器
  if (scrollContainer.value) {
    scrollContainer.value.addEventListener("wheel", recordUserInteraction, scrollOptions);
    scrollContainer.value.addEventListener("touchmove", recordUserInteraction, scrollOptions);
    scrollContainer.value.addEventListener("keydown", recordUserInteraction, scrollOptions);
    scrollContainer.value.addEventListener("mousedown", recordUserInteraction, scrollOptions);
    scrollContainer.value.addEventListener("mousemove", (e) => {
      if (e.buttons > 0) recordUserInteraction();
    }, scrollOptions);
    scrollContainer.value.addEventListener("scroll", onScroll, scrollOptions);
  }
});

const getExactScrollKey = () => {
  const bookUrl = sessionStorage.getItem("bookUrl");
  if (!bookUrl) return null;
  return `exactScroll_${bookUrl}_${chapterIndex.value}`;
};

// 计算当前章节在 scrollContainer 内的起始像素偏移
// 单章模式：topPadding=0 且无前置章，结果为 0
// 无限加载滑动窗口：topPadding + 窗口内前置章节高度之和
const getChapterStartOffset = () => {
  if (!infiniteLoading.value) return 0;
  const currentArrayIndex = chapterData.value.findIndex(
    (ch) => ch.index === chapterIndex.value
  );
  if (currentArrayIndex <= 0) return topPadding.value;
  let offset = topPadding.value;
  for (let i = 0; i < currentArrayIndex; i++) {
    offset += chapterDivRefs.value[i]?.offsetHeight || 0;
  }
  return offset;
};

const onScroll = () => {
  if (isRestoringScroll) return;
  
  const currentScrollY = scrollContainer.value?.scrollTop || 0;
  const key = getExactScrollKey();
  
  // 忽略并修正 VS Code Webview 隐藏/显示时突然将 scrollTop 重置为 0 的行为
  if (currentScrollY === 0 && Date.now() - lastUserInteraction > 1000) {
    if (key) {
      const saved = localStorage.getItem(key);
      if (saved && Number(saved) > 0) {
        // exactScroll 存的是章节相对偏移，还原时需加上章节起始偏移得到绝对值
        const absoluteScroll = Number(saved) + getChapterStartOffset();
        isRestoringScroll = true;
        scrollContainer.value?.scrollTo({ top: absoluteScroll, behavior: "instant" });
        setTimeout(() => { isRestoringScroll = false; }, 200);
        return;
      }
    }
  }
  
  if (key) {
    // 保存章节相对偏移（= 绝对 scrollTop - 当前章节起始偏移）
    // fresh load 时 chapterStart=0，相对值 = 绝对值，可直接用于跨 session 还原
    const relativeScroll = Math.max(0, currentScrollY - getChapterStartOffset());
    localStorage.setItem(key, String(relativeScroll));
  }
};

const cleanupScrollRecords = () => {
  const bookUrl = sessionStorage.getItem("bookUrl");
  if (!bookUrl) return;
  const thisBookKeys = [];
  const otherKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith("exactScroll_")) continue;
    if (key.includes(bookUrl)) {
      thisBookKeys.push(key);
    } else {
      otherKeys.push(key);
    }
  }
  // 删除其他书籍的滚动记录
  otherKeys.forEach((key) => localStorage.removeItem(key));
  // 当前书只保留最近 30 章的滚动记录，避免无限积累
  const MAX_KEEP = 30;
  if (thisBookKeys.length > MAX_KEEP) {
    thisBookKeys
      .sort((a, b) => {
        const ia = parseInt(a.split("_").pop() || "0");
        const ib = parseInt(b.split("_").pop() || "0");
        return ia - ib;
      })
      .slice(0, thisBookKeys.length - MAX_KEEP)
      .forEach((key) => localStorage.removeItem(key));
  }
  console.log(`已清理非当前书籍滚动记录 ${otherKeys.length} 条，当前书保留最近 ${Math.min(thisBookKeys.length, MAX_KEEP)} 章记录`);
};

const {
  catalog,
  popCataVisible,
  readSettingsVisible,
  miniInterface,
  showContent,
  config,
  readingBook,
  bookProgress
} = storeToRefs(store);
const chapterPos = computed({
  get: () => readingBook.value.chapterPos,
  set: (value) => (readingBook.value.chapterPos = value)
});
const chapterIndex = computed({
  get: () => readingBook.value.index,
  set: (value) => (readingBook.value.index = value)
});

// 无限加载：chapterIndex 向前推进时删除已读过章节的 exactScroll
watch(chapterIndex, (newIndex, oldIndex) => {
  if (!infiniteLoading.value) return;
  if (newIndex <= oldIndex) return;
  const bookUrl = sessionStorage.getItem("bookUrl");
  if (!bookUrl) return;
  for (let i = oldIndex; i < newIndex; i++) {
    localStorage.removeItem(`exactScroll_${bookUrl}_${i}`);
  }
});

const chapterProgress = computed(() => {
  const data = chapterData.value.find((c) => c.index === chapterIndex.value);
  if (!data || !data.content || data.content.length === 0) return "";
  
  const imgPattern = /<img[^>]*src="[^"]*(?:"[^>]+\})?"[^>]*>/g;
  const total = data.content.reduce((sum, para) => {
    return sum + (para ? para.replaceAll(imgPattern, " ").length : 0) + 1;
  }, 0);
  
  if (total <= 0) return "";
  let pct = (chapterPos.value / total) * 100;
  if (pct < 0) pct = 0;
  if (pct > 100) pct = 100;
  return ` (${pct.toFixed(1)}%)`;
});

const theme = computed(() => config.value.theme);
const infiniteLoading = computed(() => config.value.infiniteLoading);

// 字体
const fontColor = computed(() => config.value.fontColor);
const fontColorRef = toRef(fontColor);
const fontFamily = computed(() => {
  if (store.config.font >= 0) {
    return settings.fonts[store.config.font];
  }
  return store.config.customFontName;
});
const fontSize = computed(() => {
  return store.config.fontSize + "px";
});

// 主题部分
const bodyColor = computed(() => settings.themes[theme.value].body);
const chapterColor = computed(() => settings.themes[theme.value].content);
const popupColor = computed(() => settings.themes[theme.value].popup);

const readWidth = computed(() => {
  if (!miniInterface.value && !isZenMode.value) {
    return store.config.readWidth + "px";
  } else {
    return "100%";
  }
});
const popupWidth = computed(() => {
  if (!miniInterface.value) {
    return store.config.readWidth - 33;
  } else {
    return window.innerWidth - 33;
  }
});
const bodyTheme = computed(() => {
  return {
    background: bodyColor.value
  };
});
const chapterTheme = computed(() => {
  return {
    background: chapterColor.value,
    width: isZenMode.value ? "100%" : readWidth.value
  };
});
const isZenMode = ref(false);
const toggleZenMode = () => {
  isZenMode.value = !isZenMode.value;
  if (isZenMode.value) {
    showToolBar.value = false;
  }
};
const showToolBar = ref(false);
const leftBarTheme = computed(() => {
  if (isZenMode.value) {
    if (miniInterface.value) {
      return {
        background: popupColor.value,
        color: fontColor.value,
        marginLeft: 0,
        display: showToolBar.value ? 'block' : 'none'
      };
    } else {
      return {
        background: popupColor.value,
        color: fontColor.value,
        left: '20px',
        marginLeft: '0px',
        top: '50vh',
        transform: 'translateY(-50%)',
        display: showToolBar.value ? 'block' : 'none',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
      };
    }
  }
  return {
    background: popupColor.value,
    color: fontColor.value,
    marginLeft: miniInterface.value ? 0 : -(store.config.readWidth / 2 + 68) + "px",
    display: miniInterface.value && !showToolBar.value ? "none" : "block"
  };
});
const rightBarTheme = computed(() => {
  if (isZenMode.value) {
    if (miniInterface.value) {
      return {
        background: popupColor.value,
        color: fontColor.value,
        marginRight: 0,
        display: showToolBar.value ? 'block' : 'none'
      };
    } else {
      return {
        background: popupColor.value,
        color: fontColor.value,
        right: '20px',
        left: 'auto',
        marginRight: '0px',
        bottom: '50vh',
        transform: 'translateY(50%)',
        display: showToolBar.value ? 'block' : 'none',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
      };
    }
  }
  return {
    background: popupColor.value,
    color: fontColor.value,
    marginRight: miniInterface.value ? 0 : -(store.config.readWidth / 2 + 52) + "px",
    display: miniInterface.value && !showToolBar.value ? "none" : "block"
  };
});
const isNight = computed(() => settings.themes[theme.value]?.isNight || false);

/**
 * pc移动端判断 最大阅读宽度修正
 * 阅读宽度最小为640px 加上工具栏 68px 52px 取较大值 为 776px
 */
const onResize = () => {
  store.setMiniInterface(window.innerWidth < 776);
  const width = store.config.readWidth; /**包含padding */
  checkPageWidth(width);
};
/** 判断阅读宽度是否超出页面 */
const checkPageWidth = (readWidth) => {
  if (store.miniInterface) return;
  if (readWidth + 2 * 68 > window.innerWidth) store.config.readWidth -= 160;
};
watch(
  () => store.config.readWidth,
  (width) => checkPageWidth(width)
);
// 顶部底部跳转
const top = ref();
const bottom = ref();
const toTop = () => {
  jump(top.value, { container: scrollContainer.value });
};
const toBottom = () => {
  jump(bottom.value, { container: scrollContainer.value });
};

// 书架路由切换
const router = useRouter();
const toShelf = () => {
  router.push("/");
};

// 目录切换
const popCataTogger = () => {
  popCataVisible.value = !popCataVisible.value;
};

// 获取章节内容
const chapterData = ref([]);
const noPoint = ref(true);
const MAX_CHAPTERS_IN_VIEW = 3; // 无限加载模式最多同时渲染章节数
const getContent = (index, reloadChapter = true, chapterPos = 0) => {
  if (reloadChapter) {
    //展示进度条
    store.setShowContent(false);
    //强制滚回顶层
    jump(top.value, { duration: 0 });
    //从目录，按钮切换章节时保存进度 预加载时不保存
    saveReadingBookProgressToBrowser(index, chapterPos);
    //加载新章节内容时，强制保存阅读进度到APP
    saveReadingBookProgressToApp(true);
    chapterData.value = [];
    topPadding.value = 0; // 重置顶部占位
  }
  let bookUrl = sessionStorage.getItem("bookUrl");
  let { title, index: chapterIndex } = catalog.value[index];

  loadingWrapper(
    API.getBookContent(bookUrl, chapterIndex).then(
      (res) => {
        if (res.data.isSuccess) {
          let data = res.data.data;
          let content = data.split(/\n+/);
          chapterData.value.push({ index, content, title });
          let outputText = `========== ${title} ==========\n\n` + content.join('\n\n');
          WEB.printToConsole(outputText);
        } else {
          ElMessage({ message: res.data.errorMsg, type: "error" });
          let content = [res.data.errorMsg];
          chapterData.value.push({ index, content, title });
        }
        store.setContentLoading(true);
        noPoint.value = false;
        store.setShowContent(true);
        // 必须在 setShowContent(true) 之后调用：ChapterContent 受 v-if="showContent" 控制
        // 此前 chapterRef 为空数组，scrollToReadedLength 无法定位段落
        if (reloadChapter) {
          nextTick(() => toChapterPos(chapterPos));
        }
        if (!res.data.isSuccess) {
          throw res.data;
        }
      },
      (err) => {
        ElMessage({ message: "获取章节内容失败", type: "error" });
        let content = ["获取章节内容失败！"];
        chapterData.value.push({ index, content, title });
        store.setShowContent(true);
        throw err;
      }
    )
  );
};

// 章节进度跳转和计算
const chapter = ref();
const chapterRef = ref();
const chapterDivRefs = ref([]);
const topPadding = ref(0);
const toChapterPos = (pos) => {
  // 优先用 exactScroll（章节相对偏移）进行像素级精确还原
  // fresh load 时 topPadding=0、单章，相对偏移 = 绝对 scrollTop，直接 scrollTo 即可
  const exactScrollKey = getExactScrollKey();
  const savedScroll = exactScrollKey ? localStorage.getItem(exactScrollKey) : null;
  if (savedScroll && Number(savedScroll) > 0) {
    isRestoringScroll = true;
    nextTick(() => {
      scrollContainer.value?.scrollTo({ top: Number(savedScroll), behavior: "instant" });
      setTimeout(() => { isRestoringScroll = false; }, 200);
    });
    return;
  }
  // 无 exactScroll 记录（全新章节）且有字符进度时，降级用段落定位
  if (pos > 0) {
    nextTick(() => {
      if (chapterRef.value?.length >= 1) chapterRef.value[0].scrollToReadedLength(pos);
    });
  }
};
const onReadedLengthChange = (index, pos) => {
  // 防止 VS Code 重置滚动条导致的进度归零
  if (pos === 0 && scrollContainer.value?.scrollTop === 0 && Date.now() - lastUserInteraction > 1000) {
    return;
  }
  
  if (infiniteLoading.value) {
    const data = chapterData.value.find((c) => c.index === index);
    if (data && data.content && data.content.length > 0) {
      const imgPattern = /<img[^>]*src="[^"]*(?:"[^>]+\})?"[^>]*>/g;
      const total = data.content.reduce((sum, para) => {
        return sum + (para ? para.replaceAll(imgPattern, " ").length : 0) + 1;
      }, 0);
      if (total > 0 && pos >= total - 1 && index < catalog.value.length - 1) {
        // 当前章节达到末尾直接算作下一章的开始
        saveReadingBookProgressToBrowser(index + 1, 0);
        saveReadingBookProgressToApp();
        return;
      }
    }
  }

  saveReadingBookProgressToBrowser(index, pos);
  saveReadingBookProgressToApp();
};

// 文档标题
watchEffect(() => {
  let title = catalog.value[chapterIndex.value]?.title;
  if(title) {
    let fullTitle = title + chapterProgress.value;
    document.title = fullTitle;
    WEB.setTitle(fullTitle);
  }
});

// 阅读记录保存浏览器
const saveReadingBookProgressToBrowser = (index, pos) => {
  //保存localStorage
  let bookUrl = sessionStorage.getItem("bookUrl");
  var book = JSON.parse(localStorage.getItem(bookUrl));
  book.index = index;
  book.chapterPos = pos;
  book.durChapterTime = new Date().getTime();
  localStorage.setItem(bookUrl, JSON.stringify(book));
  //最近阅读
  book = JSON.parse(localStorage.getItem("readingRecent"));
  book.chapterIndex = index;
  book.chapterPos = pos;
  book.durChapterTime = new Date().getTime();
  localStorage.setItem("readingRecent", JSON.stringify(book));
  //保存vuex
  chapterIndex.value = index;
  chapterPos.value = pos;
  //保存sessionStorage
  sessionStorage.setItem("chapterIndex", index);
  sessionStorage.setItem("chapterPos", String(pos));
};

// 阅读记录保存到APP
const lastSaveToAppTime = ref(0);
const lastBookProgress = ref(null);
const saveReadingBookProgressToApp = (force = false) => {
  if (isIdle.value && !force) return;
  let current = new Date().getTime();
  let pastTime = current - lastSaveToAppTime.value;
  if (force || pastTime >= 3000) {
    // 比对与最后一次保存时的状态是否一致
    let lbp = lastBookProgress.value || {};
    let cbp = bookProgress.value;
    let equals =
      lbp.name === cbp.name &&
      lbp.author === cbp.author &&
      lbp.durChapterIndex === cbp.durChapterIndex &&
      lbp.durChapterPos === cbp.durChapterPos &&
      lbp.durChapterTitle === cbp.durChapterTitle;
    if (!equals) {
      lastSaveToAppTime.value = current;
      lastBookProgress.value = cbp;
      API.saveBookProgress(bookProgress.value);
    }
  }
};

// 定时同步阅读进度到APP
const saveRBPToAppId = setInterval(saveReadingBookProgressToApp, 10_000);

// 进度同步
// 返回导航变化 同步请求会在获取书架前完成

const savedState = ref({ index: -1, pos: -1 });

const onVisibilityChange = () => {
  if (document.visibilityState == "hidden") {
    savedState.value = { index: chapterIndex.value, pos: chapterPos.value };
    API.saveBookProgressWithBeacon(bookProgress.value);
  } else if (document.visibilityState == "visible") {
    // 恢复由于VS Code webview隐藏再显示时导致的滚动条重置问题
    if (savedState.value.index !== -1 && savedState.value.pos !== -1) {
      setTimeout(() => {
        if (chapterIndex.value === savedState.value.index) {
          chapterPos.value = savedState.value.pos;
          toChapterPos(savedState.value.pos);
          saveReadingBookProgressToBrowser(savedState.value.index, savedState.value.pos);
        }
      }, 100);
      toChapterPos(savedState.value.pos);
    }
  }
};

// 章节切换
const toNextChapter = () => {
  store.setContentLoading(true);
  let index = chapterIndex.value + 1;
  if (typeof catalog.value[index] !== "undefined") {
    // 当前章已读完，删除其滚动记录
    const doneKey = getExactScrollKey();
    if (doneKey) localStorage.removeItem(doneKey);
    ElMessage({
      message: "下一章",
      type: "info"
    });
    getContent(index);
  } else {
    ElMessage({
      message: "本章是最后一章",
      type: "error"
    });
  }
};
const toPreChapter = () => {
  store.setContentLoading(true);
  let index = chapterIndex.value - 1;
  if (typeof catalog.value[index] !== "undefined") {
    ElMessage({
      message: "上一章",
      type: "info"
    });
    getContent(index);
  } else {
    ElMessage({
      message: "本章是第一章",
      type: "error"
    });
  }
};

// 无限滚动向下加载
let scrollObserver;
const loading = ref();
const loadingTop = ref();
let isLoadingPrev = false;
watchEffect(() => {
  if (!infiniteLoading.value) {
    scrollObserver?.disconnect();
  } else {
    scrollObserver?.observe(loading.value);
  }
});
// 无限滚动向上加载——监听顶部哨兵，用户滚入 paddingTop 区域时加载上一章
let topScrollObserver;
watchEffect(() => {
  if (!infiniteLoading.value || !loadingTop.value) {
    topScrollObserver?.disconnect();
    return;
  }
  topScrollObserver?.disconnect();
  topScrollObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) loadPrev();
    },
    { root: scrollContainer.value, rootMargin: '200px 0px 0px 0px' }
  );
  topScrollObserver.observe(loadingTop.value);
});

const loadMore = () => {
  let index = chapterData.value.slice(-1)[0]?.index;
  if (catalog.value.length - 1 > index) {
    // 滑动窗口：超出最大章节数时，移除最旧一章并用 paddingTop 补偿其高度
    if (chapterData.value.length >= MAX_CHAPTERS_IN_VIEW) {
      const firstDiv = chapterDivRefs.value[0];
      if (firstDiv) {
        topPadding.value += firstDiv.offsetHeight;
      }
      const removedIndex = chapterData.value[0].index;
      chapterData.value.shift();
      // topPadding 变化后窗口内所有章节的绝对 scrollTop 全部失效
      // 删除被移除章节及剩余章节的记录，让 onScroll 从当前位置重新开始记录
      const bookUrl = sessionStorage.getItem("bookUrl");
      if (bookUrl) {
        localStorage.removeItem(`exactScroll_${bookUrl}_${removedIndex}`);
        chapterData.value.forEach(ch => {
          localStorage.removeItem(`exactScroll_${bookUrl}_${ch.index}`);
        });
      }
    }
    getContent(index + 1, false);
  }
};

// 向上加载：将上一章内容插入到窗口顶部，减少 topPadding 或增加 scrollTop 保持滚动位置稳定
const loadPrev = () => {
  if (isLoadingPrev || isLoading.value) return;
  const firstIndex = chapterData.value[0]?.index;
  if (firstIndex === undefined || firstIndex <= 0) return;
  const prevIndex = firstIndex - 1;
  const bookUrl = sessionStorage.getItem("bookUrl");
  if (!bookUrl) return;
  const { title, index: catalogIndex } = catalog.value[prevIndex];
  isLoadingPrev = true;
  
  // 记录加载前原内容滚动高度
  const oldScrollTop = scrollContainer.value?.scrollTop || 0;
  
  API.getBookContent(bookUrl, catalogIndex).then((res) => {
    if (res.data.isSuccess) {
      const content = res.data.data.split(/\n+/);
      chapterData.value.unshift({ index: prevIndex, content, title });
      nextTick(() => {
        // 测量新插入章节的高度
        const newDiv = chapterDivRefs.value[0];
        const H = newDiv?.offsetHeight || 0;
        
        if (topPadding.value > 0) {
          // 如果有 topPadding 占位，从 topPadding 中扣除
          topPadding.value = Math.max(0, topPadding.value - H);
        } else {
          // 如果没有 topPadding 占位，将新章的高度补偿到 scrollTop，避免画面下跳
          if (scrollContainer.value) {
            scrollContainer.value.scrollTop = oldScrollTop + H;
          }
        }
        isLoadingPrev = false;
      });
    } else {
      isLoadingPrev = false;
    }
  }).catch(() => { isLoadingPrev = false; });
};

// IntersectionObserver回调 底部加载
const onReachBottom = (entries) => {
  if (isLoading.value) return;
  for (let { isIntersecting } of entries) {
    if (!isIntersecting) return;
    loadMore();
  }
};
// 绑定加载更多的观察者
let reobserveLoadingHandler;
const reobserveLoading = (force = false) => {
  // 使用cancelAnimationFrame避免resize时计算量过大浏览器卡死的情况
  if (reobserveLoadingHandler) {
    window.cancelAnimationFrame(reobserveLoadingHandler);
  }
  // 当已经绑定过加载更多或者强制的情况下才绑定，避免未连接到后端时错误的执行加载更多
  if (scrollObserver || force) {
    reobserveLoadingHandler = window.requestAnimationFrame(() => {
      // 已有观察则先取消
      scrollObserver?.disconnect();
      scrollObserver = new IntersectionObserver(onReachBottom, {
        // 解决vscode下rootMargin无效的问题
        root: scrollContainer.value || null,
        rootMargin: `-100% 0% 120%`
      });
      infiniteLoading.value && scrollObserver.observe(loading.value);
    });
  }
};

// 监听方向键
const handleKeyPress = (event) => {
  switch (event.key) {
    case "Q":
    case "q":
      event.stopPropagation();
      event.preventDefault();
      toShelf();
      break;
    case "E":
    case "e":
      event.stopPropagation();
      event.preventDefault();
      popCataTogger();
      break;
    case "R":
    case "r":
      event.stopPropagation();
      event.preventDefault();
      getContent(chapterIndex.value);
      break;
    case "F":
    case "f":
      event.stopPropagation();
      event.preventDefault();
      toggleZenMode();
      break;
    case "ArrowLeft":
    case "A":
    case "a":
      event.stopPropagation();
      event.preventDefault();
      toPreChapter();
      break;
    case "ArrowRight":
    case "D":
    case "d":
      event.stopPropagation();
      event.preventDefault();
      toNextChapter();
      break;
    case "ArrowUp":
    case "W":
    case "w":
      event.stopPropagation();
      event.preventDefault();
      if (scrollContainer.value?.scrollTop === 0) {
        ElMessage({
          message: "已到达页面顶部",
          type: "warn"
        });
      } else {
        jump(0 - scrollContainer.value?.clientHeight + 50, { duration: 100, container: scrollContainer.value });
      }
      break;
    case "ArrowDown":
    case "S":
    case "s":
      event.stopPropagation();
      event.preventDefault();
      if (
        scrollContainer.value?.clientHeight + scrollContainer.value?.scrollTop ===
        scrollContainer.value?.scrollHeight
      ) {
        ElMessage({
          message: "已到达页面底部",
          type: "warn"
        });
      } else {
        jump(scrollContainer.value?.clientHeight - 50, { duration: 100, container: scrollContainer.value });
      }
      break;
  }
};
onMounted(() => {
  //获取书籍数据
  let bookUrl = sessionStorage.getItem("bookUrl");
  let bookName = sessionStorage.getItem("bookName");
  let bookAuthor = sessionStorage.getItem("bookAuthor");
  let chapterIndex = Number(sessionStorage.getItem("chapterIndex") || 0);
  let chapterPos = Number(sessionStorage.getItem("chapterPos") || 0);
  var book = JSON.parse(localStorage.getItem(bookUrl));
  if (book == null || chapterIndex != book.index || chapterPos != book.chapterPos) {
    book = {
      bookName: bookName,
      bookAuthor: bookAuthor,
      bookUrl: bookUrl,
      index: chapterIndex,
      chapterPos: chapterPos
    };
    localStorage.setItem(bookUrl, JSON.stringify(book));
  }
  cleanupScrollRecords();
  onResize();
  window.addEventListener("resize", onResize);
  // window.addEventListener("resize", () => reobserveLoading());
  loadingWrapper(
    API.getChapterList(bookUrl).then(
      (res) => {
        if (!res.data.isSuccess) {
          ElMessage({ message: res.data.errorMsg, type: "error" });
          setTimeout(toShelf, 500);
          return;
        }
        let data = res.data.data;
        store.setCatalog(data);
        store.setReadingBook(book);

        getContent(chapterIndex, true, chapterPos);
        window.addEventListener("keyup", handleKeyPress);
        // 兼容Safari < 14
        document.addEventListener("visibilitychange", onVisibilityChange);
        // 监听底部加载，首次强制绑定
        reobserveLoading(true);
        //第二次点击同一本书 页面标题不会变化
        document.title = null;
        document.title = bookName + " | " + catalog.value[chapterIndex].title;
      },
      (err) => {
        ElMessage({ message: "获取书籍目录失败", type: "error" });
        throw err;
      }
    )
  );
});

onUnmounted(() => {
  // 清除计时器
  clearTimeout(idleTimer);
  // 清除定时保存阅读记录的定时任务
  clearInterval(saveRBPToAppId);
  window.removeEventListener("keyup", handleKeyPress);
  window.removeEventListener("resize", onResize);
  // 兼容Safari < 14
  document.removeEventListener("visibilitychange", onVisibilityChange);
  readSettingsVisible.value = false;
  popCataVisible.value = false;
  scrollObserver?.disconnect();
});
</script>

<style lang="scss" scoped>
:deep(.pop-setting) {
  margin-left: 68px;
  top: 0;
}

:deep(.pop-cata) {
  margin-left: 10px;
}

.page-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.chapter-header-area {
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  border-bottom: 1px solid rgba(128, 128, 128, 0.15);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  padding: 0 20px;
  cursor: pointer;
  user-select: none;

  .chapter-info {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    opacity: 0.85;
  }
}

.scroll-container {
  flex-grow: 1;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  /* 平滑滚动体验在VS Code中可能导致延迟，默认使用instant */
  scroll-behavior: auto;
}

.chapter-wrapper {
  padding: 0 4%;
  min-height: 101%; /* 确保始终可滚动 */
  position: relative;

  :deep(.no-point) {
    pointer-events: none;
  }

  .tool-bar {
    position: fixed;
    top: 36px;
    left: 50%;
    z-index: 100;

    .tools {
      display: flex;
      flex-direction: column;

      .tool-icon {
        font-size: 18px;
        width: 58px;
        height: 48px;
        text-align: center;
        padding-top: 12px;
        cursor: pointer;
        outline: none;

        .iconfont {
          font-family: iconfont;
          width: 16px;
          height: 16px;
          font-size: 16px;
          margin: 0 auto 6px;
        }

        .icon-text {
          font-size: 12px;
        }
      }
    }
  }

  .read-bar {
    position: fixed;
    bottom: 0;
    right: 50%;
    z-index: 100;

    .tools {
      display: flex;
      flex-direction: column;

      .tool-icon {
        font-size: 18px;
        width: 42px;
        height: 31px;
        padding-top: 12px;
        text-align: center;
        align-items: center;
        cursor: pointer;
        outline: none;
        margin-top: -1px;

        .iconfont {
          font-family: iconfont;
          width: 16px;
          height: 16px;
          font-size: 16px;
          margin: 0 auto 6px;
        }
      }
    }
  }

  .chapter {
    font-family: "Microsoft YaHei", PingFangSC-Regular, HelveticaNeue-Light, "Helvetica Neue Light",
      sans-serif;
    text-align: left;
    padding: 0 65px;
    min-height: 100vh;
    width: 670px;
    max-width: 100%;
    box-sizing: border-box;
    margin: 0 auto;

    .content {
      font-size: 18px;
      line-height: 1.8;
      font-family: "Microsoft YaHei", PingFangSC-Regular, HelveticaNeue-Light,
        "Helvetica Neue Light", sans-serif;

      .bottom-bar,
      .top-bar {
        height: 64px;
      }
    }
  }
}

.day {
  :deep(.popup) {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);
  }

  :deep(.tool-icon) {
    border: 1px solid rgba(0, 0, 0, 0.1);
    margin-top: -1px;
    color: #000;

    .icon-text {
      color: rgba(0, 0, 0, 0.4);
    }
  }

  :deep(.chapter) {
    border: 1px solid #d8d8d8;
    // color: #262626;
    color: v-bind(fontColorRef);
  }
}

.night {
  :deep(.popup) {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.48), 0 0 6px rgba(0, 0, 0, 0.16);
  }

  :deep(.tool-icon) {
    border: 1px solid #444;
    margin-top: -1px;
    color: #666;

    .icon-text {
      color: #666;
    }
  }

  :deep(.chapter) {
    border: 1px solid #444;
    // color: #666;
    color: v-bind(fontColorRef);
  }

  :deep(.popper__arrow) {
    background: #666;
  }
}

@media screen and (max-width: 776px) {
  .chapter-wrapper {
    padding: 0;

    .tool-bar {
      left: 0;
      width: 100vw;
      margin-left: 0 !important;

      .tools {
        flex-direction: row;
        justify-content: space-between;

        .tool-icon {
          border: none;
        }
      }
    }

    .read-bar {
      right: 0;
      width: 100vw;
      margin-right: 0 !important;

      .tools {
        flex-direction: row;
        justify-content: space-between;
        padding: 0 15px;

        .tool-icon {
          border: none;
          width: auto;

          .iconfont {
            display: inline-block;
          }
        }
      }
    }

    .chapter {
      width: 100vw !important;
      padding: 0 20px;
      box-sizing: border-box;
    }

    .chapter-title-side {
      writing-mode: horizontal-tb;
      top: auto;
      bottom: 5px;
      right: 10px;
      left: auto;
      transform: none;
      opacity: 0.7;
      font-size: 11px;
    }
  }
}
</style>
