<?php

use App\Models\User;

it('broadcasts notifications on the custom user notification channel', function (): void {
    $user = new User();
    $user->forceFill(['id' => 42]);

    expect($user->receivesBroadcastNotificationsOn())->toBe('user.notifications.42');
});
