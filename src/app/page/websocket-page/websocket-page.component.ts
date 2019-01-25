import {Component, OnInit} from '@angular/core';
import {WebsocketService} from '../../service/websocket/websocket.service';
import {ActivatedRoute, Params} from '@angular/router';

@Component({
  selector: 'app-websocket-page',
  templateUrl: './websocket-page.component.html',
  styleUrls: ['./websocket-page.component.css']
})
export class WebsocketPageComponent implements OnInit {
  messages = [];                      // 消息列表
  message;                            // 发送的消息内容
  error: any;                         // 异常信息
  completed = false;                  // 发送完成
  type = SEND_TYPE.ALL;               // 默认类型发送给所有人
  users = [];                         // 登陆的用户
  sendToUser;                         // 需要发送消息的用户
  currentUser;                        // 当前用户
  constructor(
    private webSocketService: WebsocketService,
    private activatedRoute: ActivatedRoute
  ) {
    // 从路由中获取参数
    this.activatedRoute.params.subscribe((params: Params) => {
      this.currentUser = params['id'];
    });
  }

  ngOnInit(): void {
    // 连接websocket
    this.webSocketService.connect(`ws://localhost:8080/ws//echo?id=${this.currentUser}`);
    // 接收消息
    this.webSocketService.messageSubject.subscribe(
      data => {
        // 如果是用户登陆,则添加到登陆列表中
        if (data.users) {
          this.users = data.users;
        } else {
          // 否则添加到消息列表
          this.messages.push(data.msg);
        }
      },
      err => this.error = err,
      () => this.completed = true
    );
  }

  /**
   * 发送消息
   * @author LiQun
   * @date 2019/1/25
   */
  send() {
    // 创建消息对象
    const msg = {
      msg: this.message,                                                    // 消息内容
      type: this.type === SEND_TYPE.ALL ? SEND_TYPE.ALL : SEND_TYPE.SINGLE, // 类型
      to: this.type === SEND_TYPE.SINGLE ? this.sendToUser : undefined            // 要发送的对象
    };
    // 发送
    this.webSocketService.sendMessage(JSON.stringify(msg));
    // 发送完成,情况message内容
    this.message = '';
  }
}

export enum SEND_TYPE {
  ALL = 'all',
  SINGLE = 'single'
}
