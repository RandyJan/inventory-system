<?php

use App\Models\User;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Support\Facades\Event;

test('login and logout are stored in audit logs', function () {
    $user = User::factory()->create();

    Event::dispatch(new Login('web', $user, false));
    Event::dispatch(new Logout('web', $user));

    $this->assertDatabaseHas('activity_log', [
        'log_name' => 'authentication',
        'description' => 'User logged in',
        'causer_id' => $user->id,
        'causer_type' => User::class,
    ]);

    $this->assertDatabaseHas('activity_log', [
        'log_name' => 'authentication',
        'description' => 'User logged out',
        'causer_id' => $user->id,
        'causer_type' => User::class,
    ]);
});
