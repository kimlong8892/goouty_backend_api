import { Injectable } from '@nestjs/common';

@Injectable()
export class WebPushService {
  private readonly vapidPublicKey = 'BPIVK5Oa3vmJH7lEC5QmvTGcgd3OvruJQKNoghD4j_VL7m_GMZRBuh2i4ePqLQSajKrFKata5xZYtyN_wLldzUE';
  private readonly vapidPrivateKey = 'OgWENvG19p3D1hGRcYIRVnvcVdVOvUiflPZuT5FNYgQ';

  /**
   * Gửi thông báo push thực tế
   */
  async sendNotification(pushSubscription: string, payload: string): Promise<void> {
    try {
      console.log('Sending push notification:', {
        pushSubscription: JSON.parse(pushSubscription),
        payload: JSON.parse(payload)
      });
      
      // Thử import web-push dynamically
      let webpush;
      try {
        webpush = require('web-push');
      } catch (importError) {
        console.log('web-push package not installed, using fetch API instead');
        await this.sendNotificationViaFetch(pushSubscription, payload);
        return;
      }
      
      // Sử dụng web-push nếu có
      webpush.setVapidDetails(
        'mailto:goouty@example.com',
        this.vapidPublicKey,
        this.vapidPrivateKey
      );
      
      await webpush.sendNotification(
        JSON.parse(pushSubscription),
        payload,
        {
          TTL: 86400, // 24 hours
          urgency: 'high'
        }
      );
      
      console.log('Push notification sent successfully via web-push');
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  /**
   * Gửi thông báo push qua fetch API (fallback)
   */
  private async sendNotificationViaFetch(pushSubscription: string, payload: string): Promise<void> {
    try {
      const subscription = JSON.parse(pushSubscription);
      const payloadData = JSON.parse(payload);
      
      console.log('Sending push notification via fetch API to:', subscription.endpoint);
      console.log('Payload data:', payloadData);
      
      // Tạo VAPID JWT token (simplified version)
      const vapidHeader = this.createVapidHeader();
      
      // Tạo request để gửi push notification
      const response = await fetch(subscription.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Authorization': vapidHeader,
          'TTL': '86400',
          'Content-Encoding': 'aesgcm'
        },
        body: JSON.stringify({
          title: payloadData.title,
          body: payloadData.message,
          data: payloadData.data,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'goouty-notification',
          requireInteraction: true
        })
      });
      
      console.log('Push notification response status:', response.status);
      console.log('Push notification response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Push notification error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      console.log('Push notification sent successfully via fetch API');
    } catch (error) {
      console.error('Error sending push notification via fetch:', error);
      throw error;
    }
  }

  /**
   * Tạo VAPID header đơn giản
   */
  private createVapidHeader(): string {
    // Simplified VAPID header - trong thực tế cần tạo JWT token
    const vapidInfo = {
      aud: 'https://web.push.apple.com',
      exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
      sub: 'mailto:goouty@example.com'
    };
    
    return `vapid t=${this.vapidPublicKey}, k=${this.vapidPublicKey}`;
  }

  getVapidPublicKey(): string {
    return this.vapidPublicKey;
  }
}
