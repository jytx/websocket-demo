import {Injectable} from '@angular/core';
import {interval, Subject} from 'rxjs';

/**
 * websocket服务
 * @author LiQun
 * @date 2019/1/25
 */
@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  messageSubject;                                 // subject对象,用于发送事件
  private url;                                    // 默认请求的url
  private webSocket: WebSocket;                   // websocket对象
  connectSuccess = false;                         // websocket 连接成功
  period = 60 * 1000 * 10;                        // 10分钟检查一次
  serverTimeoutSubscription = null;               // 定时检测连接对象
  reconnectFlag = false;                          // 重连
  reconnectPeriod = 5 * 1000;                     // 重连失败,则5秒钟重连一次
  reconnectSubscription = null;                   // 重连订阅对象
  runTimeSubscription;                            // 记录运行连接subscription
  runTimePeriod = 60 * 10000;                     // 记录运行连接时间

  constructor() {
    this.messageSubject = new Subject();
    console.log('开始心跳检测');
    // 进入程序就进行心跳检测,避免出现开始就连接中断,后续不重连
    this.heartCheckStart();
    this.calcRunTime();
  }

  /**
   * 发送消息
   * @author LiQun
   * @date 2019/1/22
   * @param message 发送消息
   */
  sendMessage(message) {
    this.webSocket.send(message);
  }

  /**
   * 创建新连接
   * @author LiQun
   * @date 2019/1/22
   * @param url 要连接的url
   */
  connect(url) {
    if (!!url) {
      this.url = url;
    }
    // 创建websocket对象
    this.createWebSocket();
  }

  /**
   * 创建连接
   * @author LiQun
   * @date 2019/1/22
   */
  createWebSocket() {
    // 如果没有建立过连接，才建立连接并且添加时间监听
    this.webSocket = new WebSocket(this.url);
    // 建立连接成功
    this.webSocket.onopen = (e) => this.onOpen(e);
    // 接收到消息
    this.webSocket.onmessage = (e) => this.onMessage(e);
    // 连接关闭
    this.webSocket.onclose = (e) => this.onClose(e);
    // 异常
    this.webSocket.onerror = (e) => this.onError(e);
  }

  /**
   * 连接打开
   * @author LiQun
   * @date 2019/1/22
   * @param e 打开事件
   */
  onOpen(e) {
    console.log('websocket 已连接');
    // 设置连接成功
    this.connectSuccess = true;
    // 如果是重连中
    if (this.reconnectFlag) {
      // 1.停止重连
      this.stopReconnect();
      // 2.重新开启心跳
      this.heartCheckStart();
      // 3.重新开始计算运行时间
      this.calcRunTime();
    }
  }

  /**
   * 接受到消息
   * @author LiQun
   * @date 2019/1/22
   * @param event 接受消息事件
   */
  onMessage(event) {
    console.log('接收到的消息', event.data);
    // 将接受到的消息发布出去
    const message = JSON.parse(event.data);
    console.log('接收到消息时间', new Date().getTime());
    this.messageSubject.next(message);
  }

  /**
   * 连接关闭
   * @author LiQun
   * @date 2019/1/22
   */
  private onClose(e) {
    console.log('连接关闭', e);
    this.connectSuccess = false;
    this.webSocket.close();
    // 关闭时开始重连
    this.reconnect();
    this.stopRunTime();
    // throw new Error('webSocket connection closed:)');
  }

  /**
   * 连接异常
   * @author LiQun
   * @date 2019/1/22
   */
  private onError(e) {
    // 出现异常时一定会进onClose,所以只在onClose做一次重连动作
    console.log('连接异常', e);
    this.connectSuccess = false;
    // throw new Error('webSocket connection error:)');
  }

  /**
   * 开始重新连接
   * @author LiQun
   * @date 2019/1/22
   */
  reconnect() {
    // 如果已重连,则直接return,避免重复连接
    if (this.connectSuccess) {
      this.stopReconnect();
      console.log('已经连接成功,停止重连');
      return;
    }
    // 如果正在连接中,则直接return,避免产生多个轮训事件
    if (this.reconnectFlag) {
      console.log('正在重连,直接返回');
      return;
    }
    // 开始重连
    this.reconnectFlag = true;
    // 如果没能成功连接,则定时重连
    this.reconnectSubscription = interval(this.reconnectPeriod).subscribe(async (val) => {
      console.log(`重连:${val}次`);
      const url = this.url;
      // 重新连接
      this.connect(url);
    });
  }

  /**
   * 停止重连
   * @author LiQun
   * @date 2019/1/22
   */
  stopReconnect() {
    // 连接标识置为false
    this.reconnectFlag = false;
    // 取消订阅
    if (typeof this.reconnectSubscription !== 'undefined' && this.reconnectSubscription != null) {
      this.reconnectSubscription.unsubscribe();
    }
  }

  /**
   * 开始心跳检测
   * @author LiQun
   * @date 2019/1/22
   */
  heartCheckStart() {
    this.serverTimeoutSubscription = interval(this.period).subscribe((val) => {
      // 保持连接状态,重置下
      if (this.webSocket != null && this.webSocket.readyState === 1) {
        console.log(val, '连接状态，发送消息保持连接');
      } else {
        // 停止心跳
        this.heartCheckStop();
        // 开始重连
        this.reconnect();
        console.log('连接已断开,重新连接');
      }
    });
  }

  /**
   * 停止心跳检测
   * @author LiQun
   * @date 2019/1/22
   */
  heartCheckStop() {
    // 取消订阅停止心跳
    if (typeof this.serverTimeoutSubscription !== 'undefined' && this.serverTimeoutSubscription != null) {
      this.serverTimeoutSubscription.unsubscribe();
    }
  }

  /**
   * 开始计算运行时间
   * @author LiQun
   * @date 2019/1/25
   */
  calcRunTime() {
    this.runTimeSubscription = interval(this.runTimePeriod).subscribe(period => {
      console.log('运行时间', `${period}分钟`);
    });
  }

  /**
   * 停止计算运行时间
   * @author LiQun
   * @date 2019/1/25
   */
  stopRunTime() {
    if (typeof this.runTimeSubscription !== 'undefined' && this.runTimeSubscription !== null) {
      this.runTimeSubscription.unsubscribe();
    }
  }
}
