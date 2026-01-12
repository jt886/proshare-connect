self.addEventListener('push', function (event) {
    if (!event.data) return;

    const data = event.data.json();
    const title = data.title || '新着メッセージ';
    const options = {
        body: data.body || 'メッセージが届きました',
        icon: '/icon-192x192.png', // アイコンがあれば設定（なければデフォルト）
        badge: '/badge.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/chat', // 通知クリック時の飛び先
        },
    };

    // バックグラウンドでも通知を表示し続けるためにwaitUntilを使用
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    // 通知をタップしたときにアプリ（ウィンドウ）を開く、またはフォーカスする
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // 既に開いているタブがあればフォーカス
            for (let i = 0; i < clientList.length; i++) {
                let client = clientList[i];
                if (client.url && 'focus' in client) {
                    return client.focus().then((focusedClient) => {
                        // 必要ならページ遷移させる
                        return focusedClient.navigate(event.notification.data.url);
                    });
                }
            }
            // 開いていなければ新しく開く
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url);
            }
        })
    );
});
