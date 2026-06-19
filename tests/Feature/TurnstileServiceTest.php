<?php

use App\Services\TurnstileService;
use Illuminate\Support\Facades\Http;

test('turnstile validation passes without external request when captcha is disabled', function () {
    config(['captcha.enabled' => false]);

    Http::preventStrayRequests();

    expect(app(TurnstileService::class)->validate('', '127.0.0.1'))->toBeTrue();
});
