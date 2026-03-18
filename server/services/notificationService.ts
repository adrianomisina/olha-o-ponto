import webpush from 'web-push';
import { User } from '../models/User';

const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || ''
};

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  webpush.setVapidDetails(
    'mailto:support@olhaoponto.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
}

export const sendPushNotification = async (userId: string, payload: any) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      return;
    }

    const notificationPayload = JSON.stringify(payload);

    const subscriptions = user.pushSubscriptions;
    const results = await Promise.allSettled(
      subscriptions.map(sub => 
        webpush.sendNotification(
          {
            endpoint: sub.endpoint!,
            keys: {
              p256dh: sub.keys!.p256dh!,
              auth: sub.keys!.auth!
            }
          },
          notificationPayload
        )
      )
    );

    // Clean up failed subscriptions
    const failedIndices = results
      .map((res, idx) => res.status === 'rejected' ? idx : -1)
      .filter(idx => idx !== -1);

    if (failedIndices.length > 0) {
      // Use a new array to avoid Mongoose DocumentArray type issues
      const newSubscriptions = user.pushSubscriptions!.filter((_, idx) => !failedIndices.includes(idx));
      user.pushSubscriptions = newSubscriptions as any;
      await user.save();
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

export const notifyAdmins = async (companyId: string, payload: any) => {
  try {
    const admins = await User.find({ companyId, role: 'admin' });
    await Promise.all(admins.map(admin => sendPushNotification(admin._id.toString(), payload)));
  } catch (error) {
    console.error('Error notifying admins:', error);
  }
};
