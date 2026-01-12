self.addEventListener('push', function (event) {
    // データが空なら何もしない
    if (!event.data) return;

    const data = event.data.json();
    const title = data.title || '新着メッセージ';
    const options = {
        body: data.body || 'メッセージが届きました',
        icon: '/icon-192x192.png', // アイコンがない場合はデフォルトになります
        badge: '/badge.png',
        data: {
            url: data.url || '/chat',
        },
        // 以下はスマホでの挙動を安定させる設定
        vibrate: [100, 50, 100],
        requireInteraction: true, // ユーザーが操作するまで通知を消さない（重要）
    };

    // 重要: event.waitUntil を使って、通知表示が完了するまでSWを待機させる
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    // 通知タップ時にアプリを開く処理
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // 既に開いているタブがあればフォーカス
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url && 'focus' in client) {
                    return client.focus().then((focusedClient) => {
                        // チャット画面へ移動
                        return focusedClient.navigate(event.notification.data.url);
                    });
                }
            }
            // 開いていなければ新規で開く
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url);
            }
        })
    );
});
