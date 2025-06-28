import axios from "axios";

// @ts-ignore
const vscode = typeof acquireVsCodeApi === "function" ? acquireVsCodeApi() : undefined;

let _isReader3 = false;

const isVscode = () => !!vscode;

const isReader3 = () => {
  return !!_isReader3;
};

const setIsReader3 = (isReader3) => {
  _isReader3 = isReader3;
};

const getReader3Info = (str) => {
  const regex = /^https:\/\/([^@]+)@([^:]+):([^/]+)\/(.*)$/;
  const match = str.match(regex);
  const username = match[1];
  const password = match[2];
  const address = match[3] + "/" + match[4];
  const http = str.startsWith("https://") ? "https://" : "http://";
  return {
    http,
    username,
    password,
    address
  };
};

const loginReader3 = async (http, username, password, address) => {
  const res = await axios.post(`${http}${address}/login`, {
    isLogin: true,
    username,
    password
  });

  if (res.data.isSuccess) {
    localStorage.setItem("reader3Token", res.data.data.accessToken);
  }
};

const getReader3Token = () => {
  return localStorage.getItem("reader3Token");
};

const getBaseLegadoWebServeUrl = () => {
  return localStorage.getItem("legadoWebServeUrl") || import.meta.env.VITE_API || location.origin;
};

const clearLegadoWebServeUrl = () => {
  localStorage.removeItem("legadoWebServeUrl");
};

const getLegadoWebServeUrl = () => {
  let legadoWebServeUrl = localStorage.getItem("legadoWebServeUrl");
  if (legadoWebServeUrl && legadoWebServeUrl.endsWith("/reader3")) {
    setIsReader3(true);
  }
  if (legadoWebServeUrl && isReader3()) {
    const { http, address } = getReader3Info(legadoWebServeUrl);
    legadoWebServeUrl = `${http}${address}`;
  }
  return legadoWebServeUrl || import.meta.env.VITE_API || location.origin;
};

const setLegadoWebServeUrl = (url) => {
  localStorage.setItem("legadoWebServeUrl", url);
  if (vscode) {
    vscode.postMessage({
      command: "setConfiguration",
      key: "legado-reader3-vscode.webServeUrl",
      value: url
    });
  }
};

const checkLegadoWebServeUrl = async (url) => {
  if (url.endsWith("/reader3")) {
    const { http, username, password, address } = getReader3Info(url);
    await loginReader3(http, username, password, address);
    url = `${http}${address}`;
  }
  await axios
    .create({
      baseURL: url,
      timeout: 3000
    })
    .get(`/getBookshelf${isReader3() ? "?accessToken=" + getReader3Token() : ""}`);
  return Promise.resolve(true);
};

const reload = () => {
  if (vscode) {
    vscode.postMessage({
      command: "reload"
    });
  } else {
    location.reload();
  }
};

export default {
  isVscode,
  isReader3,
  setIsReader3,
  getReader3Token,
  getLegadoWebServeUrl,
  getBaseLegadoWebServeUrl,
  clearLegadoWebServeUrl,
  setLegadoWebServeUrl,
  checkLegadoWebServeUrl,
  reload
};
