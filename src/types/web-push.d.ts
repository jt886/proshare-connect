declare module 'web-push' {
    export interface PushSubscription {
        endpoint: string;
        keys: {
            p256dh: string;
            auth: string;
        };
    }

    export interface SendNotificationOptions {
        TTL?: number;
        vapidDetails?: {
            subject: string;
            publicKey: string;
            privateKey: string;
        };
        headers?: {
            [key: string]: string;
        };
    }

    export interface SendResult {
        statusCode: number;
        body: string;
        headers: {
            [key: string]: string;
        };
    }

    export function setVapidDetails(
        subject: string,
        publicKey: string,
        privateKey: string
    ): void;

    export function sendNotification(
        subscription: PushSubscription | any,
        payload?: string | Buffer,
        options?: SendNotificationOptions
    ): Promise<SendResult>;

    export function generateVAPIDKeys(): {
        publicKey: string;
        privateKey: string;
    };
}
