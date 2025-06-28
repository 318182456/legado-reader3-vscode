import axios from "axios";
import WEB from "@/api/web";

const SECOND = 1000;

const ajax = axios.create({
  baseURL: WEB.getLegadoWebServeUrl(),
  timeout: 120 * SECOND
});

const backGet = ajax.get.bind(ajax);
const backPost = ajax.post.bind(ajax);

const get = (url) => {
  if (WEB.isReader3()) {
    url = `${url}${url.includes("?") ? "&" : "?"}accessToken=${WEB.getReader3Token()}`;
  }
  return backGet(url);
};

const post = (url, data) => {
  url = WEB.isReader3() ? `${url}?accessToken=${WEB.getReader3Token()}` : url;
  return backPost(url, data);
};

ajax.get = get;
ajax.post = post;

export default ajax;
