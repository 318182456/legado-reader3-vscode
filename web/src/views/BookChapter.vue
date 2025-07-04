<template>
  <div
    class="chapter-wrapper"
    :style="bodyTheme"
    :class="{ night: isNight, day: !isNight }"
    @click="showToolBar = !showToolBar"
  >
    <div class="tool-bar" :style="leftBarTheme">
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
    <div class="read-bar" :style="rightBarTheme">
      <div class="tools">
        <div class="tool-icon" :class="{ 'no-point': noPoint }" @click="toPreChapter">
          <div class="iconfont">&#58920;</div>
          <span v-if="miniInterface">上一章</span>
        </div>
        <div class="tool-icon" :class="{ 'no-point': noPoint }" @click="toNextChapter">
          <span v-if="miniInterface">下一章</span>
          <div class="iconfont">&#58913;</div>
        </div>
      </div>
    </div>
    <div class="chapter-bar"></div>
    <div class="chapter" ref="content" :style="chapterTheme">
      <div class="content">
        <div class="top-bar" ref="top"></div>
        <div v-for="data in chapterData" :key="data.index" :chapterIndex="data.index" ref="chapter">
          <chapter-content
            ref="chapterRef"
            :chapterIndex="data.index"
            :contents="data.content"
            :title="data.title"
            :spacing="store.config.spacing"
            :fontSize="fontSize"
            :fontFamily="fontFamily"
            @readedLengthChange="onReadedLengthChange"
            v-if="showContent"
          />
        </div>
        <div class="loading" ref="loading"></div>
        <div class="bottom-bar" ref="bottom"></div>
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
  if (!miniInterface.value) {
    return store.config.readWidth - 130 + "px";
  } else {
    return window.innerWidth + "px";
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
    width: readWidth.value
  };
});
const showToolBar = ref(false);
const leftBarTheme = computed(() => {
  return {
    background: popupColor.value,
    marginLeft: miniInterface.value ? 0 : -(store.config.readWidth / 2 + 68) + "px",
    display: miniInterface.value && !showToolBar.value ? "none" : "block"
  };
});
const rightBarTheme = computed(() => {
  return {
    background: popupColor.value,
    marginRight: miniInterface.value ? 0 : -(store.config.readWidth / 2 + 52) + "px",
    display: miniInterface.value && !showToolBar.value ? "none" : "block"
  };
});
const isNight = computed(() => theme.value == 6 || theme.value == 7);

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
  jump(top.value);
};
const toBottom = () => {
  jump(bottom.value);
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
          if (reloadChapter) toChapterPos(chapterPos);
        } else {
          ElMessage({ message: res.data.errorMsg, type: "error" });
          let content = [res.data.errorMsg];
          chapterData.value.push({ index, content, title });
        }
        store.setContentLoading(true);
        noPoint.value = false;
        store.setShowContent(true);
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
const toChapterPos = (pos) => {
  nextTick(() => {
    if (chapterRef.value.length === 1) chapterRef.value[0].scrollToReadedLength(pos);
  });
};
const onReadedLengthChange = (index, pos) => {
  saveReadingBookProgressToBrowser(index, pos);
  saveReadingBookProgressToApp();
};

// 文档标题
watchEffect(() => {
  document.title = catalog.value[chapterIndex.value]?.title || document.title;
});

// 阅读记录保存浏览器
const saveReadingBookProgressToBrowser = (index, pos) => {
  //保存localStorage
  let bookUrl = sessionStorage.getItem("bookUrl");
  var book = JSON.parse(localStorage.getItem(bookUrl));
  book.index = index;
  book.chapterPos = pos;
  localStorage.setItem(bookUrl, JSON.stringify(book));
  //最近阅读
  book = JSON.parse(localStorage.getItem("readingRecent"));
  book.chapterIndex = index;
  book.chapterPos = pos;
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

/**
 * VisibilityChange https://developer.mozilla.org/zh-CN/docs/Web/API/Document/visibilitychange_event
 * 监听关闭页面 切换tab 返回桌面 等操作
 * 注意不用监听点击链接导航变化 不对Safari<14.5兼容处理
 **/
const onVisibilityChange = () => {
  if (document.visibilityState == "hidden") {
    API.saveBookProgressWithBeacon(bookProgress.value);
  }
};

// 章节切换
const toNextChapter = () => {
  store.setContentLoading(true);
  let index = chapterIndex.value + 1;
  if (typeof catalog.value[index] !== "undefined") {
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

// 无限滚动
let scrollObserver;
const loading = ref();
watchEffect(() => {
  if (!infiniteLoading.value) {
    scrollObserver?.disconnect();
  } else {
    scrollObserver?.observe(loading.value);
  }
});
const loadMore = () => {
  let index = chapterData.value.slice(-1)[0]?.index;
  if (catalog.value.length - 1 > index) {
    getContent(index + 1, false);
  }
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
        root: WEB.isVscode() ? document : null,
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
      if (document.documentElement.scrollTop === 0) {
        ElMessage({
          message: "已到达页面顶部",
          type: "warn"
        });
      } else {
        jump(0 - document.documentElement.clientHeight + 50, { duration: 100 });
      }
      break;
    case "ArrowDown":
    case "S":
    case "s":
      event.stopPropagation();
      event.preventDefault();
      if (
        document.documentElement.clientHeight + document.documentElement.scrollTop ===
        document.documentElement.scrollHeight
      ) {
        ElMessage({
          message: "已到达页面底部",
          type: "warn"
        });
      } else {
        jump(document.documentElement.clientHeight - 50, { duration: 100 });
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

.chapter-wrapper {
  padding: 0 4%;

  overflow-x: hidden;

  :deep(.no-point) {
    pointer-events: none;
  }

  .tool-bar {
    position: fixed;
    top: 0;
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
  }
}
</style>
