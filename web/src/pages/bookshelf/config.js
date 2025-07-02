import API from "@api";
import { useBookStore } from "@/store";
import "@/assets/bookshelf.css";
import WEB from "@/api/web";

/**
 * 加载配置
 */
API.getReadConfig().then((res) => {
  var data = res.data.data;
  if (data) {
    const bookStore = useBookStore();
    let config = WEB.isReader3() ? data : JSON.parse(data);
    let defaultConfig = bookStore.config;
    config = Object.assign(defaultConfig, config);
    bookStore.setConfig(config);
  }
});
